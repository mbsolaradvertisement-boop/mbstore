const router = require("express").Router();
const controller = require("../controllers/product-report.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, customerMiddleware } = require("../middleware/auth.middleware");
router.post("/", authMiddleware, customerMiddleware, asyncHandler(controller.create));
module.exports = router;
