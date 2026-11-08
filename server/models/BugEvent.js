import mongoose from "mongoose";

const bugEventSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventType: {
      type: String,
      enum: ["bug_reported", "code_changed", "commit_added", "error_logged", "status_changed", "note_added", "bug_fixed", "cause_confirmed", "cause_rejected"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    filePath: { type: String, trim: true, default: "" },
    commitHash: { type: String, trim: true, default: "" },
    oldCode: { type: String, default: "" },
    newCode: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    stackTrace: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

bugEventSchema.index({ bugId: 1, occurredAt: 1 });
export default mongoose.model("BugEvent", bugEventSchema);
