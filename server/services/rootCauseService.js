import BugEvent from "../models/BugEvent.js";
import AppError from "../utils/AppError.js";

const pathMatches = (a, b) => {
  const normalize = (value) => value.toLowerCase().replaceAll("\\", "/").replace(/^\.?\//, "");
  const left = normalize(a);
  const right = normalize(b);
  return Boolean(left && right && (left === right || left.endsWith(`/${right}`) || right.endsWith(`/${left}`)));
};

export function rankCandidates(events, bug, firstError) {
  const errorPaths = `${bug.affectedFile} ${firstError.stackTrace}`.toLowerCase();
  const errorTerms = `${firstError.errorMessage} ${firstError.title}`.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  return events
    .filter((event) => ["code_changed", "commit_added"].includes(event.eventType) && event.occurredAt <= firstError.occurredAt)
    .map((event) => {
      const evidence = [];
      let score = 0;
      if (bug.affectedFile && pathMatches(event.filePath, bug.affectedFile)) {
        score += 45;
        evidence.push("Changed the reported affected file");
      } else if (event.filePath && errorPaths.includes(event.filePath.toLowerCase())) {
        score += 30;
        evidence.push("File path appears in the error stack");
      }
      const haystack = `${event.title} ${event.description} ${event.filePath} ${event.oldCode} ${event.newCode}`.toLowerCase();
      const matched = [...new Set(errorTerms.filter((term) => haystack.includes(term)))].slice(0, 4);
      if (matched.length) {
        score += Math.min(25, matched.length * 8);
        evidence.push(`Shares error terms: ${matched.join(", ")}`);
      }
      const hours = Math.max(0, (firstError.occurredAt - event.occurredAt) / 3600000);
      const recency = Math.max(0, 25 * (1 - hours / (24 * 14)));
      if (recency) {
        score += recency;
        evidence.push(hours < 1 ? "Occurred within an hour before the first error" : "Occurred shortly before the first error");
      }
      return { event, score: Math.min(95, Math.round(score)), evidence };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.event.occurredAt - a.event.occurredAt)
    .slice(0, 5);
}

export async function analyzeRootCause(bug, userId) {
  const events = await BugEvent.find({
    bugId: bug._id,
    eventType: { $in: ["error_logged", "code_changed", "commit_added"] },
  })
    .sort({ occurredAt: 1 })
    .populate("userId", "name");
  const firstError = events.find((event) => event.eventType === "error_logged");
  if (!firstError) throw new AppError("Add an error log to the timeline before running analysis", 422);

  const candidates = rankCandidates(events, bug, firstError);

  await BugEvent.create({
    bugId: bug._id,
    projectId: bug.projectId,
    userId,
    eventType: "note_added",
    title: "Root-cause correlation analysis run",
    description: `${candidates.length} candidate change${candidates.length === 1 ? "" : "s"} ranked against the earliest recorded error. Scores are investigative correlations, not probabilities of causation.`,
    occurredAt: new Date(),
  });

  return {
    firstError: { id: firstError._id, title: firstError.title, occurredAt: firstError.occurredAt, errorMessage: firstError.errorMessage },
    candidates: candidates.map(({ event, score, evidence }) => ({
      eventId: event._id,
      title: event.title,
      eventType: event.eventType,
      filePath: event.filePath,
      commitHash: event.commitHash,
      occurredAt: event.occurredAt,
      author: event.userId?.name || "Unknown",
      score,
      evidence,
    })),
    disclaimer: "Correlation ranking only. A change occurring before an error does not prove it caused the bug.",
  };
}
