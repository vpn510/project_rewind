import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const allowed = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".txt", ".log", ".json", ".pdf", ".zip"]);
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const uploadEvidence = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowed.has(extension)) return callback(new AppError("Unsupported evidence file type", 400));
    callback(null, true);
  },
});

function contentMatches(extension, buffer) {
  const startsWith = (...bytes) => bytes.every((value, index) => buffer[index] === value);
  if (extension === ".png") return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (extension === ".jpg" || extension === ".jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (extension === ".gif") return ["GIF87a", "GIF89a"].some((signature) => buffer.subarray(0, 6).toString() === signature);
  if (extension === ".webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (extension === ".pdf") return buffer.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".zip") return startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0x50, 0x4b, 0x05, 0x06) || startsWith(0x50, 0x4b, 0x07, 0x08);
  if ([".txt", ".log", ".json"].includes(extension)) {
    if (buffer.includes(0)) return false;
    const text = buffer.toString("utf8");
    if (!Buffer.from(text, "utf8").equals(buffer)) return false;
    if (extension === ".json") {
      try {
        JSON.parse(text);
      } catch {
        return false;
      }
    }
    return true;
  }
  return false;
}

export const validateEvidenceContent = asyncHandler(async (req, _res, next) => {
  if (!req.file) return next();
  const buffer = await fs.readFile(req.file.path);
  const extension = path.extname(req.file.originalname).toLowerCase();
  if (!contentMatches(extension, buffer)) {
    await fs.unlink(req.file.path);
    throw new AppError("File contents do not match a supported evidence type", 400);
  }
  next();
});
