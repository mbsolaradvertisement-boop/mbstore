const router=require("express").Router();
const controller=require("../controllers/catalogue.controller");
const asyncHandler=require("../utils/async-handler");
const {authMiddleware,customerMiddleware}=require("../middleware/auth.middleware");
router.get("/products",asyncHandler(controller.list));
router.get("/filters",asyncHandler(controller.filters));
router.post("/products/:id/view",authMiddleware,customerMiddleware,asyncHandler(controller.recordView));
module.exports=router;
