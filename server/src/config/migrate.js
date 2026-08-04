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

    const [sellerColumns] = await connection.query("SHOW COLUMNS FROM seller_verifications");
    const sellerColumnNames = new Set(sellerColumns.map((column) => column.Field));
    if (!sellerColumnNames.has("business_name")) await connection.query("ALTER TABLE seller_verifications ADD COLUMN business_name VARCHAR(160) NULL AFTER user_id");
    if (!sellerColumnNames.has("contact_person")) await connection.query("ALTER TABLE seller_verifications ADD COLUMN contact_person VARCHAR(120) NULL AFTER gst_number");
  } finally {
    connection.release();
  }
}

module.exports = { migrate };
