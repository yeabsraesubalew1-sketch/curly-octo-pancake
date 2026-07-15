/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import Course from "../models/Course.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Any authenticated role (admin, instructor, student) can view courses.
router.get("/", requireAuth, async (_req, res) => {
  const courses = await Course.find().sort({ code: 1 });
  res.json(courses);
});

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const courses = Array.isArray(req.body) ? req.body : [];

  for (const c of courses) {
    if (!c.code || !c.title) {
      return res.status(400).json({ error: "Each course needs a code and a title." });
    }
  }

  await Course.deleteMany({});
  if (courses.length > 0) {
    await Course.insertMany(
      courses.map((c) => ({
        code: c.code,
        title: c.title,
        hasLab: !!c.hasLab,
        labHours: c.labHours || 0,
        lectureHours: c.lectureHours || 0
      }))
    );
  }

  const saved = await Course.find().sort({ code: 1 });
  res.json(saved);
});

export default router;
