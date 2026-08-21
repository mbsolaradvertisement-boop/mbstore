require("dotenv").config();
const app = require("./src/app");
const { pool } = require("./src/config/database");
const { migrate } = require("./src/config/migrate");

const port = Number(process.env.PORT || 5000);
const host = "0.0.0.0";

async function start() {
  try {
    await migrate();
    await pool.query("SELECT 1");
    app.listen(port, host, () => console.log(`MB Store API running on ${host}:${port}`));
  } catch (error) {
    console.error("Unable to start API", { name: error?.name, code: error?.code, message: error?.message || String(error), stack: error?.stack });
    process.exit(1);
  }
}

start();
