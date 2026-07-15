/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import ScheduleItem from "../models/ScheduleItem.js";
import Department from "../models/Department.js";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateFullSchedule } from "../scheduler.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const schedule = await ScheduleItem.find().sort({ day: 1, period: 1 });
  res.json(schedule);
});

// Runs the backtracking constraint solver against everything currently
// in MongoDB, and -- if a valid timetable is found -- persists it.
router.post("/generate", requireAuth, requireRole("admin"), async (_req, res) => {
  const [departments, instructors, courses, assignments] = await Promise.all([
    Department.find(),
    Instructor.find(),
    Course.find(),
    Assignment.find()
  ]);

  const result = generateFullSchedule(
    departments.map((d) => d.toJSON()),
    instructors.map((i) => i.toJSON()),
    courses.map((c) => c.toJSON()),
    assignments.map((a) => a.toJSON())
  );

  if (result.success) {
    await ScheduleItem.deleteMany({});
    await ScheduleItem.insertMany(result.schedule);
    return res.json({ success: true, msg: "Timetable generated successfully!", errors: [], schedule: result.schedule });
  }

  await ScheduleItem.deleteMany({});
  return res.json({
    success: false,
    msg: "Algorithm failed to resolve a combination matching all parameters.",
    errors: result.errors,
    schedule: []
  });
});

router.delete("/", requireAuth, requireRole("admin"), async (_req, res) => {
  await ScheduleItem.deleteMany({});
  res.json({ success: true });
});

export default router;
