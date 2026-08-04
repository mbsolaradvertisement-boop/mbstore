require("dotenv").config();
const app = require("./src/app");
const { pool } = require("./src/config/database");
const { migrate } = require("./src/config/migrate");

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await migrate();
    await pool.query("SELECT 1");
    app.listen(port, () => console.log(`MB Store API running on port ${port}`));
  } catch (error) {
    console.error("Unable to start API:", error.message);
    process.exit(1);
  }
}

start();
