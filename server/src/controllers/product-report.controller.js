const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

exports.create = async (req, res) => {
  const productId = Number.parseInt(req.body.productId, 10);
  const reason = String(req.body.reason || "").trim();
  if (!Number.isSafeInteger(productId) || productId < 1) throw new ApiError(400, "Select a valid product.", "INVALID_PRODUCT_ID");
  if (reason.length < 10 || reason.length > 1000) throw new ApiError(400, "Report reason must be between 10 and 1000 characters.", "INVALID_REPORT_REASON");
  const [products] = await pool.execute("SELECT id FROM products WHERE id=? AND status='active' LIMIT 1", [productId]);
  if (!products[0]) throw new ApiError(404, "This product is no longer available.", "PRODUCT_NOT_FOUND");
  const [pending] = await pool.execute("SELECT id FROM product_reports WHERE product_id=? AND customer_id=? AND status IN ('pending','reviewed') LIMIT 1", [productId, req.user.id]);
  if (pending[0]) throw new ApiError(409, "You already have an open report for this product.", "PRODUCT_ALREADY_REPORTED");
  const [result] = await pool.execute("INSERT INTO product_reports (product_id,customer_id,reason) VALUES (?,?,?)", [productId, req.user.id, reason]);
  res.status(201).json({ message: "Product report submitted to the administrator.", report: { id: result.insertId, productId, status: "pending" } });
};
