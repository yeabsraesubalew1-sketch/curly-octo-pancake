/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, getDbRuntimeStatus } from "./config/db.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

import authRoutes from "./routes/auth.js";
import departmentRoutes from "./routes/departments.js";
import courseRoutes from "./routes/courses.js";
import instructorRoutes from "./routes/instructors.js";
import assignmentRoutes from "./routes/assignments.js";
import scheduleRoutes from "./routes/schedule.js";
import dbRoutes from "./routes/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const shouldRetry = req.query.retry === "1";

  if (shouldRetry) {
    await connectDB({ forceReconnect: true });
  }

  const db = getDbRuntimeStatus();
  const status = db.state === "operational" ? "operational" : db.state;

  res.json({
    status,
    db,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/db", dbRoutes);

// In production, serve the built frontend from /dist and let React Router
// handle client-side routes (page reload on /admin, /student, etc.).
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] EduSched API listening on http://localhost:${PORT}`);
  });
}

start();
