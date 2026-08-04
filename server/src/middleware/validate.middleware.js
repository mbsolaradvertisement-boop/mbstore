const { validationResult } = require("express-validator");
module.exports = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const error = new Error(errors.array()[0].msg); error.status = 422; error.code = "VALIDATION_ERROR"; next(error);
};
