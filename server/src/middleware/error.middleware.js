const notFound = (_req, _res, next) => { const error = new Error("Route not found."); error.status = 404; error.code = "NOT_FOUND"; next(error); };
const errorHandler = (error, _req, res, _next) => {
  if (process.env.NODE_ENV !== "production" && error.status >= 500) console.error(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : "An unexpected error occurred.", code: error.code || "SERVER_ERROR" });
};
module.exports = { notFound, errorHandler };
