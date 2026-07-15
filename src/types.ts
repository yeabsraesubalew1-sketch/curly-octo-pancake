/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Department {
  id: string; // e.g. "SE", "CS"
  name: string; // e.g. "Software Engineering"
  durationYears: number; // e.g. 4 or 5
  maxSectionsPerYear: number;
}

export interface Instructor {
  id: string; // e.g. "inst_abebe"
  name: string; // e.g. "Dr. Abebe Kebede"
  username: string;
  password?: string; // Optional but persistent for login
  maxHoursPerWeek: number; // Maximum slots/hours they can teach in a week
}

export interface Course {
  code: string; // e.g. "CoSc-2011"
  title: string; // e.g. "Data Structures and Algorithms"
  hasLab: boolean; // default false
  labHours: number; // if hasLab is true, usually 3. Otherwise 0.
  lectureHours: number; // standard sessions, e.g., 2 or 3. Total hours = lectureHours + labHours.
}

// Represents association: course is offered to a specific department, year, section with an assigned instructor
export interface CourseAssignment {
  id: string; // uuid/hash
  departmentId: string;
  year: number; // e.g., 2, 3, 4, 5
  section: string; // e.g., "Sec 1", "Sec 2"
  courseCode: string;
  instructorId: string; // Can be "" (unassigned)
}

// Slots represent 50-minute periods
export interface TimeSlot {
  period: number; // 1 to 8
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "09:20"
}

// Const schedule slot
export const PERIODS: TimeSlot[] = [
  { period: 1, startTime: "08:30", endTime: "09:20" },
  { period: 2, startTime: "09:25", endTime: "10:15" },
  { period: 3, startTime: "10:20", endTime: "11:10" },
  { period: 4, startTime: "11:15", endTime: "12:05" },
  // Lunch Break is 12:05 - 13:30 (1:30 PM)
  { period: 5, startTime: "13:30", endTime: "14:20" },
  { period: 6, startTime: "14:25", endTime: "15:15" },
  { period: 7, startTime: "15:20", endTime: "16:10" },
  { period: 8, startTime: "16:15", endTime: "17:05" }
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export interface ScheduleItem {
  id: string;
  departmentId: string;
  year: number;
  section: string;
  day: number; // 0 (Monday) to 4 (Friday)
  period: number; // 1 to 8
  courseCode: string;
  isLab: boolean;
  instructorId: string;
}

export interface ConstraintError {
  type: "unassigned_instructor" | "instructor_limit_exceeded" | "instructor_overlap" | "no_courses" | "insufficient_slots" | "general_conflict";
  message: string;
  offendingEntity?: string; // name of course, instructor, or department
}
