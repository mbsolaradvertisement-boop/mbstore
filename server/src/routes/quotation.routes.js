const router = require("express").Router();
const controller = require("../controllers/quotation.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, customerMiddleware, sellerMiddleware } = require("../middleware/auth.middleware");

router.post("/quotations", authMiddleware, customerMiddleware, asyncHandler(controller.create));
router.get("/customer/quotations", authMiddleware, customerMiddleware, asyncHandler(controller.customerList));
router.get("/customer/quotations/:id", authMiddleware, customerMiddleware, asyncHandler(controller.customerDetail));
router.get("/seller/quotations", authMiddleware, sellerMiddleware, asyncHandler(controller.sellerList));
router.get("/seller/quotations/:id", authMiddleware, sellerMiddleware, asyncHandler(controller.sellerDetail));
router.post("/seller/quotations/:id/respond", authMiddleware, sellerMiddleware, asyncHandler(controller.respond));
router.post("/seller/quotations/:id/reject", authMiddleware, sellerMiddleware, asyncHandler(controller.reject));

module.exports = router;
