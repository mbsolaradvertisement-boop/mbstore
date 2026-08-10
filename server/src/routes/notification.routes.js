const router = require("express").Router();
const controller = require("../controllers/notification.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, sellerMiddleware } = require("../middleware/auth.middleware");

router.use(authMiddleware, sellerMiddleware);
router.get("/", asyncHandler(controller.sellerList));
router.patch("/read-all", asyncHandler(controller.markAllRead));
router.patch("/:id/read", asyncHandler(controller.markRead));
router.delete("/selected", asyncHandler(controller.removeSelected));
router.delete("/", asyncHandler(controller.removeAll));

module.exports = router;
