const { pool } = require("../config/database");
const otpService = require("./otp.service");
const emailService = require("./email.service");
const { signSession, signRegistration, verifyToken, hashToken, SESSION_DAYS } = require("../utils/tokens");
const ApiError = require("../utils/api-error");

const publicUser = ({ id, name, email, role, status, login_allowed, email_verified, created_at }) => ({ id, name, email, role, status, loginAllowed: Boolean(login_allowed), emailVerified: Boolean(email_verified), createdAt: created_at });
async function findUserByEmail(email) { const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [otpService.normalize(email)]); return rows[0] || null; }
async function findUserById(id) { const [rows] = await pool.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [id]); return rows[0] ? publicUser(rows[0]) : null; }

async function startRegistration(name, email) {
  email = otpService.normalize(email);
  if (await findUserByEmail(email)) throw new ApiError(409, "Email already exists.", "DUPLICATE_EMAIL");
  await otpService.issue(email, name);
  return { email, expiresIn: 600, resendAfter: 60 };
}

async function sendLoginOtp(email) {
  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(404, "No account found.", "USER_NOT_FOUND");
  await otpService.issue(user.email, user.name);
  return { email: user.email, expiresIn: 600, resendAfter: 60 };
}

async function verifyRegistrationOtp(email, otp, name) {
  email = otpService.normalize(email);
  if (await findUserByEmail(email)) throw new ApiError(409, "Email already exists.", "DUPLICATE_EMAIL");
  await otpService.verify(email, otp);
  return { registrationToken: signRegistration(email, name) };
}

function registrationFromToken(token) {
  try { const payload = verifyToken(token); if (payload.type !== "registration" || !payload.email || !payload.name) throw new Error(); return payload; }
  catch { throw new ApiError(401, "Registration session expired. Verify your email again.", "SESSION_EXPIRED"); }
}

async function createSession(user, metadata) {
  const token = signSession(user); const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await pool.execute("INSERT INTO sessions (user_id, jwt_token, expires_at, device, ip_address) VALUES (?, ?, ?, ?, ?)", [user.id, hashToken(token), expiresAt, metadata.device?.slice(0, 255) || null, metadata.ip || null]);
  return { token, user: publicUser(user), expiresAt };
}

async function generateProfileId(connection, table, column) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = `MBS-${Math.floor(100000 + Math.random() * 900000)}`;
    const [rows] = await connection.execute(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`, [id]);
    if (!rows.length) return id;
  }
  throw new ApiError(500, "Unable to generate a profile ID.", "ID_GENERATION_FAILED");
}

async function registerCustomer(token, metadata) {
  const { email, name } = registrationFromToken(token);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO users (name, email, role, status, login_allowed, email_verified) VALUES (?, ?, 'Customer', 'Verified', TRUE, TRUE)", [name, email]);
    const customerId = await generateProfileId(connection, "customer_profiles", "customer_id");
    await connection.execute("INSERT INTO customer_profiles (user_id, customer_id, customer_name, email, profile_completion) VALUES (?, ?, ?, ?, 25)", [result.insertId, customerId, name, email]);
    await connection.commit();
    const user = await findUserByEmail(email); const session = await createSession(user, metadata);
    emailService.sendWelcomeCustomer(email, name).catch((error) => console.error("Welcome email failed:", error.message));
    return session;
  } catch (error) { await connection.rollback(); if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "Email already exists.", "DUPLICATE_EMAIL"); throw error; }
  finally { connection.release(); }
}

async function registerSeller(token, details) {
  const { email, name } = registrationFromToken(token); const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [user] = await connection.execute("INSERT INTO users (name, email, role, status, login_allowed, email_verified) VALUES (?, ?, 'Seller', 'Pending', FALSE, TRUE)", [name, email]);
    await connection.execute("INSERT INTO seller_verifications (user_id, business_name, gst_number, contact_person, verification_status) VALUES (?, ?, ?, ?, 'Pending')", [user.insertId, details.businessName, details.gstNumber, details.contactPerson]);
    const sellerId = await generateProfileId(connection, "seller_profiles", "seller_id");
    await connection.execute("INSERT INTO seller_profiles (user_id, seller_id, seller_name, email, company_name, gst, verification_status, profile_completion) VALUES (?, ?, ?, ?, ?, ?, 'Pending', 42)", [user.insertId, sellerId, name, email, details.businessName, details.gstNumber]);
    await connection.commit(); return findUserById(user.insertId);
  } catch (error) { await connection.rollback(); if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, error.message.toLowerCase().includes("gst") ? "GST number already exists." : "Email already exists.", error.message.toLowerCase().includes("gst") ? "DUPLICATE_GST" : "DUPLICATE_EMAIL"); throw error; }
  finally { connection.release(); }
}

function assertCanLogin(user) {
  if (!user) throw new ApiError(404, "No account found.", "USER_NOT_FOUND");
  if (user.status === "Inactive") throw new ApiError(403, "Your account is inactive.", "USER_INACTIVE");
  if (user.role === "Seller" && user.status === "Pending") throw new ApiError(403, "Your seller verification request is under review.", "SELLER_PENDING");
  if (user.role === "Seller" && user.status === "Rejected") throw new ApiError(403, "Your seller application has been rejected. Contact support for more details.", "SELLER_REJECTED");
  if (!user.login_allowed || user.status !== "Verified" || !user.email_verified) throw new ApiError(403, "Login is not allowed for this account.", "LOGIN_DISABLED");
}

async function login(email, otp, metadata) { const user = await findUserByEmail(email); if (!user) throw new ApiError(404, "No account found.", "USER_NOT_FOUND"); await otpService.verify(user.email, otp); assertCanLogin(user); return createSession(user, metadata); }
async function logout(token) { if (token) await pool.execute("DELETE FROM sessions WHERE jwt_token = ?", [hashToken(token)]); }

module.exports = { startRegistration, sendLoginOtp, verifyRegistrationOtp, registerCustomer, registerSeller, login, logout, findUserById, publicUser };
