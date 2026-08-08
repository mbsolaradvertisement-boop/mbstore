const router = require("express").Router();
const controller = require("../controllers/profile.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, customerMiddleware, sellerMiddleware } = require("../middleware/auth.middleware");
router.get("/customer/profile", authMiddleware, customerMiddleware, asyncHandler(controller.getCustomer));
router.put("/customer/profile", authMiddleware, customerMiddleware, asyncHandler(controller.updateCustomer));
router.get("/seller/profile", authMiddleware, sellerMiddleware, asyncHandler(controller.getSeller));
router.put("/seller/profile", authMiddleware, sellerMiddleware, asyncHandler(controller.updateSeller));
module.exports = router;
