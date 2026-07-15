/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Run with: npm run seed
 * Populates MongoDB with the demo dataset. Safe to re-run -- it clears
 * the academic collections first. Does not touch the Admin account.
 */

import "dotenv/config";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Department from "./models/Department.js";
import Instructor from "./models/Instructor.js";
import Course from "./models/Course.js";
import Assignment from "./models/Assignment.js";
import ScheduleItem from "./models/ScheduleItem.js";
import {
  SEED_DEPARTMENTS,
  SEED_INSTRUCTORS,
  SEED_COURSES,
  SEED_ASSIGNMENTS,
} from "./seedData.js";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function run() {
  await connectDB();

  console.log("[seed] Clearing existing academic data...");
  await Promise.all([
    Department.deleteMany({}),
    Instructor.deleteMany({}),
    Course.deleteMany({}),
    Assignment.deleteMany({}),
    ScheduleItem.deleteMany({}),
  ]);

  console.log("[seed] Inserting seed dataset...");
  await Promise.all([
    Department.insertMany(SEED_DEPARTMENTS),
    Instructor.insertMany(SEED_INSTRUCTORS),
    Course.insertMany(SEED_COURSES),
    Assignment.insertMany(SEED_ASSIGNMENTS),
  ]);

  console.log(
    `[seed] Done: ${SEED_DEPARTMENTS.length} departments, ${SEED_INSTRUCTORS.length} instructors, ` +
      `${SEED_COURSES.length} courses, ${SEED_ASSIGNMENTS.length} assignments.`,
  );
  console.log(
    "[seed] No Admin account was created. Visit the app and use the Registrar tab to initialize one.",
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
