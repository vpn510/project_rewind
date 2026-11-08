import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-to-sign";
const { default: app } = await import("../server.js");

test("health endpoint reports API readiness without a database connection", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("private project endpoints require authentication", async () => {
  const response = await request(app).get("/api/projects");
  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Authentication required");
});

test("unknown API routes return a clear not-found response", async () => {
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.match(response.body.message, /Route not found/);
});

test("empty authentication requests receive validation errors", async () => {
  const response = await request(app).post("/api/auth/login").send({});
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Email and password are required");
});

test("malformed JSON receives a client error instead of an internal error", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send('{"email":');
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Malformed JSON request");
});
