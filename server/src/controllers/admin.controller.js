const { pool } = require("../config/database");
const { sendSellerDecision, sendProductModeration } = require("../services/email.service");
const ApiError = require("../utils/api-error");

function numberParam(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function dashboardRange(query) {
  const to = String(query.to || new Date().toISOString().slice(0, 10));
  const fallbackFrom = new Date(`${to}T00:00:00Z`);
  fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - 29);
  const from = String(query.from || fallbackFrom.toISOString().slice(0, 10));
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to) || from > to) {
    throw new ApiError(400, "Select a valid dashboard date range.", "INVALID_DASHBOARD_RANGE");
  }
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const days = Math.floor((toDate - fromDate) / 86400000) + 1;
  if (days < 1 || days > 366) {
    throw new ApiError(400, "Dashboard range must be between 1 and 366 days.", "INVALID_DASHBOARD_RANGE");
  }
  return { from, to, toExclusive: new Date(toDate.getTime() + 86400000).toISOString().slice(0, 10), fromDate, toDate, days };
}

function fillRegistrationSeries(rows, range, grouping) {
  const values = new Map(rows.map((row) => [row.bucket, row]));
  const result = [];
  const cursor = new Date(range.fromDate);
  while (cursor <= range.toDate) {
    const iso = cursor.toISOString().slice(0, 10);
    const bucket = grouping === "month" ? iso.slice(0, 7) : iso;
    const row = values.get(bucket) || {};
    result.push({
      label: new Intl.DateTimeFormat("en-IN", grouping === "month"
        ? { month: "short", year: "2-digit", timeZone: "UTC" }
        : { day: "numeric", month: "short", timeZone: "UTC" }).format(cursor),
      sellers: Number(row.sellers || 0), customers: Number(row.customers || 0),
      products: Number(row.products || 0), companies: Number(row.companies || 0),
      quotations: Number(row.quotations || 0),
    });
    grouping === "month" ? cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1) : cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

exports.dashboard = async (req, res) => {
  const range = dashboardRange(req.query);
  const grouping = range.days > 62 ? "month" : "day";
  const dates = [range.from, range.toExclusive];
  const [statsResult, registrationsResult, productsResult, companiesResult, ordersResult, sellersResult, productStatusResult, quotationStatusResult] = await Promise.all([
    pool.execute(`SELECT
      (SELECT COUNT(*) FROM companies) totalCompanies,
      (SELECT COUNT(*) FROM users WHERE role='Seller') totalSellers,
      (SELECT COUNT(*) FROM users WHERE role='Customer') totalCustomers,
      (SELECT COUNT(*) FROM products WHERE status<>'deleted') totalProducts,
      (SELECT COUNT(*) FROM products WHERE status='suspended') suspendedProducts,
      (SELECT COUNT(*) FROM quotation_requests) totalQuotations,
      (SELECT COUNT(*) FROM seller_verifications WHERE verification_status='Pending') pendingApprovals`),
    pool.execute(`SELECT ${grouping === "month" ? "DATE_FORMAT(created_at,'%Y-%m')" : "DATE_FORMAT(created_at,'%Y-%m-%d')"} bucket,
      SUM(kind='seller') sellers,SUM(kind='customer') customers,SUM(kind='product') products,
      SUM(kind='company') companies,SUM(kind='quotation') quotations
      FROM (
        SELECT created_at,LOWER(role) kind FROM users WHERE role IN ('Seller','Customer')
        UNION ALL SELECT created_at,'product' FROM products WHERE status<>'deleted'
        UNION ALL SELECT created_at,'company' FROM companies
        UNION ALL SELECT created_at,'quotation' FROM quotation_requests
      ) activity WHERE created_at>=? AND created_at<? GROUP BY bucket ORDER BY bucket`, dates),
    pool.execute(`SELECT p.id,p.product_name productName,COALESCE(co.company_name,p.brand) company,
      COUNT(q.id) sales,COALESCE(SUM(q.quantity),0) unitsSold,
      (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) imageUrl
      FROM quotation_requests q JOIN products p ON p.id=q.product_id LEFT JOIN companies co ON co.id=p.company_id
      WHERE q.status='accepted' AND q.customer_decided_at>=? AND q.customer_decided_at<?
      GROUP BY p.id,p.product_name,co.company_name,p.brand ORDER BY sales DESC,unitsSold DESC,p.product_name LIMIT 5`, dates),
    pool.execute(`SELECT q.seller_id sellerId,
      COALESCE(NULLIF(MAX(sp.company_name),''),MAX(q.seller_company_snapshot),MAX(u.name)) company,
      MAX(u.name) sellerName,COUNT(*) quotationCount
      FROM quotation_requests q JOIN users u ON u.id=q.seller_id LEFT JOIN seller_profiles sp ON sp.user_id=q.seller_id
      WHERE q.created_at>=? AND q.created_at<? GROUP BY q.seller_id
      ORDER BY quotationCount DESC,company LIMIT 5`, dates),
    pool.execute(`SELECT q.id,q.product_name_snapshot product,q.seller_company_snapshot company,
      q.quotation_number quotationNumber,q.created_at createdAt,q.status
      FROM quotation_requests q WHERE q.created_at>=? AND q.created_at<? ORDER BY q.created_at DESC LIMIT 8`, dates),
    pool.execute(`SELECT u.id,u.name,u.email,COALESCE(NULLIF(sp.company_name,''),sv.business_name,'Independent seller') businessName,
      u.created_at createdAt,u.status
      FROM users u LEFT JOIN seller_profiles sp ON sp.user_id=u.id LEFT JOIN seller_verifications sv ON sv.user_id=u.id
      WHERE u.role='Seller' AND u.created_at>=DATE_FORMAT(CURDATE(),'%Y-%m-01')
      ORDER BY u.created_at DESC LIMIT 5`),
    pool.execute("SELECT status name,COUNT(*) value FROM products WHERE status<>'deleted' GROUP BY status ORDER BY value DESC"),
    pool.execute("SELECT status name,COUNT(*) value FROM quotation_requests GROUP BY status ORDER BY value DESC"),
  ]);
  const stats = Object.fromEntries(Object.entries(statsResult[0][0] || {}).map(([key, value]) => [key, Number(value || 0)]));
  res.json({
    updatedAt: new Date().toISOString(), filters: { from: range.from, to: range.to, grouping }, stats,
    analytics: fillRegistrationSeries(registrationsResult[0], range, grouping),
    mostSoldProducts: productsResult[0].map((item) => ({ ...item, sales: Number(item.sales), unitsSold: Number(item.unitsSold) })),
    topQuotedCompanies: companiesResult[0].map((item) => ({ ...item, quotationCount: Number(item.quotationCount) })),
    productStatus: productStatusResult[0].map((item) => ({ ...item, value: Number(item.value) })),
    quotationStatus: quotationStatusResult[0].map((item) => ({ ...item, value: Number(item.value) })),
    recentOrders: ordersResult[0], recentSellers: sellersResult[0],
  });
};

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

exports.products = async (req, res) => {
  const page = numberParam(req.query.page, 1, 100000), limit = numberParam(req.query.limit, 20, 100), offset = (page - 1) * limit;
  const conditions = ["p.status<>'deleted'"], params = [];
  if (req.query.search?.trim()) {
    const value = `%${req.query.search.trim()}%`;
    conditions.push("(p.product_name LIKE ? OR p.product_code LIKE ? OR p.brand LIKE ? OR u.name LIKE ? OR sp.company_name LIKE ?)");
    params.push(value, value, value, value, value);
  }
  if (req.query.categoryId) { conditions.push("p.category_id=?"); params.push(req.query.categoryId); }
  if (req.query.sellerId) { conditions.push("p.seller_id=?"); params.push(req.query.sellerId); }
  if (["active", "pending", "draft", "inactive", "suspended"].includes(req.query.status)) { conditions.push("p.status=?"); params.push(req.query.status); }
  const where = conditions.join(" AND ");
  const orders = { oldest: "p.created_at ASC", az: "p.product_name ASC", seller: "sellerCompany ASC", newest: "p.created_at DESC" };
  const order = orders[req.query.sort] || orders.newest;
  const from = "FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id";
  const [[count], [rows], [stats], [categories], [sellers]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) total ${from} WHERE ${where}`, params),
    pool.execute(`SELECT p.id,p.product_code productCode,p.product_name productName,p.brand,p.availability,p.status,p.suspension_reason suspensionReason,p.suspended_at suspendedAt,p.views,p.enquiries,p.created_at createdAt,c.id categoryId,c.name categoryName,u.id sellerId,u.name sellerName,COALESCE(NULLIF(sp.company_name,''),u.name) sellerCompany,(SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) imageUrl ${from} WHERE ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`, params),
    pool.execute("SELECT COUNT(*) totalProducts,SUM(status='active') activeProducts,SUM(status='suspended') suspendedProducts,SUM(status IN ('draft','pending','inactive')) otherProducts FROM products WHERE status<>'deleted'"),
    pool.execute("SELECT id,name FROM categories ORDER BY name"),
    pool.execute("SELECT u.id,u.name,COALESCE(NULLIF(sp.company_name,''),u.name) sellerCompany FROM users u LEFT JOIN seller_profiles sp ON sp.user_id=u.id WHERE u.role='Seller' ORDER BY sellerCompany"),
  ]);
  const totalRecords = Number(count[0]?.total || 0);
  res.json({ data: rows, stats: Object.fromEntries(Object.entries(stats[0] || {}).map(([key, value]) => [key, Number(value || 0)])), filters: { categories, sellers }, currentPage: page, totalPages: Math.max(1, Math.ceil(totalRecords / limit)), totalRecords, limit });
};

exports.productReports = async (req, res) => {
  const status = ["pending", "reviewed", "actioned", "dismissed"].includes(req.query.status) ? req.query.status : "pending";
  const [rows] = await pool.execute(`SELECT r.id,r.product_id productId,r.reason,r.status reportStatus,r.created_at reportedAt,
    p.product_code productCode,p.product_name productName,p.brand,p.status productStatus,c.name categoryName,
    cu.name customerName,cp.customer_id customerCode,su.name sellerName,COALESCE(NULLIF(sp.company_name,''),su.name) sellerCompany,
    (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) imageUrl
    FROM product_reports r JOIN products p ON p.id=r.product_id JOIN categories c ON c.id=p.category_id
    JOIN users cu ON cu.id=r.customer_id LEFT JOIN customer_profiles cp ON cp.user_id=cu.id
    JOIN users su ON su.id=p.seller_id LEFT JOIN seller_profiles sp ON sp.user_id=su.id
    WHERE r.status=? ORDER BY r.created_at DESC LIMIT 50`, [status]);
  const [[counts]] = await pool.execute("SELECT COUNT(*) totalReports,SUM(status='pending') pendingReports,SUM(status='actioned') actionedReports,SUM(status='dismissed') dismissedReports FROM product_reports");
  res.json({ data: rows, stats: Object.fromEntries(Object.entries(counts).map(([key,value]) => [key, Number(value || 0)])) });
};

exports.productReportStatus = async (req, res) => {
  const [result] = await pool.execute("UPDATE product_reports SET status=?,reviewed_by=?,reviewed_at=NOW(),admin_note=? WHERE id=? AND status IN ('pending','reviewed')", [req.body.status, req.user.id, req.body.note || null, req.params.id]);
  if (!result.affectedRows) throw new ApiError(404, "Open product report not found.", "PRODUCT_REPORT_NOT_FOUND");
  res.json({ message: req.body.status === "dismissed" ? "Product report dismissed." : "Product report marked as resolved." });
};

exports.productStatus = async (req, res) => {
  const status = req.body.status;
  const reason = String(req.body.reason || "").trim();
  if (status === "suspended" && !reason) throw new ApiError(400, "A suspension reason is required.", "SUSPENSION_REASON_REQUIRED");
  const connection = await pool.getConnection(); let product;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`SELECT p.id,p.product_code productCode,p.product_name productName,p.seller_id sellerId,p.status,u.name sellerName,u.email sellerEmail
      FROM products p JOIN users u ON u.id=p.seller_id WHERE p.id=? AND p.status<>'deleted' FOR UPDATE`, [req.params.id]);
    product = rows[0];
    if (!product) throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    if (status === "suspended" && product.status === "suspended") throw new ApiError(409, "This product is already suspended.", "PRODUCT_ALREADY_SUSPENDED");
    if (status === "active" && product.status !== "suspended") throw new ApiError(409, "This product is not suspended.", "PRODUCT_NOT_SUSPENDED");
    if (status === "suspended") await connection.execute("UPDATE products SET status='suspended',suspension_reason=?,suspended_at=NOW(),suspended_by=? WHERE id=?", [reason, req.user.id, product.id]);
    else await connection.execute("UPDATE products SET status='active',suspension_reason=NULL,suspended_at=NULL,suspended_by=NULL WHERE id=?", [product.id]);
    const supportEmail = process.env.SUPPORT_EMAIL || "support@mbstore.com";
    const message = status === "suspended"
      ? `Product ID ${product.productCode} (${product.productName}) was suspended. Admin note: ${reason}. For queries, email ${supportEmail} with this Product ID.`
      : `Product ID ${product.productCode} (${product.productName}) is active again and visible in the catalogue.`;
    await connection.execute("INSERT INTO notifications (user_id,type,title,message,entity_type,entity_id) VALUES (?,?,?,?,?,?)", [product.sellerId, status === "suspended" ? "product_suspended" : "product_restored", status === "suspended" ? "Product suspended by admin" : "Product suspension removed", message.slice(0, 500), "product", product.id]);
    const reportId = Number.parseInt(req.body.reportId, 10);
    if (status === "suspended" && Number.isSafeInteger(reportId) && reportId > 0) await connection.execute("UPDATE product_reports SET status='actioned',reviewed_by=?,reviewed_at=NOW(),admin_note=? WHERE id=? AND product_id=? AND status IN ('pending','reviewed')", [req.user.id, reason, reportId, product.id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  sendProductModeration(product.sellerEmail, product.sellerName, product, status === "suspended", reason).catch((error) => console.error("Product moderation email failed:", error.message));
  res.json({ message: status === "suspended" ? "Product suspended, hidden from the catalogue, and the seller was notified." : "Product suspension removed and the seller was notified." });
};

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
