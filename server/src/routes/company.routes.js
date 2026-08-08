const router = require("express").Router();
const { param } = require("express-validator");
const controller = require("../controllers/company.controller");
const asyncHandler = require("../utils/async-handler");
const validate = require("../middleware/validate.middleware");

router.get("/", asyncHandler(controller.publicList));
router.get("/:id/logo", param("id").isInt({min:1}), validate, asyncHandler(controller.logo));
module.exports = router;
