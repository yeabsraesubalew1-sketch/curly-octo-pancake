/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import Instructor from "../models/Instructor.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Any authenticated role can view the instructor roster (needed so
// students/instructors can see instructor names against the timetable),
// but only the admin gets to see the plaintext password column.
router.get("/", requireAuth, async (req, res) => {
  const instructors = await Instructor.find().sort({ id: 1 });
  const isAdmin = req.user.role === "admin";

  const payload = instructors.map((i) => {
    const obj = i.toJSON();
    if (!isAdmin) delete obj.password;
    return obj;
  });

  res.json(payload);
});

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const instructors = Array.isArray(req.body) ? req.body : [];

  for (const i of instructors) {
    if (!i.id || !i.name || !i.username) {
      return res.status(400).json({ error: "Each instructor needs an id, name, and username." });
    }
  }

  const usernames = instructors.map((i) => i.username.toLowerCase());
  if (new Set(usernames).size !== usernames.length) {
    return res.status(400).json({ error: "Instructor usernames must be unique." });
  }

  // Preserve existing passwords for instructors whose payload omits one
  // (e.g. the admin-viewed list has password redacted for a non-admin,
  // but admin always receives it -- this guards edits made without the field).
  const existing = await Instructor.find();
  const existingById = new Map(existing.map((e) => [e.id, e]));

  await Instructor.deleteMany({});
  if (instructors.length > 0) {
    await Instructor.insertMany(
      instructors.map((i) => ({
        id: i.id,
        name: i.name,
        username: i.username.toLowerCase(),
        password: i.password || existingById.get(i.id)?.password || "changeme",
        maxHoursPerWeek: i.maxHoursPerWeek || 16
      }))
    );
  }

  const saved = await Instructor.find().sort({ id: 1 });
  res.json(saved.map((s) => s.toJSON()));
});

export default router;
