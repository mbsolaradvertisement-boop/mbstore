const { pool } = require("../config/database");
const { sendSellerDecision } = require("../services/email.service");
const ApiError = require("../utils/api-error");

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
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  sendSellerDecision(seller.email, seller.name, status === "Verified").catch((error) => console.error("Seller decision email failed:", error.message));
  res.json({ message: `Seller ${status.toLowerCase()}.` });
}
