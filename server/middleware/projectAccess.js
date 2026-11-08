import mongoose from "mongoose";
import Project from "../models/Project.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loadProject = asyncHandler(async (req, _res, next) => {
  const projectId = req.params.projectId || req.params.id;
  if (!mongoose.isValidObjectId(projectId)) throw new AppError("Invalid project identifier", 400);
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  });
  if (!project) throw new AppError("Project not found", 404);
  req.project = project;
  next();
});
