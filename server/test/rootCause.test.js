import test from "node:test";
import assert from "node:assert/strict";
import { rankCandidates } from "../services/rootCauseService.js";

const firstError = {
  title: "Unauthorized login",
  errorMessage: "invalid token signature",
  stackTrace: "at verify (src/middleware/auth.js:42)",
  occurredAt: new Date("2026-11-08T12:00:00Z"),
};

test("ranks matching affected-file changes and explains the evidence", () => {
  const matching = {
    eventType: "code_changed",
    title: "Changed JWT validation",
    filePath: "src/middleware/auth.js",
    occurredAt: new Date("2026-11-08T11:30:00Z"),
  };
  const unrelated = {
    eventType: "commit_added",
    title: "Updated dashboard colors",
    filePath: "src/styles/dashboard.css",
    occurredAt: new Date("2026-11-08T11:00:00Z"),
  };
  const ranked = rankCandidates([unrelated, matching], { affectedFile: "src/middleware/auth.js" }, firstError);
  assert.equal(ranked[0].event, matching);
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].evidence.includes("Changed the reported affected file"));
});

test("never considers changes that happened after the first known error", () => {
  const afterError = {
    eventType: "code_changed",
    title: "Fix token signature",
    filePath: "src/middleware/auth.js",
    occurredAt: new Date("2026-11-08T12:01:00Z"),
  };
  assert.deepEqual(rankCandidates([afterError], { affectedFile: "src/middleware/auth.js" }, firstError), []);
});

test("does not claim a statistically validated probability", () => {
  const candidate = {
    eventType: "commit_added",
    title: "Token signature update",
    filePath: "src/middleware/auth.js",
    occurredAt: new Date("2026-11-08T11:59:00Z"),
  };
  const [ranked] = rankCandidates([candidate], { affectedFile: "src/middleware/auth.js" }, firstError);
  assert.ok(ranked.score <= 95);
  assert.ok(ranked.score >= 45);
});
