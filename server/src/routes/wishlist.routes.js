const router = require("express").Router();
const controller = require("../controllers/wishlist.controller");
const asyncHandler = require("../utils/async-handler");
const { authMiddleware, customerMiddleware } = require("../middleware/auth.middleware");

router.use(authMiddleware, customerMiddleware);
router.get("/", asyncHandler(controller.list));
router.get("/ids", asyncHandler(controller.ids));
router.post("/toggle", asyncHandler(controller.toggle));
router.delete("/:productId", asyncHandler(controller.remove));

module.exports = router;
