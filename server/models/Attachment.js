import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: "Bug", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    storageName: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);
