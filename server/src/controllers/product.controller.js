const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");
const categoryService = require("../services/category.service");
const productService = require("../services/product.service");

const MAX_IMAGE_BYTES = 200 * 1024;
const allowedImageMimes = new Set(["image/png", "image/jpeg", "image/webp"]);
const positiveInt = (value, fallback, max) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? Math.min(number, max) : fallback;
};
const baseSelect = "SELECT p.id,p.product_code AS productCode,p.category_id AS categoryId,p.company_id AS companyId,p.product_name AS productName,p.brand,p.description,p.status,p.views,p.enquiries,p.created_at AS createdAt,p.updated_at AS updatedAt,c.name AS categoryName,co.company_name AS brand,CASE WHEN co.id IS NULL THEN NULL ELSE CONCAT('/companies/',co.id,'/logo') END AS companyLogoUrl,(SELECT image_url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,sort_order LIMIT 1) imageUrl FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN companies co ON co.id=p.company_id";

async function selectedCompany(companyId, connection = pool) {
  const id = positiveInt(companyId, 0, Number.MAX_SAFE_INTEGER);
  if (!id) throw new ApiError(400, "Brand/company is required.", "COMPANY_REQUIRED");
  const [rows] = await connection.execute("SELECT id,company_name AS companyName FROM companies WHERE id=? LIMIT 1", [id]);
  if (!rows[0]) throw new ApiError(400, "Select a valid brand/company.", "INVALID_COMPANY");
  return rows[0];
}

function productImage(value, required = false) {
  if (!value) {
    if (required) throw new ApiError(400, "Product image is required.", "PRODUCT_IMAGE_REQUIRED");
    return null;
  }
  if (typeof value !== "string") throw new ApiError(400, "Invalid product image.", "INVALID_PRODUCT_IMAGE");
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !allowedImageMimes.has(match[1])) throw new ApiError(400, "Product image must be a PNG, JPEG, or WebP image.", "INVALID_PRODUCT_IMAGE_TYPE");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new ApiError(400, "Product image must be 200 KB or smaller.", "PRODUCT_IMAGE_TOO_LARGE");
  const valid = match[1] === "image/png"
    ? buffer.subarray(0, 4).toString("hex") === "89504e47"
    : match[1] === "image/jpeg"
      ? buffer.subarray(0, 3).toString("hex") === "ffd8ff"
      : buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (!valid) throw new ApiError(400, "The selected product image is invalid.", "INVALID_PRODUCT_IMAGE");
  return value;
}

async function categoryAndAttributes(categoryId, input, connection = pool) {
  const [rows] = await connection.execute("SELECT id,name,status FROM categories WHERE id=? LIMIT 1", [categoryId]);
  if (!rows[0]) throw new ApiError(404, "Category not found.", "CATEGORY_NOT_FOUND");
  if (rows[0].status !== "active") throw new ApiError(400, "Products cannot be added to an inactive category.", "CATEGORY_INACTIVE");
  const fields = await categoryService.fields(categoryId, connection);
  return { category: rows[0], attributes: productService.validateAttributes(fields, input) };
}

async function owned(id, sellerId, connection = pool, lock = false) {
  const [rows] = await connection.execute(`SELECT * FROM products WHERE id=? AND seller_id=? AND status<>'deleted'${lock ? " FOR UPDATE" : ""}`, [id, sellerId]);
  if (!rows[0]) throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  return rows[0];
}

exports.list = async (req, res) => {
  const page = positiveInt(req.query.page, 1, 100000), limit = positiveInt(req.query.limit, 20, 100), offset = (page - 1) * limit;
  const conditions = ["p.seller_id=?", "p.status<>'deleted'"], params = [req.user.id];
  if (req.query.search?.trim()) { conditions.push("(p.product_name LIKE ? OR p.brand LIKE ? OR c.name LIKE ? OR p.product_code LIKE ?)"); params.push(...Array(4).fill(`%${req.query.search.trim()}%`)); }
  if (req.query.categoryId) { conditions.push("p.category_id=?"); params.push(req.query.categoryId); }
  if (["active", "pending", "draft", "inactive"].includes(req.query.status)) { conditions.push("p.status=?"); params.push(req.query.status); }
  if (req.query.brand?.trim()) { conditions.push("p.brand=?"); params.push(req.query.brand.trim()); }
  const where = conditions.join(" AND "), orders = { oldest: "p.created_at ASC", az: "p.product_name ASC", newest: "p.created_at DESC" }, order = orders[req.query.sort] || orders.newest;
  const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM products p JOIN categories c ON c.id=p.category_id WHERE ${where}`, params);
  const [rows] = await pool.execute(`${baseSelect} WHERE ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`, params);
  const [[stats]] = await pool.execute("SELECT COUNT(*) totalProducts,SUM(status='active') activeProducts,SUM(status='pending') pendingProducts,SUM(status='draft') draftProducts FROM products WHERE seller_id=? AND status<>'deleted'", [req.user.id]);
  const [brands] = await pool.execute("SELECT DISTINCT brand FROM products WHERE seller_id=? AND status<>'deleted' ORDER BY brand", [req.user.id]);
  const totalRecords = Number(count.total);
  res.json({ data: rows, stats: Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, Number(value || 0)])), brands: brands.map((item) => item.brand), currentPage: page, totalPages: Math.max(1, Math.ceil(totalRecords / limit)), totalRecords, limit });
};

exports.one = async (req, res) => {
  await owned(req.params.id, req.user.id);
  const [rows] = await pool.execute(`${baseSelect} WHERE p.id=? AND p.seller_id=?`, [req.params.id, req.user.id]);
  const [attributes] = await pool.execute("SELECT field_key AS fieldKey,field_label AS fieldLabel,field_value AS fieldValue FROM product_attributes WHERE product_id=? ORDER BY id", [req.params.id]);
  const [images] = await pool.execute("SELECT id,image_url AS imageUrl,is_primary AS isPrimary,sort_order AS sortOrder FROM product_images WHERE product_id=? ORDER BY is_primary DESC,sort_order", [req.params.id]);
  const [documents] = await pool.execute("SELECT id,document_type AS documentType,file_url AS fileUrl,file_name AS fileName FROM product_documents WHERE product_id=?", [req.params.id]);
  res.json({ product: { ...rows[0], attributes: Object.fromEntries(attributes.map((item) => [item.fieldKey, item.fieldValue])), attributeDetails: attributes, images, documents } });
};

exports.create = async (req, res) => {
  const categoryId = positiveInt(req.body.categoryId, 0, Number.MAX_SAFE_INTEGER);
  if (!categoryId) throw new ApiError(400, "Category is required.", "CATEGORY_REQUIRED");
  const productName = productService.text(req.body.productName, "Product name", 2, 180), description = productService.text(req.body.description, "Description", 10, 5000), image = productImage(req.body.image, true);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const company = await selectedCompany(req.body.companyId, connection);
    const brand = company.companyName;
    const { attributes } = await categoryAndAttributes(categoryId, req.body.attributes, connection);
    const [duplicates] = await connection.execute("SELECT id FROM products WHERE seller_id=? AND category_id=? AND LOWER(product_name)=LOWER(?) AND status<>'deleted' LIMIT 1", [req.user.id, categoryId, productName]);
    if (duplicates[0]) throw new ApiError(409, "You already have a product with this name in this category.", "DUPLICATE_PRODUCT");
    const temporaryCode = `TMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const [result] = await connection.execute("INSERT INTO products (product_code,seller_id,category_id,company_id,product_name,brand,description,status) VALUES (?,?,?,?,?,?,?,'active')", [temporaryCode, req.user.id, categoryId, company.id, productName, brand, description]);
    const code = `PRD-${String(result.insertId).padStart(6, "0")}`;
    await connection.execute("UPDATE products SET product_code=? WHERE id=?", [code, result.insertId]);
    for (const item of attributes) await connection.execute("INSERT INTO product_attributes (product_id,field_key,field_label,field_value) VALUES (?,?,?,?)", [result.insertId, item.key, item.label, item.value]);
    await connection.execute("INSERT INTO product_images (product_id,image_url,is_primary,sort_order) VALUES (?,?,TRUE,0)", [result.insertId, image]);
    await connection.commit();
    res.status(201).json({ message: "Product created successfully.", product: { id: result.insertId, productCode: code, categoryId, companyId: company.id, productName, brand, description, status: "active" } });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
};

exports.update = async (req, res) => {
  const categoryId = positiveInt(req.body.categoryId, 0, Number.MAX_SAFE_INTEGER);
  if (!categoryId) throw new ApiError(400, "Category is required.", "CATEGORY_REQUIRED");
  const productName = productService.text(req.body.productName, "Product name", 2, 180), description = productService.text(req.body.description, "Description", 10, 5000), status = req.body.status || "active", image = productImage(req.body.image);
  if (!["active", "inactive", "draft"].includes(status)) throw new ApiError(400, "Invalid product status.", "INVALID_STATUS");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const company = await selectedCompany(req.body.companyId, connection);
    const brand = company.companyName;
    await owned(req.params.id, req.user.id, connection, true);
    const { attributes } = await categoryAndAttributes(categoryId, req.body.attributes, connection);
    const [duplicates] = await connection.execute("SELECT id FROM products WHERE seller_id=? AND category_id=? AND LOWER(product_name)=LOWER(?) AND id<>? AND status<>'deleted' LIMIT 1", [req.user.id, categoryId, productName, req.params.id]);
    if (duplicates[0]) throw new ApiError(409, "You already have a product with this name in this category.", "DUPLICATE_PRODUCT");
    await connection.execute("UPDATE products SET category_id=?,company_id=?,product_name=?,brand=?,description=?,status=? WHERE id=?", [categoryId, company.id, productName, brand, description, status, req.params.id]);
    await connection.execute("DELETE FROM product_attributes WHERE product_id=?", [req.params.id]);
    for (const item of attributes) await connection.execute("INSERT INTO product_attributes (product_id,field_key,field_label,field_value) VALUES (?,?,?,?)", [req.params.id, item.key, item.label, item.value]);
    if (image) { await connection.execute("DELETE FROM product_images WHERE product_id=?", [req.params.id]); await connection.execute("INSERT INTO product_images (product_id,image_url,is_primary,sort_order) VALUES (?,?,TRUE,0)", [req.params.id, image]); }
    await connection.commit();
    res.json({ message: "Product updated successfully." });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
};

exports.remove = async (req, res) => {
  const [result] = await pool.execute("UPDATE products SET status='deleted' WHERE id=? AND seller_id=? AND status<>'deleted'", [req.params.id, req.user.id]);
  if (!result.affectedRows) throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  res.json({ message: "Product deleted successfully." });
};
