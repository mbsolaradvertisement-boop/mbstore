const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${label} must be a whole number greater than zero.`, "INVALID_NUMBER");
  }
  return parsed;
}

function optionalText(value, label, maximum = 1000) {
  const text = String(value || "").trim();
  if (text.length > maximum) {
    throw new ApiError(400, `${label} must be ${maximum} characters or fewer.`, "TEXT_TOO_LONG");
  }
  return text || null;
}

function requiredText(value, label, maximum = 1000) {
  const text = optionalText(value, label, maximum);
  if (!text) throw new ApiError(400, `${label} is required.`, "TEXT_REQUIRED");
  return text;
}

function pageValues(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

const detailSelect = `
  SELECT q.*, u.name AS customerName, p.category_id AS categoryId,
    c.name AS categoryName, r.price_per_unit AS pricePerUnit,
    r.total_price AS totalPrice, r.delivery_time AS deliveryTime,
    r.message AS sellerMessage, cp.state AS customerState,
    cp.district AS customerDistrict, cp.area AS customerArea,
    cp.address AS customerAddress
  FROM quotation_requests q
  JOIN users u ON u.id=q.customer_id
  JOIN products p ON p.id=q.product_id
  JOIN categories c ON c.id=p.category_id
  LEFT JOIN customer_profiles cp ON cp.user_id=q.customer_id
  LEFT JOIN quotation_responses r ON r.quotation_request_id=q.id
`;

exports.create = async (req, res) => {
  const productId = positiveInteger(req.body.productId, "Product");
  const quantity = positiveInteger(req.body.quantity, "Quantity");
  const message = optionalText(req.body.message, "Additional information");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [products] = await connection.execute(`
      SELECT p.id,p.seller_id,p.product_name,p.brand,p.status,
        COALESCE(sp.company_name,'Seller') AS seller_company
      FROM products p
      LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id
      WHERE p.id=? LIMIT 1 FOR UPDATE
    `, [productId]);
    const product = products[0];
    if (!product || product.status !== "active") {
      throw new ApiError(404, "Product is not available for quotation.", "PRODUCT_NOT_FOUND");
    }
    const [profiles] = await connection.execute(
      "SELECT phone_number FROM customer_profiles WHERE user_id=? LIMIT 1",
      [req.user.id]
    );
    const [pending] = await connection.execute(`
      SELECT id,quotation_number FROM quotation_requests
      WHERE customer_id=? AND seller_id=? AND product_id=? AND status='pending'
      LIMIT 1
    `, [req.user.id, product.seller_id, product.id]);
    if (pending[0]) {
      throw new ApiError(409, "You already have a pending quotation request for this product from this seller.", "PENDING_QUOTATION_EXISTS");
    }
    const temporaryNumber = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [result] = await connection.execute(`
      INSERT INTO quotation_requests
        (quotation_number,customer_id,seller_id,product_id,product_name_snapshot,
         brand_snapshot,seller_company_snapshot,quantity,customer_message,customer_phone)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `, [temporaryNumber, req.user.id, product.seller_id, product.id, product.product_name,
      product.brand, product.seller_company, quantity, message, profiles[0]?.phone_number || null]);
    const quotationNumber = `MBQ-${String(result.insertId).padStart(6, "0")}`;
    await connection.execute(
      "UPDATE quotation_requests SET quotation_number=? WHERE id=?",
      [quotationNumber, result.insertId]
    );

    await connection.execute(`
      UPDATE products
      SET enquiries = enquiries + 1
      WHERE id = ? AND seller_id = ?
    `, [product.id, product.seller_id]);

    await connection.execute(`
      INSERT INTO notifications (user_id,type,title,message,entity_type,entity_id)
      SELECT ?,?,?,?,?,? FROM users u LEFT JOIN seller_settings ss ON ss.seller_id=u.id
      WHERE u.id=? AND COALESCE(ss.notifications_enabled,TRUE)=TRUE AND COALESCE(ss.quotation_notifications,TRUE)=TRUE
    `, [
      product.seller_id,
      "quotation_request",
      "New quotation request",
      `${req.user.name} requested ${quantity} unit${quantity === 1 ? "" : "s"} of ${product.product_name}.`,
      "quotation",
      result.insertId,
      product.seller_id,
    ]);

    await connection.commit();
    res.status(201).json({
      message: "Quotation request sent successfully.",
      quotation: { id: result.insertId, quotationNumber, status: "pending" }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

async function listFor(req, res, ownerColumn) {
  const { page, limit, offset } = pageValues(req.query);
  const conditions = [`q.${ownerColumn}=?`];
  const params = [req.user.id];
  if (["pending", "quoted", "rejected", "accepted", "declined"].includes(req.query.status)) {
    conditions.push("q.status=?");
    params.push(req.query.status);
  }
  if (req.query.search?.trim()) {
    const search = `%${req.query.search.trim()}%`;
    conditions.push("(q.quotation_number LIKE ? OR q.product_name_snapshot LIKE ? OR q.seller_company_snapshot LIKE ? OR u.name LIKE ?)");
    params.push(search, search, search, search);
  }
  const where = conditions.join(" AND ");
  const [[count]] = await pool.execute(
    `SELECT COUNT(*) total FROM quotation_requests q JOIN users u ON u.id=q.customer_id WHERE ${where}`,
    params
  );
  const [rows] = await pool.execute(
    `${detailSelect} WHERE ${where} ORDER BY q.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const [[statsRow]] = await pool.execute(`
    SELECT
      COUNT(*) AS totalQuotations,
      SUM(
        created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      ) AS recentEnquiries,
      SUM(
        created_at >= DATE_SUB(
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
          INTERVAL 7 DAY
        )
        AND created_at < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      ) AS lastWeekEnquiries,
      SUM(status = 'quoted') AS approvedQuotations,
      SUM(status = 'rejected') AS rejectedQuotations
    FROM quotation_requests
    WHERE ${ownerColumn} = ?
  `, [req.user.id]);

  const total = Number(count.total);
  res.json({
    data: rows,
    stats: {
      totalQuotations: Number(statsRow.totalQuotations || 0),
      recentEnquiries: Number(statsRow.recentEnquiries || 0),
      lastWeekEnquiries: Number(statsRow.lastWeekEnquiries || 0),
      approvedQuotations: Number(statsRow.approvedQuotations || 0),
      rejectedQuotations: Number(statsRow.rejectedQuotations || 0),
    },
    pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(total / limit)), totalRecords: total, limit }
  });
}

exports.customerList = (req, res) => listFor(req, res, "customer_id");
exports.sellerList = (req, res) => listFor(req, res, "seller_id");

async function detailFor(req, res, ownerColumn) {
  const id = positiveInteger(req.params.id, "Quotation");
  const [rows] = await pool.execute(
    `${detailSelect} WHERE q.id=? AND q.${ownerColumn}=? LIMIT 1`,
    [id, req.user.id]
  );
  if (!rows[0]) throw new ApiError(404, "Quotation not found.", "QUOTATION_NOT_FOUND");
  res.json({ quotation: rows[0] });
}

exports.customerDetail = (req, res) => detailFor(req, res, "customer_id");
exports.sellerDetail = (req, res) => detailFor(req, res, "seller_id");

exports.respond = async (req, res) => {
  const id = positiveInteger(req.params.id, "Quotation");
  const price = Number(req.body.pricePerUnit);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ApiError(400, "Price per unit must be greater than zero.", "INVALID_PRICE");
  }
  const deliveryTime = requiredText(req.body.deliveryTime, "Delivery time", 160);
  const message = optionalText(req.body.message, "Message");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id,quantity,status FROM quotation_requests WHERE id=? AND seller_id=? FOR UPDATE",
      [id, req.user.id]
    );
    if (!rows[0]) throw new ApiError(404, "Quotation not found.", "QUOTATION_NOT_FOUND");
    if (rows[0].status !== "pending") throw new ApiError(409, "This quotation has already been processed.", "QUOTATION_PROCESSED");
    const totalPrice = Number((rows[0].quantity * price).toFixed(2));
    await connection.execute(`
      INSERT INTO quotation_responses
        (quotation_request_id,seller_id,price_per_unit,total_price,delivery_time,message)
      VALUES (?,?,?,?,?,?)
    `, [id, req.user.id, price, totalPrice, deliveryTime, message]);
    await connection.execute(
      "UPDATE quotation_requests SET status='quoted',responded_at=NOW() WHERE id=?",
      [id]
    );
    await connection.execute(`
      INSERT INTO notifications
        (user_id,type,title,message,entity_type,entity_id)
      SELECT q.customer_id,'quotation_quoted','Quotation received',
        CONCAT('The seller sent a quotation for ',q.product_name_snapshot,'.'),
        'quotation',q.id
      FROM quotation_requests q
      LEFT JOIN customer_settings cs ON cs.customer_id=q.customer_id
      WHERE q.id=? AND COALESCE(cs.enquiry_notifications,TRUE)=TRUE
    `, [id]);
    await connection.commit();
    res.json({ message: "Quotation sent successfully.", quotation: { id, status: "quoted", pricePerUnit: price, totalPrice } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.reject = async (req, res) => {
  const id = positiveInteger(req.params.id, "Quotation");
  const reason = requiredText(req.body.reason, "Rejection reason");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(`
      UPDATE quotation_requests
      SET status='rejected',seller_rejection_reason=?,responded_at=NOW()
      WHERE id=? AND seller_id=? AND status='pending'
    `, [reason, id, req.user.id]);
    if (!result.affectedRows) throw new ApiError(409, "Quotation not found or already processed.", "QUOTATION_PROCESSED");
    await connection.execute(`
      INSERT INTO notifications
        (user_id,type,title,message,entity_type,entity_id)
      SELECT q.customer_id,'quotation_rejected','Quotation request rejected',
        CONCAT('The seller rejected your request for ',q.product_name_snapshot,'.'),
        'quotation',q.id
      FROM quotation_requests q
      LEFT JOIN customer_settings cs ON cs.customer_id=q.customer_id
      WHERE q.id=? AND COALESCE(cs.enquiry_notifications,TRUE)=TRUE
    `, [id]);
    await connection.commit();
    res.json({ message: "Quotation request rejected.", quotation: { id, status: "rejected" } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.customerDecision = async (req, res) => {
  const id = positiveInteger(req.params.id, "Quotation");
  const decision = String(req.body.decision || "").trim().toLowerCase();
  if (!["accepted", "declined"].includes(decision)) {
    throw new ApiError(400, "Decision must be accepted or declined.", "INVALID_QUOTATION_DECISION");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`
      SELECT q.id,q.seller_id,q.status,q.product_name_snapshot,q.quotation_number,u.name AS customer_name
      FROM quotation_requests q
      JOIN users u ON u.id=q.customer_id
      WHERE q.id=? AND q.customer_id=?
      FOR UPDATE
    `, [id, req.user.id]);
    const quotation = rows[0];
    if (!quotation) throw new ApiError(404, "Quotation not found.", "QUOTATION_NOT_FOUND");
    if (quotation.status !== "quoted") {
      throw new ApiError(409, "This quotation can no longer be accepted or declined.", "QUOTATION_ALREADY_DECIDED");
    }

    await connection.execute(
      "UPDATE quotation_requests SET status=?,customer_decided_at=NOW() WHERE id=?",
      [decision, id]
    );
    const accepted = decision === "accepted";
    await connection.execute(`
      INSERT INTO notifications (user_id,type,title,message,entity_type,entity_id)
      SELECT ?,?,?,?,?,? FROM users u LEFT JOIN seller_settings ss ON ss.seller_id=u.id
      WHERE u.id=? AND COALESCE(ss.notifications_enabled,TRUE)=TRUE AND COALESCE(ss.quotation_notifications,TRUE)=TRUE
    `, [
      quotation.seller_id,
      accepted ? "quotation_accepted" : "quotation_declined",
      accepted ? "Quotation accepted" : "Quotation declined",
      `${quotation.customer_name} ${accepted ? "accepted" : "declined"} quotation ${quotation.quotation_number} for ${quotation.product_name_snapshot}.`,
      "quotation",
      id,
      quotation.seller_id,
    ]);

    await connection.commit();
    res.json({
      message: `Quotation ${accepted ? "accepted" : "declined"} successfully.`,
      quotation: { id, status: decision, customerDecidedAt: new Date().toISOString() },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
