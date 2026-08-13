const router=require("express").Router();
const controller=require("../controllers/customer-dashboard.controller");
const asyncHandler=require("../utils/async-handler");
const {authMiddleware,customerMiddleware}=require("../middleware/auth.middleware");
router.get("/",authMiddleware,customerMiddleware,asyncHandler(controller.get));
module.exports=router;
