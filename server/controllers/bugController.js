import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Bug from "../models/Bug.js";
import BugEvent from "../models/BugEvent.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { addTimelineEvent, getTimeline } from "../services/timelineService.js";
import { analyzeRootCause } from "../services/rootCauseService.js";
import { createProjectScope } from "../services/bugQueryService.js";

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");

export async function listBugs(req, res) {
  const projectIds = (await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] }).select("_id")).map((project) => project._id);
  const filter = createProjectScope(projectIds, req.query.projectId);
  if (req.query.status) {
    if (!["open", "investigating", "in-progress", "resolved", "closed"].includes(req.query.status)) throw new AppError("Invalid status filter", 400);
    filter.status = req.query.status;
  }
  if (req.query.severity) {
    if (!["low", "medium", "high", "critical"].includes(req.query.severity)) throw new AppError("Invalid severity filter", 400);
    filter.severity = req.query.severity;
  }
  if (req.query.assignedTo) {
    if (!mongoose.isValidObjectId(req.query.assignedTo)) throw new AppError("Invalid assignee filter", 400);
    filter.assignedTo = req.query.assignedTo;
  }
  if (req.query.search?.trim()) filter.$text = { $search: req.query.search.trim().slice(0, 100) };
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const [items, total] = await Promise.all([
    Bug.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("projectId", "name").populate("reportedBy", "name").populate("assignedTo", "name avatar"),
    Bug.countDocuments(filter),
  ]);
  res.json({ items, page, pages: Math.ceil(total / limit), total });
}

export async function createBug(req, res) {
  const { title, description, projectId, severity, environment, affectedFile, assignedTo } = req.body;
  if (typeof title !== "string" || typeof description !== "string" || typeof projectId !== "string" || !title.trim() || !description.trim()) {
    throw new AppError("Title, description, and project are required", 400);
  }
  const project = await Project.findOne({ _id: projectId, $or: [{ owner: req.user._id }, { members: req.user._id }] });
  if (!project) throw new AppError("Project not found", 404);
  if (assignedTo) await validateAssignee(projectId, assignedTo);
  const bug = await Bug.create({ title: title.trim(), description, projectId, severity, environment, affectedFile, assignedTo: assignedTo || null, reportedBy: req.user._id });
  await addTimelineEvent({ bug, userId: req.user._id, eventType: "bug_reported", title: "Bug reported", description: bug.title });
  await bug.populate("projectId", "name");
  res.status(201).json(bug);
}

export async function getBug(req, res) {
  const bug = await Bug.findById(req.params.id)
    .populate("projectId", "name owner members")
    .populate("reportedBy", "name email avatar")
    .populate("assignedTo", "name email avatar");
  if (!bug) throw new AppError("Bug not found", 404);
  if (!bug.projectId.owner.equals(req.user._id) && !bug.projectId.members.some((member) => member.equals(req.user._id))) throw new AppError("Bug not found", 404);
  const [timeline, comments, attachments] = await Promise.all([
    getTimeline(bug._id, req.query),
    Comment.find({ bugId: bug._id }).sort({ createdAt: 1 }).populate("userId", "name avatar"),
    Attachment.find({ bugId: bug._id }).sort({ createdAt: -1 }).populate("uploadedBy", "name"),
  ]);
  res.json({ bug, events: timeline.items, timelineMeta: timeline, comments, attachments });
}

export async function updateBug(req, res) {
  const bug = req.bug;
  const fields = ["title", "description", "severity", "environment", "affectedFile", "assignedTo", "rootCause"];
  for (const key of fields) if (req.body[key] !== undefined) bug[key] = req.body[key];
  if (req.body.assignedTo) await validateAssignee(bug.projectId, req.body.assignedTo);
  if (req.body.status && req.body.status !== bug.status) {
    const previous = bug.status;
    bug.status = req.body.status;
    await addTimelineEvent({ bug, userId: req.user._id, eventType: bug.status === "resolved" ? "bug_fixed" : "status_changed", title: `Status changed: ${previous} → ${bug.status}`, description: req.body.statusNote || "" });
  }
  await bug.save();
  await bug.populate("projectId", "name");
  await bug.populate("assignedTo", "name avatar");
  res.json(bug);
}

async function validateAssignee(projectId, userId) {
  if (!mongoose.isValidObjectId(userId)) throw new AppError("Invalid assignee", 400);
  const [isMember, exists] = await Promise.all([
    Project.exists({ _id: projectId, $or: [{ owner: userId }, { members: userId }] }),
    User.exists({ _id: userId }),
  ]);
  if (!isMember || !exists) throw new AppError("Assignee must be a member of this project", 400);
}

export async function deleteBug(req, res) {
  const bug = req.bug;
  await Promise.all([
    BugEvent.deleteMany({ bugId: bug._id }),
    Comment.deleteMany({ bugId: bug._id }),
    Attachment.deleteMany({ bugId: bug._id }),
    bug.deleteOne(),
  ]);
  res.status(204).end();
}

export async function addEvent(req, res) {
  const { eventType, title, description, occurredAt, filePath, commitHash, oldCode, newCode, errorMessage, stackTrace } = req.body;
  const types = ["code_changed", "commit_added", "error_logged", "note_added"];
  if (!types.includes(eventType) || typeof title !== "string" || !title.trim()) throw new AppError("A valid event type and title are required", 400);
  const event = await addTimelineEvent({
    bug: req.bug, userId: req.user._id, eventType, title: title.trim(), description,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    filePath, commitHash, oldCode, newCode, errorMessage, stackTrace,
  });
  await event.populate("userId", "name avatar");
  res.status(201).json(event);
}

export async function addComment(req, res) {
  if (typeof req.body.message !== "string" || !req.body.message.trim()) throw new AppError("Comment cannot be empty", 400);
  const comment = await Comment.create({ bugId: req.bug._id, userId: req.user._id, message: req.body.message.trim() });
  await comment.populate("userId", "name avatar");
  await addTimelineEvent({ bug: req.bug, userId: req.user._id, eventType: "note_added", title: "Comment added", description: comment.message.slice(0, 250) });
  res.status(201).json(comment);
}

export async function uploadAttachment(req, res) {
  if (!req.file) throw new AppError("Choose a file to upload", 400);
  const attachmentId = new mongoose.Types.ObjectId();
  const attachment = await Attachment.create({
    _id: attachmentId,
    bugId: req.bug._id,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileUrl: `/api/bugs/${req.bug._id}/attachments/${attachmentId}`,
    storageName: req.file.filename,
    fileSize: req.file.size,
  });
  await addTimelineEvent({ bug: req.bug, userId: req.user._id, eventType: "note_added", title: "Evidence attached", description: req.file.originalname });
  res.status(201).json(attachment);
}

export async function downloadAttachment(req, res, next) {
  const attachment = await Attachment.findOne({ _id: req.params.attachmentId, bugId: req.bug._id });
  if (!attachment) throw new AppError("Evidence file not found", 404);
  const fileName = path.basename(attachment.storageName);
  const filePath = path.join(uploadsDirectory, fileName);
  if (!filePath.startsWith(`${uploadsDirectory}${path.sep}`)) throw new AppError("Invalid evidence file path", 400);
  return res.download(filePath, attachment.fileName, (error) => {
    if (error && !res.headersSent) next(error);
  });
}

export async function analyzeBug(req, res) {
  const result = await analyzeRootCause(req.bug, req.user._id);
  res.json(result);
}

export async function decideRootCause(req, res) {
  const { eventId, decision, explanation = "" } = req.body;
  if (!["confirmed", "rejected"].includes(decision) || !mongoose.isValidObjectId(eventId) || typeof explanation !== "string") {
    throw new AppError("A valid event and decision are required", 400);
  }
  const event = await BugEvent.findOne({ _id: eventId, bugId: req.bug._id, eventType: { $in: ["code_changed", "commit_added"] } });
  if (!event) throw new AppError("Candidate change not found", 404);
  req.bug.rootCauseEvent = event._id;
  req.bug.rootCauseDecision = decision;
  req.bug.rootCause = explanation.trim() || event.title;
  await req.bug.save();
  await addTimelineEvent({
    bug: req.bug, userId: req.user._id,
    eventType: decision === "confirmed" ? "cause_confirmed" : "cause_rejected",
    title: `Suspected cause ${decision}`,
    description: req.bug.rootCause,
    metadata: { candidateEventId: event._id },
  });
  res.json({ bug: req.bug });
}

export async function loadBug(req, _res, next) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) throw new AppError("Bug not found", 404);
  const hasAccess = await Project.exists({ _id: bug.projectId, $or: [{ owner: req.user._id }, { members: req.user._id }] });
  if (!hasAccess) throw new AppError("Bug not found", 404);
  req.bug = bug;
  next();
}
