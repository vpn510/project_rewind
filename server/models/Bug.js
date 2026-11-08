import mongoose from "mongoose";

const bugSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    status: { type: String, enum: ["open", "investigating", "in-progress", "resolved", "closed"], default: "open", index: true },
    environment: { type: String, trim: true, maxlength: 500, default: "" },
    affectedFile: { type: String, trim: true, maxlength: 500, default: "" },
    rootCause: { type: String, trim: true, maxlength: 2000, default: "" },
    rootCauseConfidence: { type: Number, min: 0, max: 100, default: null },
    rootCauseEvent: { type: mongoose.Schema.Types.ObjectId, ref: "BugEvent", default: null },
    rootCauseDecision: { type: String, enum: ["suspected", "confirmed", "rejected", null], default: null },
  },
  { timestamps: true }
);

bugSchema.index({ projectId: 1, updatedAt: -1 });
bugSchema.index({ title: "text", description: "text", affectedFile: "text" });
export default mongoose.model("Bug", bugSchema);
