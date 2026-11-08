import { Router } from "express";
import { listProjects, createProject, getProject, updateProject, deleteProject, projectAnalytics } from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";
import { loadProject } from "../middleware/projectAccess.js";
import { validateId } from "../middleware/validateId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/", asyncHandler(listProjects));
router.post("/", asyncHandler(createProject));
router.get("/:id/analytics", validateId, loadProject, asyncHandler(projectAnalytics));
router.get("/:id", validateId, loadProject, asyncHandler(getProject));
router.put("/:id", validateId, loadProject, asyncHandler(updateProject));
router.delete("/:id", validateId, loadProject, asyncHandler(deleteProject));
export default router;
