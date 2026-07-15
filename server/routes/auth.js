/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Instructor from "../models/Instructor.js";
import Department from "../models/Department.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/auth/status - public, tells the login page whether the
// Registrar (admin) account has been initialized yet.
router.get("/status", async (_req, res) => {
  const count = await Admin.countDocuments();
  res.json({ adminInitialized: count > 0 });
});

// POST /api/auth/admin/setup - one-time admin account creation
router.post("/admin/setup", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password || String(password).length < 4) {
    return res.status(400).json({ error: "Username and a password (min 4 chars) are required." });
  }

  const existing = await Admin.countDocuments();
  if (existing > 0) {
    return res.status(409).json({ error: "An Administrator account already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ username: username.toLowerCase().trim(), passwordHash });

  const token = signToken({ role: "admin", username: admin.username });
  res.status(201).json({ token, user: { role: "admin", username: admin.username } });
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  if (!admin) {
    return res.status(401).json({ error: "Invalid Administrator credentials." });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid Administrator credentials." });
  }

  const token = signToken({ role: "admin", username: admin.username });
  res.json({ token, user: { role: "admin", username: admin.username } });
});

// PUT /api/auth/admin/password - change the admin password (self only)
router.put("/admin/password", requireAuth, requireRole("admin"), async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ error: "New password must be at least 4 characters." });
  }

  const admin = await Admin.findOne({ username: req.user.username });
  if (!admin) return res.status(404).json({ error: "Administrator account not found." });

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();
  res.json({ success: true });
});

// DELETE /api/auth/admin - deletes the Registrar account (self only)
router.delete("/admin", requireAuth, requireRole("admin"), async (req, res) => {
  await Admin.deleteOne({ username: req.user.username });
  res.json({ success: true });
});

// POST /api/auth/instructor/login
router.post("/instructor/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const inst = await Instructor.findOne({ username: String(username).toLowerCase().trim() });
  if (!inst || inst.password !== password) {
    return res.status(401).json({ error: "Invalid Instructor username or password." });
  }

  const token = signToken({ role: "instructor", id: inst.id, username: inst.username });
  const safe = inst.toJSON();
  delete safe.password;
  res.json({ token, user: safe });
});

// PUT /api/auth/instructor/:id/password - admin can reset any instructor's
// password, or an instructor can change their own.
router.put("/instructor/:id/password", requireAuth, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 1) {
    return res.status(400).json({ error: "A new password is required." });
  }

  const isSelf = req.user.role === "instructor" && req.user.id === req.params.id;
  const isAdmin = req.user.role === "admin";
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "You do not have permission to change this password." });
  }

  const inst = await Instructor.findOne({ id: req.params.id });
  if (!inst) return res.status(404).json({ error: "Instructor not found." });

  inst.password = newPassword;
  await inst.save();

  const safe = inst.toJSON();
  delete safe.password;
  res.json({ success: true, instructor: safe });
});

// POST /api/auth/student/login - students don't hold credentials; they pick
// their Department / Year / Section context, which is validated and then
// embedded as claims in a short-lived JWT so that even "credential-less"
// access to the timetable API is still authenticated.
router.post("/student/login", async (req, res) => {
  const { departmentId, year, section } = req.body || {};
  if (!departmentId || !year || !section) {
    return res.status(400).json({ error: "Department, year, and section are required." });
  }

  const dept = await Department.findOne({ id: departmentId });
  if (!dept) {
    return res.status(400).json({ error: "Unknown department selected." });
  }

  const studentData = { departmentId, year: Number(year), section };
  const token = signToken({ role: "student", ...studentData });
  res.json({ token, user: studentData });
});

export default router;
