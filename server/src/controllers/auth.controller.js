const auth = require("../services/auth.service");

const COOKIE_NAME = "accessToken";
const LEGACY_COOKIE_NAME = "mb_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = (expires) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires, maxAge: SEVEN_DAYS_MS, path: "/" });
const clearCookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
const metadata = (req) => ({ device: req.get("user-agent"), ip: req.ip });
const setSession = (res, result, status = 200) => res.status(status).clearCookie(LEGACY_COOKIE_NAME, clearCookieOptions()).cookie(COOKIE_NAME, result.token, cookieOptions(result.expiresAt)).json({ success: true, user: result.user });

exports.register = async (req, res) => res.status(202).json(await auth.startRegistration(req.body.name, req.body.email));
exports.sendOtp = async (req, res) => res.status(202).json(await auth.sendLoginOtp(req.body.email));
exports.verifyOtp = async (req, res) => res.json(await auth.verifyRegistrationOtp(req.body.email, req.body.otp, req.body.name));
exports.registerCustomer = async (req, res) => setSession(res, await auth.registerCustomer(req.body.registrationToken, metadata(req)), 201);
exports.registerSeller = async (req, res) => res.status(201).json({ user: await auth.registerSeller(req.body.registrationToken, { businessName: req.body.businessName, gstNumber: req.body.gstNumber.toUpperCase(), contactPerson: req.body.contactPerson }) });
exports.login = async (req, res) => setSession(res, await auth.login(req.body.email, req.body.otp, metadata(req)));
exports.logout = async (req, res) => { await auth.logout(req.cookies[COOKIE_NAME] || req.cookies[LEGACY_COOKIE_NAME]); res.clearCookie(COOKIE_NAME, clearCookieOptions()).clearCookie(LEGACY_COOKIE_NAME, clearCookieOptions()).status(204).end(); };
exports.me = async (req, res) => res.json({ authenticated: true, user: auth.publicUser(req.user) });
