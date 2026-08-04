const { body } = require("express-validator");

const email = () => body("email").trim().normalizeEmail().isEmail().withMessage("Invalid Email");
const name = () => body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Full name must be between 2 and 120 characters.");
const otp = () => body("otp").trim().matches(/^\d{6}$/).withMessage("Enter a valid 6-digit OTP.");
const registrationToken = () => body("registrationToken").isJWT().withMessage("Invalid registration session.");
const gst = () => body("gstNumber").trim().toUpperCase().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/).withMessage("Enter a valid 15-character GST number.");
const businessName = () => body("businessName").trim().isLength({ min: 2, max: 160 }).withMessage("Business name must be between 2 and 160 characters.");
const contactPerson = () => body("contactPerson").trim().isLength({ min: 2, max: 120 }).withMessage("Contact person must be between 2 and 120 characters.");

module.exports = {
  registerRules: [name(), email()],
  sendOtpRules: [email()],
  verifyOtpRules: [email(), otp(), name()],
  customerRules: [registrationToken()],
  sellerRules: [registrationToken(), businessName(), gst(), contactPerson()],
  loginRules: [email(), otp()],
};
