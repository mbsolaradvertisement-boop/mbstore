const router=require("express").Router();const controller=require("../controllers/home.controller");const asyncHandler=require("../utils/async-handler");
router.get("/banners",asyncHandler(controller.banners));router.get("/categories",asyncHandler(controller.categories));router.get("/featured-products",asyncHandler(controller.products));module.exports=router;
