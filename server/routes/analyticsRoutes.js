import { Router } from "express";
import { dashboardAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/dashboard", protect, asyncHandler(dashboardAnalytics));
export default router;
