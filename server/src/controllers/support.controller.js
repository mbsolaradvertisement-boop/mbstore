const { body } = require("express-validator");
const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

exports.validation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Full name must be between 2 and 120 characters."),
  body("email").trim().toLowerCase().isEmail().withMessage("Enter a valid email address.").isLength({ max: 254 }),
  body("gender").isIn(["Male", "Female", "Other"]).withMessage("Select a valid gender."),
];
const present = row => ({ id: row.id, name: row.name, email: row.email, gender: row.gender, role: row.role, status: row.status === "Verified" ? "active" : "inactive", created_at: row.created_at, updated_at: row.updated_at });
function handleDuplicate(error) { if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "An account with this email already exists.", "DUPLICATE_EMAIL"); throw error; }

exports.list = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10)); const offset = (page - 1) * limit;
  const where = ["role='Support'"]; const params = [];
  if (req.query.search?.trim()) { where.push("(name LIKE ? OR email LIKE ?)"); const q = `%${req.query.search.trim()}%`; params.push(q, q); }
  if (["active", "inactive"].includes(req.query.status)) { where.push("status=?"); params.push(req.query.status === "active" ? "Verified" : "Inactive"); }
  const clause = where.join(" AND ");
  const [[count], [rows]] = await Promise.all([pool.execute(`SELECT COUNT(*) total FROM users WHERE ${clause}`, params), pool.execute(`SELECT id,name,email,gender,role,status,created_at,updated_at FROM users WHERE ${clause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params)]);
  const total = Number(count[0].total); res.json({ success: true, data: rows.map(present), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
};
exports.one = async (req, res) => { const [rows] = await pool.execute("SELECT id,name,email,gender,role,status,created_at,updated_at FROM users WHERE id=? AND role='Support'", [req.params.id]); if (!rows[0]) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); res.json({ success: true, support: present(rows[0]) }); };
exports.create = async (req, res) => { try { const [result] = await pool.execute("INSERT INTO users (name,email,gender,role,status,login_allowed,email_verified) VALUES (?,?,?,'Support','Verified',TRUE,TRUE)", [req.body.name.trim(), req.body.email.trim().toLowerCase(), req.body.gender]); const [rows] = await pool.execute("SELECT id,name,email,gender,role,status,created_at,updated_at FROM users WHERE id=?", [result.insertId]); res.status(201).json({ success: true, message: "Support user created successfully", support: present(rows[0]) }); } catch (error) { handleDuplicate(error); } };
exports.update = async (req, res) => { try { const [result] = await pool.execute("UPDATE users SET name=?,email=?,gender=? WHERE id=? AND role='Support'", [req.body.name.trim(), req.body.email.trim().toLowerCase(), req.body.gender, req.params.id]); if (!result.affectedRows) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); return exports.one(req, res); } catch (error) { handleDuplicate(error); } };
exports.status = async (req, res) => { const active = req.body.status === "active"; const [result] = await pool.execute("UPDATE users SET status=?,login_allowed=? WHERE id=? AND role='Support'", [active ? "Verified" : "Inactive", active, req.params.id]); if (!result.affectedRows) throw new ApiError(404, "Support user not found.", "NOT_FOUND"); if (!active) await pool.execute("DELETE FROM sessions WHERE user_id=?", [req.params.id]); res.json({ success: true, message: `Support user ${active ? "activated" : "deactivated"} successfully.` }); };
