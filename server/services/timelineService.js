import BugEvent from "../models/BugEvent.js";

export async function addTimelineEvent({ bug, userId, eventType, title, description = "", ...fields }) {
  return BugEvent.create({
    bugId: bug._id,
    projectId: bug.projectId,
    userId,
    eventType,
    title,
    description,
    ...fields,
  });
}

export async function getTimeline(bugId, options = {}) {
  const requestedPage = Math.max(1, Number.parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(options.limit, 10) || 100));
  const total = await BugEvent.countDocuments({ bugId });
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, pages);
  const items = await BugEvent.find({ bugId })
    .sort({ occurredAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("userId", "name avatar");
  return { items: items.reverse(), page, limit, total, pages, hasOlder: page < pages };
}
