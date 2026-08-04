require("dotenv").config();
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { pool } = require("../src/config/database");
const { migrate } = require("../src/config/migrate");

async function run() {
  await migrate(); const prompt = readline.createInterface({ input, output });
  try {
    const name = (await prompt.question("Admin name: ")).trim();
    const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid name and email are required.");
    await pool.execute("INSERT INTO users (name, email, role, status, login_allowed, email_verified) VALUES (?, ?, 'Admin', 'Verified', TRUE, TRUE)", [name, email]);
    console.log("Admin created successfully.");
  } finally { prompt.close(); await pool.end(); }
}
run().catch((error) => { console.error(error.code === "ER_DUP_ENTRY" ? "That email is already registered." : error.message); process.exitCode = 1; });
