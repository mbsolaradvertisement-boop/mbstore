const bcrypt = require("bcryptjs");
const { pool } = require("./database");

async function bootstrapAdmin() {
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || "");
  const name = String(process.env.ADMIN_BOOTSTRAP_NAME || "Administrator").trim();

  // Admin bootstrapping is opt-in and disabled unless credentials are supplied.
  if (!email && !password) return;
  if (!email || !password) throw new Error("Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_BOOTSTRAP_EMAIL is invalid.");
  if (password.length < 12) throw new Error("ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters.");
  if (name.length < 2) throw new Error("ADMIN_BOOTSTRAP_NAME must contain at least 2 characters.");

  const [existing] = await pool.execute("SELECT id, role FROM users WHERE email=? LIMIT 1", [email]);
  if (existing.length) {
    if (existing[0].role !== "Admin") throw new Error("ADMIN_BOOTSTRAP_EMAIL already belongs to a non-admin account.");
    console.log("Bootstrap admin already exists; no changes made.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute(
    "INSERT INTO users (name, email, password_hash, role, status, login_allowed, email_verified) VALUES (?, ?, ?, 'Admin', 'Verified', TRUE, TRUE)",
    [name, email, passwordHash],
  );
  console.log("Bootstrap admin created successfully. Remove ADMIN_BOOTSTRAP_* variables and redeploy.");
}

module.exports = { bootstrapAdmin };
