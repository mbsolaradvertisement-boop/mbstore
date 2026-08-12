const router = require("express").Router();
const controller = require("../controllers/report.controller");
const pdfController = require("../controllers/report-pdf.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, sellerMiddleware } = require("../middleware/auth.middleware");

router.get("/", authMiddleware, sellerMiddleware, asyncHandler(controller.sellerReport));
router.get("/pdf", authMiddleware, sellerMiddleware, asyncHandler(pdfController.pdf));

module.exports = router;
