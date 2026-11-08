import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    technologies: [{ type: String, trim: true }],
    repositoryUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ members: 1 });
export default mongoose.model("Project", projectSchema);
