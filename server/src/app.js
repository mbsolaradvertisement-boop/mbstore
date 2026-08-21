const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const supportRoutes = require("./routes/support.routes");
const profileRoutes = require("./routes/profile.routes");
const companyRoutes = require("./routes/company.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const catalogueRoutes = require("./routes/catalogue.routes");
const quotationRoutes = require("./routes/quotation.routes");
const notificationRoutes = require("./routes/notification.routes");
const customerNotificationRoutes = require("./routes/customer-notification.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const reportRoutes = require("./routes/report.routes");
const sellerSettingsRoutes = require("./routes/seller-settings.routes");
const sellerDashboardRoutes = require("./routes/seller-dashboard.routes");
const customerSettingsRoutes = require("./routes/customer-settings.routes");
const customerDashboardRoutes = require("./routes/customer-dashboard.routes");
const productReportRoutes = require("./routes/product-report.routes");
const userSupportTicketRoutes = require("./routes/user-support-ticket.routes");
const homeRoutes = require("./routes/home.routes");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://mbstorehub.vercel.app",
  ...String(process.env.CLIENT_URL || "").split(","),
  ...String(process.env.CLIENT_URLS || "").split(","),
].map(origin => origin.trim().replace(/\/$/, "")).filter(Boolean));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Requests without an Origin header are not browser cross-origin requests.
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(null, false);
  },
}));
// Company logos are capped at 200 KB; base64 encoding requires a slightly larger JSON envelope.
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/seller/products", productRoutes);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api", quotationRoutes);
app.use("/api/seller/notifications", notificationRoutes);
app.use("/api/customer/notifications", customerNotificationRoutes);
app.use("/api/customer/wishlist", wishlistRoutes);
app.use("/api/seller/reports", reportRoutes);
app.use("/api/seller/settings", sellerSettingsRoutes);
app.use("/api/seller/dashboard", sellerDashboardRoutes);
app.use("/api/customer/settings", customerSettingsRoutes);
app.use("/api/customer/dashboard", customerDashboardRoutes);
app.use("/api/customer/product-reports", productReportRoutes);
app.use("/api/support-tickets", userSupportTicketRoutes);
app.use("/api", profileRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
