import AppError from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal server error";
  if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON request";
  } else if (error.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body exceeds the 1 MB limit";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(", ");
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier";
  } else if (error.name === "MulterError") {
    statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = error.code === "LIMIT_FILE_SIZE" ? "File exceeds the 10 MB limit" : error.message;
  }
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ message });
}
