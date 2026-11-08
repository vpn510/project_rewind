import { Router } from "express";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import {
  listBugs, createBug, getBug, updateBug, deleteBug, addEvent, addComment, uploadAttachment, downloadAttachment, analyzeBug, decideRootCause, loadBug,
} from "../controllers/bugController.js";
import { getTimeline } from "../services/timelineService.js";
import { protect } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";
import { uploadEvidence, validateEvidenceContent } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/", asyncHandler(listBugs));
router.post("/", asyncHandler(createBug));
router.use("/:id", validateId, asyncHandler(loadBug));
router.get("/:id", asyncHandler(getBug));
router.put("/:id", asyncHandler(updateBug));
router.delete("/:id", asyncHandler(deleteBug));
router.get("/:id/timeline", asyncHandler(async (req, res) => res.json(await getTimeline(req.bug._id, req.query))));
router.get("/:id/attachments/:attachmentId", asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.attachmentId)) throw new AppError("Invalid evidence identifier", 400);
  return downloadAttachment(req, res, next);
}));
router.post("/:id/events", asyncHandler(addEvent));
router.post("/:id/comments", asyncHandler(addComment));
router.post("/:id/attachments", uploadEvidence.single("file"), validateEvidenceContent, asyncHandler(uploadAttachment));
router.post("/:id/analyze", asyncHandler(analyzeBug));
router.post("/:id/root-cause-decision", asyncHandler(decideRootCause));
export default router;
