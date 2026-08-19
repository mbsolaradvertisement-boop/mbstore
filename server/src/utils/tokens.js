const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const SESSION_DAYS = 7;
const ACCESS_MINUTES = 15;
const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const signAccessToken = (user, sessionId) => jwt.sign({ sub: String(user.id), role: user.role, sid: String(sessionId), type: "access" }, accessSecret(), { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || `${ACCESS_MINUTES}m`, issuer: "mb-store" });
const verifyAccessToken = (token) => jwt.verify(token, accessSecret(), { issuer: "mb-store" });
// Kept only to validate sessions issued before the access/refresh migration.
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { issuer: "mb-store" });
const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
module.exports = { SESSION_DAYS, ACCESS_MINUTES, signAccessToken, verifyAccessToken, verifyToken, generateRefreshToken, hashToken };
