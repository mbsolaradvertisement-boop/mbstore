const { pool } = require("../config/database");
const { sendSellerDecision } = require("../services/email.service");
const ApiError = require("../utils/api-error");

function numberParam(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function managementList(role) { return async (req, res) => {
  const seller = role === "Seller";
  const table = seller ? "seller_profiles" : "customer_profiles";
  const idColumn = seller ? "seller_id" : "customer_id";
  const nameColumn = seller ? "seller_name" : "customer_name";
  const page = numberParam(req.query.page, 1, 100000); const limit = numberParam(req.query.limit, 20, 100); const offset = (page - 1) * limit;
  const conditions = ["u.role = ?"]; const params = [role];
  if (req.query.search?.trim()) {
    const q = `%${req.query.search.trim()}%`;
    const columns = seller ? [idColumn, nameColumn, "p.company_name", "p.email", "p.gst", "p.phone_number"] : [idColumn, nameColumn, "p.email", "p.phone_number", "p.state", "p.district"];
    conditions.push(`(${columns.map(column => `${column.includes(".") ? column : `p.${column}`} LIKE ?`).join(" OR ")})`); params.push(...columns.map(() => q));
  }
  if (req.query.status) { conditions.push("u.status = ?"); params.push(req.query.status); }
  if (req.query.state) { conditions.push("p.state = ?"); params.push(req.query.state); }
  if (req.query.district) { conditions.push("p.district = ?"); params.push(req.query.district); }
  if (req.query.completion === "completed") conditions.push("p.profile_completion = 100");
  if (req.query.completion === "incomplete") conditions.push("p.profile_completion < 100");
  if (seller && req.query.verificationStatus) { conditions.push("p.verification_status = ?"); params.push(req.query.verificationStatus); }
  const where = conditions.join(" AND "); const order = req.query.sort === "oldest" ? "ASC" : "DESC";
  const [countRows] = await pool.execute(`SELECT COUNT(*) total FROM ${table} p JOIN users u ON u.id=p.user_id WHERE ${where}`, params);
  const [rows] = await pool.execute(`SELECT p.*, u.status FROM ${table} p JOIN users u ON u.id=p.user_id WHERE ${where} ORDER BY p.created_at ${order} LIMIT ${limit} OFFSET ${offset}`, params);
  const { mapProfile } = require("../services/profile.service"); const data = rows.map(row => mapProfile(row, role)); const totalRecords = Number(countRows[0].total);
  res.json({ data, currentPage: page, totalPages: Math.max(1, Math.ceil(totalRecords / limit)), totalRecords, limit });
}; }

exports.sellers = managementList("Seller");
exports.customers = managementList("Customer");

exports.requests = async (_req, res) => { const [rows] = await pool.query("SELECT sv.id, u.name, u.email, sv.business_name AS businessName, sv.contact_person AS contactPerson, sv.gst_number AS gstNumber, sv.verification_status AS verificationStatus, u.created_at AS createdAt FROM seller_verifications sv JOIN users u ON u.id = sv.user_id WHERE sv.verification_status = 'Pending' ORDER BY u.created_at ASC"); res.json({ requests: rows }); };
exports.approve = async (req, res) => update(req, res, "Verified");
exports.reject = async (req, res) => update(req, res, "Rejected");
async function update(req, res, status) {
  const connection = await pool.getConnection(); let seller;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT sv.user_id, u.email, u.name FROM seller_verifications sv JOIN users u ON u.id = sv.user_id WHERE sv.id = ? AND sv.verification_status = 'Pending' FOR UPDATE", [req.params.id]); seller = rows[0];
    if (!seller) throw new ApiError(404, "Pending seller request not found.", "REQUEST_NOT_FOUND");
    await connection.execute("UPDATE seller_verifications SET verification_status = ?, verified_by = ?, verified_at = NOW(), remarks = ? WHERE id = ?", [status, req.user.id, req.body.reason || null, req.params.id]);
    await connection.execute("UPDATE users SET status = ?, login_allowed = ? WHERE id = ?", [status, status === "Verified", seller.user_id]);
    await connection.execute("UPDATE seller_profiles SET verification_status = ? WHERE user_id = ?", [status, seller.user_id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  sendSellerDecision(seller.email, seller.name, status === "Verified").catch((error) => console.error("Seller decision email failed:", error.message));
  res.json({ message: `Seller ${status.toLowerCase()}.` });
}
