const { pool } = require("../config/database");
const { verifyToken, hashToken } = require("../utils/tokens");
const ApiError = require("../utils/api-error");

async function authMiddleware(req, _res, next) {
  try {
    const token = req.cookies.accessToken || req.cookies.mb_session;
    if (!token) throw new ApiError(401, "Unauthorized.", "UNAUTHORIZED");
    const payload = verifyToken(token);
    if (payload.type !== "session") throw new Error();
    const [rows] = await pool.execute("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.jwt_token = ? AND s.expires_at > NOW() LIMIT 1", [hashToken(token)]);
    if (!rows[0]) throw new ApiError(401, "Session expired.", "SESSION_EXPIRED");
    if (String(payload.id || payload.sub) !== String(rows[0].id) || payload.role !== rows[0].role) throw new ApiError(401, "Invalid session.", "INVALID_TOKEN");
    if (rows[0].status === "Inactive" || !rows[0].login_allowed) throw new ApiError(401, "This account is no longer active.", "SESSION_REVOKED");
    req.user = rows[0]; req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid token.", "INVALID_TOKEN"));
  }
}

function optionalAuthMiddleware(req, res, next) {
  if (!req.cookies.accessToken && !req.cookies.mb_session) {
    req.user = null;
    return next();
  }
  return authMiddleware(req, res, next);
}

const requireRole = (role) => (req, _res, next) => req.user?.role === role ? next() : next(new ApiError(403, "Unauthorized.", "UNAUTHORIZED"));
const adminMiddleware = requireRole("Admin");
const sellerMiddleware = requireRole("Seller");
const customerMiddleware = requireRole("Customer");
const verifiedSellerMiddleware = (req, _res, next) => req.user?.role === "Seller" && req.user.status === "Verified" && req.user.login_allowed ? next() : next(new ApiError(403, "Verified seller access required.", "SELLER_NOT_VERIFIED"));
module.exports = { authMiddleware, optionalAuthMiddleware, adminMiddleware, sellerMiddleware, customerMiddleware, verifiedSellerMiddleware };
