require("dotenv").config();
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { pool } = require("../src/config/database");
const { migrate } = require("../src/config/migrate");
const bcrypt = require("bcryptjs");

async function run() {
  await migrate(); const prompt = readline.createInterface({ input, output });
  try {
    const name = (await prompt.question("Admin name: ")).trim();
    const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
    const password = await prompt.question("Admin password (minimum 8 characters): ");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) throw new Error("A valid name, email, and password of at least 8 characters are required.");
    await pool.execute("INSERT INTO users (name, email, password_hash, role, status, login_allowed, email_verified) VALUES (?, ?, ?, 'Admin', 'Verified', TRUE, TRUE)", [name, email, await bcrypt.hash(password, 12)]);
    console.log("Admin created successfully.");
  } finally { prompt.close(); await pool.end(); }
}
run().catch((error) => { console.error(error.code === "ER_DUP_ENTRY" ? "That email is already registered." : error.message); process.exitCode = 1; });
