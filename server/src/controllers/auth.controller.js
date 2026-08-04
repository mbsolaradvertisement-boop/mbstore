const auth = require("../services/auth.service");

const cookieOptions = (expires) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires, path: "/" });
const metadata = (req) => ({ device: req.get("user-agent"), ip: req.ip });
const setSession = (res, result, status = 200) => res.status(status).cookie("mb_session", result.token, cookieOptions(result.expiresAt)).json({ user: result.user });

exports.register = async (req, res) => res.status(202).json(await auth.startRegistration(req.body.name, req.body.email));
exports.sendOtp = async (req, res) => res.status(202).json(await auth.sendLoginOtp(req.body.email));
exports.verifyOtp = async (req, res) => res.json(await auth.verifyRegistrationOtp(req.body.email, req.body.otp, req.body.name));
exports.registerCustomer = async (req, res) => setSession(res, await auth.registerCustomer(req.body.registrationToken, metadata(req)), 201);
exports.registerSeller = async (req, res) => res.status(201).json({ user: await auth.registerSeller(req.body.registrationToken, { businessName: req.body.businessName, gstNumber: req.body.gstNumber.toUpperCase(), contactPerson: req.body.contactPerson }) });
exports.login = async (req, res) => setSession(res, await auth.login(req.body.email, req.body.otp, metadata(req)));
exports.logout = async (req, res) => { await auth.logout(req.cookies.mb_session); res.clearCookie("mb_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" }); res.status(204).end(); };
exports.me = async (req, res) => res.json({ user: req.user ? auth.publicUser(req.user) : null });
