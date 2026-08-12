const router=require("express").Router();
const controller=require("../controllers/seller-settings.controller");
const asyncHandler=require("../utils/async-handler");
const {authMiddleware,sellerMiddleware}=require("../middleware/auth.middleware");
router.use(authMiddleware,sellerMiddleware);
router.get("/",asyncHandler(controller.get));
router.put("/",asyncHandler(controller.update));
module.exports=router;
