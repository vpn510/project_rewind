import mongoose from "mongoose";
import Project from "../models/Project.js";
import Bug from "../models/Bug.js";
import User from "../models/User.js";
import BugEvent from "../models/BugEvent.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import AppError from "../utils/AppError.js";
import { getDashboardAnalytics } from "../services/analyticsService.js";

export async function listProjects(req, res) {
  const projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] })
    .sort({ updatedAt: -1 })
    .populate("owner", "name email")
    .populate("members", "name email");
  const counts = await Bug.aggregate([
    { $match: { projectId: { $in: projects.map((project) => project._id) } } },
    { $group: { _id: "$projectId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));
  res.json(projects.map((project) => ({ ...project.toObject(), bugCount: countMap.get(project._id.toString()) || 0 })));
}

export async function createProject(req, res) {
  const { name, description = "", technologies = [], repositoryUrl = "" } = req.body;
  if (typeof name !== "string" || !name.trim()) throw new AppError("Project name is required", 400);
  if (!Array.isArray(technologies) && typeof technologies !== "string") throw new AppError("Technologies must be a list or comma-separated text", 400);
  const project = await Project.create({
    name: name.trim(),
    description,
    technologies: Array.isArray(technologies) ? technologies : technologies.split(",").map((item) => item.trim()).filter(Boolean),
    repositoryUrl,
    owner: req.user._id,
    members: [req.user._id],
  });
  await project.populate("owner", "name email");
  res.status(201).json(project);
}

export async function getProject(req, res) {
  const project = await req.project.populate("owner members", "name email avatar");
  res.json(project);
}

export async function updateProject(req, res) {
  if (!req.project.owner.equals(req.user._id)) throw new AppError("Only the project owner can edit this project", 403);
  const allowed = ["name", "description", "technologies", "repositoryUrl", "members"];
  for (const key of allowed) if (req.body[key] !== undefined) req.project[key] = req.body[key];
  if (typeof req.project.name !== "string" || !req.project.name.trim()) throw new AppError("Project name is required", 400);
  if (req.body.members) {
    const ids = [...new Set([req.user._id.toString(), ...req.body.members])];
    if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new AppError("Invalid member identifier", 400);
    if (await User.countDocuments({ _id: { $in: ids } }) !== ids.length) throw new AppError("One or more project members do not exist", 400);
    req.project.members = ids;
  }
  await req.project.save();
  await req.project.populate("owner members", "name email avatar");
  res.json(req.project);
}

export async function deleteProject(req, res) {
  if (!req.project.owner.equals(req.user._id)) throw new AppError("Only the project owner can delete this project", 403);
  const bugs = await Bug.find({ projectId: req.project._id }).select("_id");
  const ids = bugs.map((bug) => bug._id);
  await Promise.all([
    Bug.deleteMany({ projectId: req.project._id }),
    BugEvent.deleteMany({ projectId: req.project._id }),
    Comment.deleteMany({ bugId: { $in: ids } }),
    Attachment.deleteMany({ bugId: { $in: ids } }),
    req.project.deleteOne(),
  ]);
  res.status(204).end();
}

export async function projectAnalytics(req, res) {
  const result = await getDashboardAnalytics(req.user._id);
  const [bugs, events, monthly] = await Promise.all([
    Bug.find({ projectId: req.project._id }).select("status severity createdAt updatedAt"),
    BugEvent.find({ projectId: req.project._id }).sort({ occurredAt: -1 }).limit(8).populate("userId", "name").populate("bugId", "title severity status"),
    Bug.aggregate([
      { $match: { projectId: req.project._id, createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  result.totals = {
    projects: 1,
    bugs: bugs.length,
    open: bugs.filter((bug) => !["resolved", "closed"].includes(bug.status)).length,
    critical: bugs.filter((bug) => bug.severity === "critical" && !["resolved", "closed"].includes(bug.status)).length,
  };
  result.byStatus = ["open", "investigating", "in-progress", "resolved", "closed"].map((status) => ({ name: status.replace("-", " "), value: bugs.filter((bug) => bug.status === status).length }));
  result.bySeverity = ["critical", "high", "medium", "low"].map((severity) => ({ name: severity, value: bugs.filter((bug) => bug.severity === severity).length }));
  result.recentEvents = events;
  result.monthly = monthly;
  res.json(result);
}
