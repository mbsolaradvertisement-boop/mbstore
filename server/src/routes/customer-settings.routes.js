const router=require("express").Router(),controller=require("../controllers/customer-settings.controller"),asyncHandler=require("../utils/async-handler");
const {authMiddleware,customerMiddleware}=require("../middleware/auth.middleware");
router.use(authMiddleware,customerMiddleware);router.get("/",asyncHandler(controller.get));router.put("/",asyncHandler(controller.update));module.exports=router;
