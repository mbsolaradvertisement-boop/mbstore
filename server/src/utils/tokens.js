const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const SESSION_DAYS = 7;
const signSession = (user) => jwt.sign({ sub: user.id, role: user.role, type: "session" }, process.env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d`, issuer: "mb-store" });
const signRegistration = (email, name) => jwt.sign({ email, name, type: "registration" }, process.env.JWT_SECRET, { expiresIn: "10m", issuer: "mb-store" });
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { issuer: "mb-store" });
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const hashOtp = (email, otp) => crypto.createHmac("sha256", process.env.OTP_HASH_SECRET || process.env.JWT_SECRET).update(`${email}:${otp}`).digest("hex");

module.exports = { SESSION_DAYS, signSession, signRegistration, verifyToken, hashToken, hashOtp };
