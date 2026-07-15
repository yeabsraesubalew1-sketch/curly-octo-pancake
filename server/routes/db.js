/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import Department from "../models/Department.js";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import ScheduleItem from "../models/ScheduleItem.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { SEED_DEPARTMENTS, SEED_INSTRUCTORS, SEED_COURSES, SEED_ASSIGNMENTS } from "../seedData.js";

const router = Router();

// POST /api/db/reset - wipes academic data and restores the seed dataset.
// Does NOT touch the Admin account -- resetting the demo data shouldn't
// lock the currently signed-in Registrar out of their own session.
router.post("/reset", requireAuth, requireRole("admin"), async (_req, res) => {
  await Promise.all([
    Department.deleteMany({}),
    Instructor.deleteMany({}),
    Course.deleteMany({}),
    Assignment.deleteMany({}),
    ScheduleItem.deleteMany({})
  ]);

  await Promise.all([
    Department.insertMany(SEED_DEPARTMENTS),
    Instructor.insertMany(SEED_INSTRUCTORS),
    Course.insertMany(SEED_COURSES),
    Assignment.insertMany(SEED_ASSIGNMENTS)
  ]);

  res.json({ success: true });
});

export default router;
