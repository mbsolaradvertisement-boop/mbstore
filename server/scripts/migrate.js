require("dotenv").config();
const { migrate } = require("../src/config/migrate");
const { pool } = require("../src/config/database");

migrate()
  .then(() => console.log("Database tables are ready."))
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
