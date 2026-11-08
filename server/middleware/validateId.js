import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export function validateId(req, _res, next) {
  const id = req.params.id;
  if (id && !mongoose.isValidObjectId(id)) return next(new AppError("Invalid identifier", 400));
  next();
}
