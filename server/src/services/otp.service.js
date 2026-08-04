const crypto = require("crypto");
const { pool } = require("../config/database");
const { hashOtp } = require("../utils/tokens");
const { sendOtpEmail } = require("./email.service");
const ApiError = require("../utils/api-error");

const normalize = (email) => email.trim().toLowerCase();

async function issue(email, name) {
  email = normalize(email);
  const [[recent]] = await pool.execute("SELECT created_at FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1", [email]);
  if (recent && Date.now() - new Date(recent.created_at).getTime() < 60000) throw new ApiError(429, "Please wait 60 seconds before requesting another OTP.", "OTP_RESEND_LIMIT");
  const [[volume]] = await pool.execute("SELECT COUNT(*) AS total FROM email_otps WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)", [email]);
  if (Number(volume.total) >= 5) throw new ApiError(429, "Too many OTP requests. Please try again later.", "OTP_RATE_LIMIT");
  const otp = crypto.randomInt(100000, 1000000).toString();
  await pool.execute("UPDATE email_otps SET used = TRUE WHERE email = ? AND used = FALSE", [email]);
  const [result] = await pool.execute("INSERT INTO email_otps (email, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [email, hashOtp(email, otp)]);
  try { await sendOtpEmail(email, otp, name); }
  catch (error) { await pool.execute("DELETE FROM email_otps WHERE id = ?", [result.insertId]); throw error; }
}

async function verify(email, otp) {
  email = normalize(email);
  const connection = await pool.getConnection();
  let transactionOpen = false;
  try {
    await connection.beginTransaction(); transactionOpen = true;
    const [rows] = await connection.execute("SELECT * FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [email]);
    const record = rows[0];
    if (!record || record.used) throw new ApiError(400, "OTP is invalid or has already been used.", "INVALID_OTP");
    if (record.attempts >= 5) throw new ApiError(429, "Maximum Attempts Reached", "OTP_MAX_ATTEMPTS");
    if (new Date(record.expires_at).getTime() <= Date.now()) { await connection.execute("UPDATE email_otps SET used = TRUE WHERE id = ?", [record.id]); await connection.commit(); transactionOpen = false; throw new ApiError(400, "OTP Expired", "OTP_EXPIRED"); }
    const valid = crypto.timingSafeEqual(Buffer.from(record.otp_hash, "hex"), Buffer.from(hashOtp(email, otp), "hex"));
    if (!valid) { await connection.execute("UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?", [record.id]); await connection.commit(); transactionOpen = false; throw new ApiError(400, record.attempts + 1 >= 5 ? "Maximum Attempts Reached" : "Invalid OTP", record.attempts + 1 >= 5 ? "OTP_MAX_ATTEMPTS" : "INVALID_OTP"); }
    await connection.execute("DELETE FROM email_otps WHERE email = ?", [email]);
    await connection.commit(); transactionOpen = false;
  } catch (error) { if (transactionOpen) await connection.rollback(); throw error; }
  finally { connection.release(); }
}

module.exports = { issue, verify, normalize };
