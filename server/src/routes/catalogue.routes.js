const router=require("express").Router();
const controller=require("../controllers/catalogue.controller");
const asyncHandler=require("../utils/async-handler");
router.get("/products",asyncHandler(controller.list));
router.get("/filters",asyncHandler(controller.filters));
module.exports=router;
