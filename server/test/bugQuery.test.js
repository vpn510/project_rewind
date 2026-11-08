import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createProjectScope } from "../services/bugQueryService.js";

test("requested project filters stay constrained to the user's memberships", () => {
  const memberProject = new mongoose.Types.ObjectId();
  const otherProject = new mongoose.Types.ObjectId();
  const scope = createProjectScope([memberProject], otherProject.toString());
  assert.deepEqual(scope.projectId.$in, [memberProject]);
  assert.equal(scope.projectId.$eq, otherProject.toString());
});

test("invalid project filters are rejected", () => {
  assert.throws(() => createProjectScope([], "not-an-object-id"), /Invalid project identifier/);
});
