const router=require("express").Router(),controller=require("../controllers/seller-dashboard.controller"),asyncHandler=require("../utils/async-handler");
const {authMiddleware,sellerMiddleware}=require("../middleware/auth.middleware");
router.get("/",authMiddleware,sellerMiddleware,asyncHandler(controller.get));
module.exports=router;
