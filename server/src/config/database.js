const mysql = require("mysql2/promise");

function databaseConfig() {
  if (process.env.DATABASE_URL) {
    let url;
    try { url = new URL(process.env.DATABASE_URL); }
    catch { throw new Error("DATABASE_URL is not a valid database URL."); }
    if (!["mysql:", "mysql2:"].includes(url.protocol)) throw new Error("DATABASE_URL must use the mysql:// protocol.");
    return {
      host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.replace(/^\//, "")),
      ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" },
    };
  }
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required database environment variables: ${missing.join(", ")}. Set them in the Render service environment.`);
  return {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  };
}

const pool = mysql.createPool({
  ...databaseConfig(),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  timezone: "Z",
});

module.exports = { pool };
