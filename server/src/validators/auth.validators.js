const { body } = require("express-validator");

const email = () => body("email").exists({ values: "falsy" }).withMessage("Email is required.").bail().isString().withMessage("Email must be text.").bail().trim().normalizeEmail().isEmail().withMessage("Enter a valid email address.").bail().isLength({ max: 254 }).withMessage("Email must not exceed 254 characters.");
const name = () => body("name").exists({ values: "falsy" }).withMessage("Full name is required.").bail().isString().withMessage("Full name must be text.").bail().trim().isLength({ min: 2, max: 120 }).withMessage("Full name must be between 2 and 120 characters.");
const password = () => body("password").exists({ values: "falsy" }).withMessage("Password is required.").bail().isString().withMessage("Password must be text.").bail().isLength({ min: 8 }).withMessage("Password must contain at least 8 characters.").bail().isLength({ max: 72 }).withMessage("Password must not exceed 72 characters.");
const confirmPassword = () => body("confirmPassword").exists({ values: "falsy" }).withMessage("Confirm password is required.").bail().isString().withMessage("Confirm password must be text.").bail().custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match.");
const role = () => body("role").isIn(["customer", "seller"]).withMessage("Choose Customer or Seller.");
const gst = () => body("gstNumber").trim().toUpperCase().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/).withMessage("Enter a valid 15-character GST number.");
const businessName = () => body("businessName").trim().isLength({ min: 2, max: 160 }).withMessage("Business name must be between 2 and 160 characters.");
const contactPerson = () => body("contactPerson").trim().isLength({ min: 2, max: 120 }).withMessage("Contact person must be between 2 and 120 characters.");
const sellerBusinessName = () => body("businessName").if((_, { req }) => req.body.role === "seller").trim().isLength({ min: 2, max: 160 }).withMessage("Business name must be between 2 and 160 characters.");
const sellerGst = () => body("gstNumber").if((_, { req }) => req.body.role === "seller").trim().toUpperCase().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/).withMessage("Enter a valid 15-character GST number.");
const sellerContact = () => body("contactPerson").if((_, { req }) => req.body.role === "seller").trim().isLength({ min: 2, max: 120 }).withMessage("Contact person must be between 2 and 120 characters.");

module.exports = {
  registerRules: [name(), email(), password(), confirmPassword(), role(), sellerBusinessName(), sellerGst(), sellerContact()],
  sellerRules: [name(), email(), password(), confirmPassword(), businessName(), gst(), contactPerson()],
  loginRules: [email(), password()],
  forgotPasswordRules: [email()],
  resetPasswordRules: [body("token").isString().notEmpty().withMessage("Reset token is required."), password(), confirmPassword()],
};
