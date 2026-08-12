const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

function productId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(400, "Invalid product ID.", "INVALID_PRODUCT_ID");
  }
  return id;
}

exports.ids = async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT product_id AS productId FROM wishlists WHERE customer_id=? ORDER BY id",
    [req.user.id]
  );
  res.json({ productIds: rows.map((row) => Number(row.productId)) });
};

exports.list = async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT w.id AS wishlistId,w.created_at AS createdAt,
      p.id,p.product_name AS productName,p.brand,p.description,p.status,p.availability,
      c.id AS categoryId,c.name AS categoryName,
      COALESCE(sp.company_name,'Seller') AS sellerCompany,
      CASE WHEN co.id IS NULL THEN NULL ELSE CONCAT('/companies/',co.id,'/logo') END AS companyLogoUrl,
      (SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) AS imageUrl
    FROM wishlists w
    JOIN products p ON p.id=w.product_id
    JOIN categories c ON c.id=p.category_id
    LEFT JOIN seller_profiles sp ON sp.user_id=p.seller_id
    LEFT JOIN companies co ON co.id=p.company_id
    WHERE w.customer_id=? AND p.status<>'deleted'
    ORDER BY w.created_at DESC
  `, [req.user.id]);

  const ids = rows.map((row) => row.id);
  let attributes = [];
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    [attributes] = await pool.execute(`
      SELECT product_id AS productId,field_key AS fieldKey,
        field_label AS fieldLabel,field_value AS fieldValue
      FROM product_attributes
      WHERE product_id IN (${placeholders})
      ORDER BY id
    `, ids);
  }

  const attributesByProduct = new Map();
  for (const attribute of attributes) {
    if (!attributesByProduct.has(attribute.productId)) attributesByProduct.set(attribute.productId, []);
    attributesByProduct.get(attribute.productId).push(attribute);
  }

  res.json({
    items: rows.map((row) => ({
      wishlistId: row.wishlistId,
      createdAt: row.createdAt,
      product: { ...row, attributes: attributesByProduct.get(row.id) || [] },
    })),
  });
};

exports.toggle = async (req, res) => {
  const id = productId(req.body.productId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.execute(
      "SELECT id FROM products WHERE id=? AND status='active' LIMIT 1",
      [id]
    );
    if (!products[0]) throw new ApiError(404, "Product is not available.", "PRODUCT_NOT_FOUND");

    const [existing] = await connection.execute(
      "SELECT id FROM wishlists WHERE customer_id=? AND product_id=? FOR UPDATE",
      [req.user.id, id]
    );
    let wishlisted;
    if (existing[0]) {
      await connection.execute("DELETE FROM wishlists WHERE id=?", [existing[0].id]);
      wishlisted = false;
    } else {
      await connection.execute(
        "INSERT INTO wishlists (customer_id,product_id) VALUES (?,?)",
        [req.user.id, id]
      );
      wishlisted = true;
    }
    await connection.commit();
    res.json({ success: true, wishlisted, productId: id });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.remove = async (req, res) => {
  const id = productId(req.params.productId);
  await pool.execute(
    "DELETE FROM wishlists WHERE customer_id=? AND product_id=?",
    [req.user.id, id]
  );
  res.json({ success: true, wishlisted: false, productId: id });
};
