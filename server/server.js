import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((value) => value.trim());
const isDevelopment = process.env.NODE_ENV !== "production";

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isDevelopment) return false;
  try {
    const { protocol, hostname } = new URL(origin);
    return (protocol === "http:" || protocol === "https:") && (hostname === "localhost" || hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: (origin, callback) => callback(null, isOriginAllowed(origin)), credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "project-rewind-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error("JWT_SECRET must be set to at least 32 characters");
  process.exitCode = 1;
} else if (process.env.NODE_ENV !== "test") {
  connectDB()
    .then(() => app.listen(port, () => console.log(`Project Rewind API listening on http://localhost:${port}`)))
    .catch((error) => {
      console.error("Unable to start the API:", error.message);
      process.exitCode = 1;
    });
}

export default app;
