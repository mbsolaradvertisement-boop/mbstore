const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const profileRoutes = require("./routes/profile.routes");
const companyRoutes = require("./routes/company.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const catalogueRoutes = require("./routes/catalogue.routes");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
// Company logos are capped at 200 KB; base64 encoding requires a slightly larger JSON envelope.
app.use(express.json({ limit: "350kb" }));
app.use(cookieParser());
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/seller/products", productRoutes);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api", profileRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
