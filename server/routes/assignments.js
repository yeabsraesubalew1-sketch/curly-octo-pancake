/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import Assignment from "../models/Assignment.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public: the login page reads assignments to figure out which
// sections are actually active for a given department/year.
router.get("/", async (_req, res) => {
  const assignments = await Assignment.find().sort({ departmentId: 1, year: 1, section: 1 });
  res.json(assignments);
});

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const assignments = Array.isArray(req.body) ? req.body : [];

  for (const a of assignments) {
    if (!a.id || !a.departmentId || !a.year || !a.section || !a.courseCode) {
      return res.status(400).json({ error: "Each assignment needs id, departmentId, year, section, courseCode." });
    }
  }

  await Assignment.deleteMany({});
  if (assignments.length > 0) {
    await Assignment.insertMany(
      assignments.map((a) => ({
        id: a.id,
        departmentId: a.departmentId,
        year: a.year,
        section: a.section,
        courseCode: a.courseCode,
        instructorId: a.instructorId || ""
      }))
    );
  }

  const saved = await Assignment.find().sort({ departmentId: 1, year: 1, section: 1 });
  res.json(saved);
});

export default router;
