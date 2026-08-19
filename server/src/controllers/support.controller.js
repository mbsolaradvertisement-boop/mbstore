const { body } = require("express-validator");
const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");
const bcrypt = require("bcryptjs");

exports.validation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Full name must be between 2 and 120 characters."),
  body("email").trim().toLowerCase().isEmail().withMessage("Enter a valid email address.").isLength({ max: 254 }),
  body("gender").isIn(["Male", "Female", "Other"]).withMessage("Select a valid gender."),
  body("password").optional().isLength({ min: 8 }).withMessage("Password must contain at least 8 characters."),
  body("confirmPassword").optional().custom((value,{req})=>value===req.body.password).withMessage("Passwords do not match."),
];
const present = row => ({ id: row.id, supportId:row.support_id, name: row.name, email: row.email, gender: row.gender, role: row.role, status: row.status === "Verified" ? "active" : "inactive", created_at: row.created_at, updated_at: row.updated_at });
function handleDuplicate(error) { if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "An account with this email already exists.", "DUPLICATE_EMAIL"); throw error; }

exports.list = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10)); const offset = (page - 1) * limit;
  const where = ["role='Support'"]; const params = [];
  if (req.query.search?.trim()) { where.push("(name LIKE ? OR email LIKE ?)"); const q = `%${req.query.search.trim()}%`; params.push(q, q); }
  if (["active", "inactive"].includes(req.query.status)) { where.push("status=?"); params.push(req.query.status === "active" ? "Verified" : "Inactive"); }
  const clause = where.join(" AND ");
  const [[count], [rows]] = await Promise.all([pool.execute(`SELECT COUNT(*) total FROM users WHERE ${clause}`, params), pool.execute(`SELECT u.id,sp.support_id,u.name,u.email,u.gender,u.role,u.status,u.created_at,u.updated_at FROM users u LEFT JOIN support_profiles sp ON sp.user_id=u.id WHERE ${clause} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params)]);
  const total = Number(count[0].total); res.json({ success: true, data: rows.map(present), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
};
exports.one = async (req, res) => { const [rows] = await pool.execute("SELECT u.id,sp.support_id,u.name,u.email,u.gender,u.role,u.status,u.created_at,u.updated_at FROM users u LEFT JOIN support_profiles sp ON sp.user_id=u.id WHERE u.id=? AND u.role='Support'", [req.params.id]); if (!rows[0]) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); res.json({ success: true, support: present(rows[0]) }); };
exports.create = async (req, res) => { const connection=await pool.getConnection();try { await connection.beginTransaction();const passwordHash=await bcrypt.hash(req.body.password||"Pass@123456",12);const [result] = await connection.execute("INSERT INTO users (name,email,password_hash,gender,role,status,login_allowed,email_verified) VALUES (?,?,?,?,'Support','Verified',TRUE,TRUE)", [req.body.name.trim(), req.body.email.trim().toLowerCase(), passwordHash, req.body.gender]);const supportId=`MBS-SUP-${String(result.insertId).padStart(6,'0')}`;await connection.execute("INSERT INTO support_profiles (user_id,support_id) VALUES (?,?)",[result.insertId,supportId]);await connection.commit();const [rows] = await pool.execute("SELECT u.id,sp.support_id,u.name,u.email,u.gender,u.role,u.status,u.created_at,u.updated_at FROM users u JOIN support_profiles sp ON sp.user_id=u.id WHERE u.id=?", [result.insertId]); res.status(201).json({ success: true, message: "Support user created successfully", support: present(rows[0]) }); } catch (error) {await connection.rollback();handleDuplicate(error);}finally{connection.release()} };
exports.update = async (req, res) => { try { const [result] = await pool.execute("UPDATE users SET name=?,email=?,gender=? WHERE id=? AND role='Support'", [req.body.name.trim(), req.body.email.trim().toLowerCase(), req.body.gender, req.params.id]); if (!result.affectedRows) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); return exports.one(req, res); } catch (error) { handleDuplicate(error); } };
exports.status = async (req, res) => { const active = req.body.status === "active"; const [result] = await pool.execute("UPDATE users SET status=?,login_allowed=? WHERE id=? AND role='Support'", [active ? "Verified" : "Inactive", active, req.params.id]); if (!result.affectedRows) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); if (!active) await pool.execute("DELETE FROM sessions WHERE user_id=?", [req.params.id]); res.json({ success: true, message: `Support user ${active ? "activated" : "deactivated"} successfully.` }); };

exports.analytics = async (_req, res) => {
  const [summary, agents, customers, categories, priorities, recent] = await Promise.all([
    pool.execute(`SELECT COUNT(*) totalIssues,SUM(status NOT IN ('Resolved','Closed')) openIssues,
      SUM(status IN ('Resolved','Closed')) resolvedIssues,SUM(support_id IS NULL) unassignedIssues,
      SUM(priority IN ('High','Critical') AND status NOT IN ('Resolved','Closed')) urgentIssues,
      COUNT(DISTINCT customer_id) affectedCustomers,COUNT(DISTINCT seller_id) affectedSellers,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,first_response_at)),0) avgFirstResponseMinutes,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,resolved_at)),0) avgResolutionMinutes FROM support_tickets`),
    pool.execute(`SELECT u.id,sp.support_id supportId,u.name,u.email,u.status,
      COUNT(t.id) totalAssigned,SUM(t.status NOT IN ('Resolved','Closed')) openTickets,
      SUM(t.status IN ('Resolved','Closed')) resolvedTickets,SUM(t.priority IN ('High','Critical') AND t.status NOT IN ('Resolved','Closed')) urgentTickets,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE,t.created_at,t.first_response_at)),0) avgFirstResponseMinutes,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE,t.created_at,t.resolved_at)),0) avgResolutionMinutes,
      MAX(t.updated_at) lastActivity
      FROM users u LEFT JOIN support_profiles sp ON sp.user_id=u.id LEFT JOIN support_tickets t ON t.support_id=u.id
      WHERE u.role='Support' GROUP BY u.id,sp.support_id ORDER BY openTickets DESC,totalAssigned DESC,u.name`),
    pool.execute(`SELECT cp.customer_id customerId,cp.customer_name customerName,cp.email,
      COUNT(t.id) totalIssues,SUM(t.status NOT IN ('Resolved','Closed')) openIssues,MAX(t.updated_at) lastActivity,
      SUBSTRING_INDEX(GROUP_CONCAT(t.subject ORDER BY t.updated_at DESC SEPARATOR '||'),'||',1) latestIssue
      FROM support_tickets t JOIN customer_profiles cp ON cp.user_id=t.customer_id
      GROUP BY cp.user_id ORDER BY totalIssues DESC,lastActivity DESC LIMIT 10`),
    pool.execute("SELECT category name,COUNT(*) value FROM support_tickets GROUP BY category ORDER BY value DESC"),
    pool.execute("SELECT priority name,COUNT(*) value FROM support_tickets GROUP BY priority ORDER BY FIELD(priority,'Critical','High','Medium','Low')"),
    pool.execute(`SELECT t.id,t.ticket_number ticketNumber,t.subject,t.category,t.priority,t.status,t.created_at createdAt,
      cu.name customerName,cp.customer_id customerId,su.name sellerName,sp.company_name sellerCompany,au.name supportName,
      p.product_name productName,q.quotation_number quotationNumber
      FROM support_tickets t LEFT JOIN users cu ON cu.id=t.customer_id LEFT JOIN customer_profiles cp ON cp.user_id=t.customer_id
      LEFT JOIN users su ON su.id=t.seller_id LEFT JOIN seller_profiles sp ON sp.user_id=t.seller_id
      LEFT JOIN users au ON au.id=t.support_id LEFT JOIN products p ON p.id=t.related_product_id
      LEFT JOIN quotation_requests q ON q.id=t.related_quotation_id ORDER BY t.created_at DESC LIMIT 12`)
  ]);
  const numeric = row => Object.fromEntries(Object.entries(row || {}).map(([key,value]) => [key, typeof value === "number" ? value : value === null ? 0 : Number.isNaN(Number(value)) ? value : Number(value)]));
  res.json({summary:numeric(summary[0][0]),agents:agents[0].map(numeric),customers:customers[0].map(numeric),categories:categories[0].map(numeric),priorities:priorities[0].map(numeric),recentIssues:recent[0]});
};
