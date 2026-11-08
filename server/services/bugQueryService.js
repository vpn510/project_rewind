import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export function createProjectScope(projectIds, requestedProjectId) {
  if (requestedProjectId && !mongoose.isValidObjectId(requestedProjectId)) {
    throw new AppError("Invalid project identifier", 400);
  }
  return {
    projectId: {
      $in: projectIds,
      ...(requestedProjectId ? { $eq: requestedProjectId } : {}),
    },
  };
}
