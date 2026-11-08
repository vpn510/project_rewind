import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, me, listDevelopers } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: "Too many sign-in attempts. Try again later." } });
router.post("/register", loginLimit, asyncHandler(register));
router.post("/login", loginLimit, asyncHandler(login));
router.get("/me", protect, asyncHandler(me));
router.get("/developers", protect, asyncHandler(listDevelopers));
export default router;
