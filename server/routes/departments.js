/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import Department from "../models/Department.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public: the login page needs the department list (and durations) before
// anyone has authenticated, to populate the student login dropdowns.
router.get("/", async (_req, res) => {
  const departments = await Department.find().sort({ id: 1 });
  res.json(departments);
});

// Admin only: replace the whole department collection (mirrors the
// original app's "save the whole array back to storage" pattern).
router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const departments = Array.isArray(req.body) ? req.body : [];

  for (const d of departments) {
    if (!d.id || !d.name || !d.durationYears) {
      return res.status(400).json({ error: "Each department needs id, name, and durationYears." });
    }
  }

  await Department.deleteMany({});
  if (departments.length > 0) {
    await Department.insertMany(
      departments.map((d) => ({
        id: d.id,
        name: d.name,
        durationYears: d.durationYears,
        maxSectionsPerYear: d.maxSectionsPerYear || 3
      }))
    );
  }

  const saved = await Department.find().sort({ id: 1 });
  res.json(saved);
});

export default router;
