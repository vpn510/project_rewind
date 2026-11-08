import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Bug from "../models/Bug.js";
import BugEvent from "../models/BugEvent.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const readSeed = async (name) => JSON.parse(await fs.readFile(path.join(directory, `${name}.json`), "utf8"));
const demoPassword = process.env.SEED_PASSWORD || "RewindDemo2026!";

async function seed() {
  await connectDB();
  const hasData = await User.exists({});
  if (hasData && !process.argv.includes("--reset")) {
    throw new Error("Database already contains users. Use `npm run seed -w server -- --reset` to replace the demo dataset.");
  }
  if (hasData) {
    await Promise.all([Attachment.deleteMany({}), Comment.deleteMany({}), BugEvent.deleteMany({}), Bug.deleteMany({}), Project.deleteMany({}), User.deleteMany({})]);
  }

  const userData = await readSeed("users");
  const users = await User.create(userData.map((user) => ({ ...user, password: demoPassword })));
  const projectData = await readSeed("projects");
  const projects = await Project.create(projectData.map((project, index) => ({
    ...project,
    owner: users[index % users.length]._id,
    members: [users[index % users.length]._id, users[(index + 1) % users.length]._id, users[(index + 2) % users.length]._id],
  })));
  const templates = await readSeed("bugs");
  const now = Date.now();
  const bugRecords = Array.from({ length: 50 }, (_, index) => {
    const template = templates[index % templates.length];
    const project = projects[index % projects.length];
    const reporter = users[index % users.length];
    const ageDays = 1 + ((index * 7) % 70);
    return {
      ...template,
      title: index < templates.length ? template.title : `${template.title} (${String(index + 1).padStart(2, "0")})`,
      projectId: project._id,
      reportedBy: reporter._id,
      assignedTo: index % 4 === 0 ? null : users[(index + 1) % users.length]._id,
      createdAt: new Date(now - ageDays * 86400000),
      updatedAt: new Date(now - Math.max(0, ageDays - 1) * 86400000),
    };
  });
  const bugs = await Bug.create(bugRecords);
  const eventTemplates = await readSeed("events");
  const eventRecords = [];
  for (const [index, bug] of bugs.entries()) {
    const baseTime = new Date(bug.createdAt);
    const template = templates[index % templates.length];
    const actor = users[(index + 2) % users.length];
    const changeAt = new Date(baseTime.getTime() + 60 * 60 * 1000);
    const errorAt = new Date(baseTime.getTime() + 3 * 60 * 60 * 1000);
    eventRecords.push(
      { bugId: bug._id, projectId: bug.projectId, userId: bug.reportedBy, eventType: "bug_reported", title: "Bug reported", description: bug.title, occurredAt: baseTime },
      { bugId: bug._id, projectId: bug.projectId, userId: actor._id, eventType: eventTemplates[0].eventType, title: template.title.includes("Login") ? "Adjusted token validation middleware" : eventTemplates[0].title, description: "A change was deployed shortly before the first reported error.", filePath: bug.affectedFile, oldCode: "// previous behavior", newCode: "// updated behavior", occurredAt: changeAt },
      { bugId: bug._id, projectId: bug.projectId, userId: bug.reportedBy, eventType: eventTemplates[1].eventType, title: template.title.includes("Login") ? "401 Unauthorized on login" : `${eventTemplates[1].title}: ${bug.title}`, description: template.errorMessage, errorMessage: template.errorMessage, stackTrace: `Error: ${template.errorMessage}\n    at investigate (${bug.affectedFile}:42:11)`, filePath: bug.affectedFile, occurredAt: errorAt },
      { bugId: bug._id, projectId: bug.projectId, userId: users[(index + 3) % users.length]._id, eventType: eventTemplates[2].eventType, title: eventTemplates[2].title, description: "Correlating the error with recent changes for review.", occurredAt: new Date(errorAt.getTime() + 45 * 60 * 1000) },
    );
  }
  await BugEvent.create(eventRecords);

  const comments = bugs.flatMap((bug, index) => [0, 1].map((turn) => ({
    bugId: bug._id,
    userId: users[(index + turn + 1) % users.length]._id,
    message: turn === 0 ? "I can reproduce this locally. Checking the latest change now." : "Added the relevant stack trace to the timeline; next step is to verify the file history.",
    createdAt: new Date(bug.createdAt.getTime() + (turn + 1) * 2 * 60 * 60 * 1000),
  })));
  await Comment.create(comments);

  const uploadsDirectory = path.resolve(directory, "../uploads");
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const attachments = [];
  for (let index = 0; index < 30; index += 1) {
    const bug = bugs[index % bugs.length];
    const fileName = `synthetic-investigation-${String(index + 1).padStart(2, "0")}.log`;
    const fileUrlName = `demo-${String(index + 1).padStart(2, "0")}.log`;
    const fileContent = `Synthetic Project Rewind demo evidence\nBug: ${bug.title}\nNo production data is included.\n`;
    await fs.writeFile(path.join(uploadsDirectory, fileUrlName), fileContent);
    const attachment = new Attachment({
      _id: new mongoose.Types.ObjectId(),
      bugId: bug._id,
      uploadedBy: users[index % users.length]._id,
      fileName,
      fileType: "text/plain",
      fileUrl: "",
      storageName: fileUrlName,
      fileSize: Buffer.byteLength(fileContent),
    });
    attachments.push(attachment);
  }
  for (const attachment of attachments) attachment.fileUrl = `/api/bugs/${attachment.bugId}/attachments/${attachment._id}`;
  await Attachment.create(attachments);
  console.log(`Seeded ${users.length} users, ${projects.length} projects, ${bugs.length} bugs, ${eventRecords.length} events, ${comments.length} comments, and ${attachments.length} attachments.`);
  console.log(`Demo login: ${userData[0].email} / ${demoPassword}`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
