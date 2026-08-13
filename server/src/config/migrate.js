const fs = require("fs/promises");
const path = require("path");
const { pool } = require("./database");

const schemaPath = path.resolve(__dirname, "../../database/schema.sql");

async function migrate() {
  const schema = await fs.readFile(schemaPath, "utf8");
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const connection = await pool.getConnection();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    // Non-destructive upgrade path for databases created by the former
    // Firebase phone-auth schema. Legacy rows are preserved for manual email
    // backfill; all newly-created accounts use email only.
    const [userColumns] = await connection.query("SHOW COLUMNS FROM users");
    const userColumnNames = new Set(userColumns.map((column) => column.Field));
    if (!userColumnNames.has("email")) await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL UNIQUE AFTER name");
    if (!userColumnNames.has("email_verified")) await connection.query("ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER login_allowed");
    if (userColumnNames.has("phone")) await connection.query("ALTER TABLE users MODIFY COLUMN phone VARCHAR(16) NULL");
    const roleColumn = userColumns.find((column) => column.Field === "role");
    if (roleColumn && !roleColumn.Type.includes("Support")) await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('Admin','Seller','Customer','Support') NOT NULL");
    if (!userColumnNames.has("gender")) await connection.query("ALTER TABLE users ADD COLUMN gender ENUM('Male','Female','Other') NULL AFTER role");

    const [sellerColumns] = await connection.query("SHOW COLUMNS FROM seller_verifications");
    const sellerColumnNames = new Set(sellerColumns.map((column) => column.Field));
    if (!sellerColumnNames.has("business_name")) await connection.query("ALTER TABLE seller_verifications ADD COLUMN business_name VARCHAR(160) NULL AFTER user_id");
    if (!sellerColumnNames.has("contact_person")) await connection.query("ALTER TABLE seller_verifications ADD COLUMN contact_person VARCHAR(120) NULL AFTER gst_number");

    const [productImageColumns] = await connection.query("SHOW COLUMNS FROM product_images");
    const productImageUrl = productImageColumns.find((column) => column.Field === "image_url");
    if (productImageUrl && !/mediumtext/i.test(productImageUrl.Type)) {
      await connection.query("ALTER TABLE product_images MODIFY COLUMN image_url MEDIUMTEXT NOT NULL");
    }

    const [productColumns] = await connection.query("SHOW COLUMNS FROM products");
    if (!productColumns.some((column) => column.Field === "company_id")) {
      await connection.query("ALTER TABLE products ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER category_id");
      await connection.query("ALTER TABLE products ADD CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL");
      await connection.query("CREATE INDEX idx_products_company ON products(company_id)");
      await connection.query("UPDATE products p JOIN companies co ON LOWER(co.company_name)=LOWER(p.brand) SET p.company_id=co.id WHERE p.company_id IS NULL");
    }
    if (!productColumns.some((column) => column.Field === "availability")) {
      await connection.query("ALTER TABLE products ADD COLUMN availability ENUM('in_stock','low_stock','out_of_stock') NOT NULL DEFAULT 'in_stock' AFTER description");
    }

    const [quotationColumns] = await connection.query("SHOW COLUMNS FROM quotation_requests");
    const quotationStatus = quotationColumns.find((column) => column.Field === "status");
    if (quotationStatus && (!quotationStatus.Type.includes("accepted") || !quotationStatus.Type.includes("declined"))) {
      await connection.query("ALTER TABLE quotation_requests MODIFY COLUMN status ENUM('pending','quoted','rejected','accepted','declined') NOT NULL DEFAULT 'pending'");
    }
    if (!quotationColumns.some((column) => column.Field === "customer_decided_at")) {
      await connection.query("ALTER TABLE quotation_requests ADD COLUMN customer_decided_at TIMESTAMP NULL AFTER responded_at");
    }

    // Backfill profiles for accounts created before profile tables existed.
    const [customers] = await connection.query("SELECT id, name, email FROM users u WHERE role='Customer' AND NOT EXISTS (SELECT 1 FROM customer_profiles p WHERE p.user_id=u.id)");
    for (const customer of customers) {
      let customerId;
      do { customerId = `MBS-${Math.floor(100000 + Math.random() * 900000)}`; } while ((await connection.execute("SELECT 1 FROM customer_profiles WHERE customer_id=?", [customerId]))[0].length);
      await connection.execute("INSERT INTO customer_profiles (user_id, customer_id, customer_name, email, profile_completion) VALUES (?, ?, ?, ?, 25)", [customer.id, customerId, customer.name, customer.email]);
    }
    const [sellers] = await connection.query("SELECT u.id, u.name, u.email, u.status, sv.business_name, sv.gst_number, sv.verification_status FROM users u LEFT JOIN seller_verifications sv ON sv.user_id=u.id WHERE u.role='Seller' AND NOT EXISTS (SELECT 1 FROM seller_profiles p WHERE p.user_id=u.id)");
    for (const seller of sellers) {
      let sellerId;
      do { sellerId = `MBS-${Math.floor(100000 + Math.random() * 900000)}`; } while ((await connection.execute("SELECT 1 FROM seller_profiles WHERE seller_id=?", [sellerId]))[0].length);
      await connection.execute("INSERT INTO seller_profiles (user_id, seller_id, seller_name, email, company_name, gst, verification_status, profile_completion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [seller.id, sellerId, seller.name, seller.email, seller.business_name || null, seller.gst_number || null, seller.verification_status || (seller.status === "Verified" ? "Verified" : "Pending"), seller.business_name && seller.gst_number ? 42 : 18]);
    }
    await connection.query(`INSERT IGNORE INTO seller_settings (seller_id) SELECT id FROM users WHERE role='Seller'`);
    await connection.query(`INSERT IGNORE INTO customer_settings (customer_id) SELECT id FROM users WHERE role='Customer'`);
    await connection.query(`INSERT IGNORE INTO support_profiles (user_id,support_id) SELECT id,CONCAT('MBS-SUP-',LPAD(id,6,'0')) FROM users WHERE role='Support'`);
  } finally {
    connection.release();
  }
}

module.exports = { migrate };
