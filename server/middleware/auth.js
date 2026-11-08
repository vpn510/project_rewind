import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError("Authentication required", 401);
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired session", 401);
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("Account no longer exists", 401);
  req.user = user;
  next();
});
