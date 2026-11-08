import Bug from "../models/Bug.js";
import Project from "../models/Project.js";
import BugEvent from "../models/BugEvent.js";

export async function getDashboardAnalytics(userId) {
  const projects = await Project.find({ $or: [{ owner: userId }, { members: userId }] }).select("_id");
  const projectIds = projects.map((project) => project._id);
  const [bugs, recentEvents, monthly] = await Promise.all([
    Bug.find({ projectId: { $in: projectIds } }).select("status severity createdAt updatedAt"),
    BugEvent.find({ projectId: { $in: projectIds } })
      .sort({ occurredAt: -1 })
      .limit(8)
      .populate("userId", "name")
      .populate("bugId", "title severity status"),
    Bug.aggregate([
      { $match: { projectId: { $in: projectIds }, createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  return {
    totals: {
      projects: projectIds.length,
      bugs: bugs.length,
      open: bugs.filter((bug) => !["resolved", "closed"].includes(bug.status)).length,
      critical: bugs.filter((bug) => bug.severity === "critical" && !["resolved", "closed"].includes(bug.status)).length,
    },
    byStatus: ["open", "investigating", "in-progress", "resolved", "closed"].map((status) => ({
      name: status.replace("-", " "),
      value: bugs.filter((bug) => bug.status === status).length,
    })),
    bySeverity: ["critical", "high", "medium", "low"].map((severity) => ({
      name: severity,
      value: bugs.filter((bug) => bug.severity === severity).length,
    })),
    monthly,
    recentEvents,
  };
}
