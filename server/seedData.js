/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Expanded seed data. Compared to the original 5-department / 5-instructor
 * / 9-course dataset, this spreads 32 course assignments across 15
 * sections in 6 departments, shared instructors teaching across multiple
 * sections, and several instructors seeded right up against their
 * maxHoursPerWeek ceiling -- all so that generating a timetable actually
 * exercises the backtracking solver's lab-block placement, lunch-boundary
 * splitting, instructor-overlap avoidance, and hour-limit validation
 * instead of trivially succeeding on a handful of classes.
 */

export const SEED_DEPARTMENTS = [
  { id: "SE", name: "Software Engineering", durationYears: 5, maxSectionsPerYear: 3 },
  { id: "CS", name: "Computer Science", durationYears: 4, maxSectionsPerYear: 3 },
  { id: "DS", name: "Data Science", durationYears: 4, maxSectionsPerYear: 2 },
  { id: "IT", name: "Information Technology", durationYears: 4, maxSectionsPerYear: 2 },
  { id: "IS", name: "Information Systems", durationYears: 4, maxSectionsPerYear: 2 },
  { id: "CY", name: "Cyber Security", durationYears: 4, maxSectionsPerYear: 2 }
];

export const SEED_INSTRUCTORS = [
  { id: "inst_1", name: "Dr. Abebe Kebede", username: "abebe", password: "123", maxHoursPerWeek: 16 },
  { id: "inst_2", name: "Dr. Bethelhem Yohannes", username: "betty", password: "123", maxHoursPerWeek: 16 },
  { id: "inst_3", name: "Lecturer Dawit Tesfaye", username: "dawit", password: "123", maxHoursPerWeek: 14 },
  { id: "inst_4", name: "Prof. Elias Hailu", username: "elias", password: "123", maxHoursPerWeek: 18 },
  { id: "inst_5", name: "Lecturer Frehiwot Girma", username: "frehiwot", password: "123", maxHoursPerWeek: 12 },
  { id: "inst_6", name: "Dr. Genet Alemu", username: "genet", password: "123", maxHoursPerWeek: 16 },
  { id: "inst_7", name: "Lecturer Henok Mulugeta", username: "henok", password: "123", maxHoursPerWeek: 14 },
  { id: "inst_8", name: "Dr. Iman Ahmed", username: "iman", password: "123", maxHoursPerWeek: 16 },
  { id: "inst_9", name: "Lecturer Kalkidan Solomon", username: "kalkidan", password: "123", maxHoursPerWeek: 12 },
  { id: "inst_10", name: "Prof. Meron Tadesse", username: "meron", password: "123", maxHoursPerWeek: 18 }
];

export const SEED_COURSES = [
  { code: "SE-2112", title: "Object Oriented Programming", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "CoSc-2011", title: "Data Structures and Algorithms", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "CoSc-3012", title: "Database Systems", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "SeEng-3211", title: "Software Requirements Engineering", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "IS-3121", title: "Enterprise Architecture", hasLab: false, labHours: 0, lectureHours: 2 },
  { code: "IT-2201", title: "Computer Networks", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "DS-3101", title: "Applied Machine Learning", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "CoSc-4112", title: "Compiler Design", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "SeEng-4212", title: "Software Architecture", hasLab: false, labHours: 0, lectureHours: 2 },
  { code: "CY-2101", title: "Introduction to Cybersecurity", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "CY-3201", title: "Network Security", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "CoSc-2021", title: "Discrete Mathematics", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "SE-3113", title: "Human Computer Interaction", hasLab: false, labHours: 0, lectureHours: 2 },
  { code: "IT-3202", title: "Operating Systems", hasLab: true, labHours: 3, lectureHours: 2 },
  { code: "IS-2111", title: "Fundamentals of Information Systems", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "DS-2101", title: "Probability and Statistics", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "CoSc-3022", title: "Algorithm Analysis", hasLab: false, labHours: 0, lectureHours: 3 },
  { code: "SE-4211", title: "Software Testing and QA", hasLab: true, labHours: 3, lectureHours: 2 }
];

export const SEED_ASSIGNMENTS = [
  // --- Software Engineering ---
  { id: "assign-se-y2-a-1", departmentId: "SE", year: 2, section: "Sec A", courseCode: "SE-2112", instructorId: "inst_2" },
  { id: "assign-se-y2-a-2", departmentId: "SE", year: 2, section: "Sec A", courseCode: "CoSc-2011", instructorId: "inst_3" },
  { id: "assign-se-y2-a-3", departmentId: "SE", year: 2, section: "Sec A", courseCode: "CoSc-2021", instructorId: "inst_7" },
  { id: "assign-se-y2-b-1", departmentId: "SE", year: 2, section: "Sec B", courseCode: "SE-2112", instructorId: "inst_2" },
  { id: "assign-se-y2-b-2", departmentId: "SE", year: 2, section: "Sec B", courseCode: "CoSc-2011", instructorId: "inst_3" },
  { id: "assign-se-y2-b-3", departmentId: "SE", year: 2, section: "Sec B", courseCode: "CoSc-2021", instructorId: "inst_7" },
  { id: "assign-se-y3-a-1", departmentId: "SE", year: 3, section: "Sec A", courseCode: "SeEng-3211", instructorId: "inst_4" },
  { id: "assign-se-y3-a-2", departmentId: "SE", year: 3, section: "Sec A", courseCode: "SE-3113", instructorId: "inst_1" },
  { id: "assign-se-y3-a-3", departmentId: "SE", year: 3, section: "Sec A", courseCode: "CoSc-3022", instructorId: "inst_9" },
  { id: "assign-se-y4-a-1", departmentId: "SE", year: 4, section: "Sec A", courseCode: "SeEng-4212", instructorId: "inst_1" },
  { id: "assign-se-y4-a-2", departmentId: "SE", year: 4, section: "Sec A", courseCode: "SE-4211", instructorId: "inst_10" },

  // --- Computer Science ---
  { id: "assign-cs-y2-a-1", departmentId: "CS", year: 2, section: "Sec A", courseCode: "CoSc-2011", instructorId: "inst_8" },
  { id: "assign-cs-y2-a-2", departmentId: "CS", year: 2, section: "Sec A", courseCode: "CoSc-2021", instructorId: "inst_7" },
  { id: "assign-cs-y3-a-1", departmentId: "CS", year: 3, section: "Sec A", courseCode: "CoSc-3012", instructorId: "inst_1" },
  { id: "assign-cs-y3-a-2", departmentId: "CS", year: 3, section: "Sec A", courseCode: "CoSc-4112", instructorId: "inst_4" },
  { id: "assign-cs-y3-a-3", departmentId: "CS", year: 3, section: "Sec A", courseCode: "CoSc-3022", instructorId: "inst_9" },
  { id: "assign-cs-y3-b-1", departmentId: "CS", year: 3, section: "Sec B", courseCode: "CoSc-3012", instructorId: "inst_1" },
  { id: "assign-cs-y3-b-2", departmentId: "CS", year: 3, section: "Sec B", courseCode: "CoSc-4112", instructorId: "inst_4" },

  // --- Data Science ---
  { id: "assign-ds-y2-a-1", departmentId: "DS", year: 2, section: "Sec A", courseCode: "DS-2101", instructorId: "inst_6" },
  { id: "assign-ds-y2-a-2", departmentId: "DS", year: 2, section: "Sec A", courseCode: "CoSc-2011", instructorId: "inst_8" },
  { id: "assign-ds-y3-a-1", departmentId: "DS", year: 3, section: "Sec A", courseCode: "DS-3101", instructorId: "inst_6" },
  { id: "assign-ds-y3-a-2", departmentId: "DS", year: 3, section: "Sec A", courseCode: "CoSc-3022", instructorId: "inst_9" },

  // --- Information Technology ---
  { id: "assign-it-y2-a-1", departmentId: "IT", year: 2, section: "Sec A", courseCode: "IT-2201", instructorId: "inst_5" },
  { id: "assign-it-y2-a-2", departmentId: "IT", year: 2, section: "Sec A", courseCode: "CoSc-2021", instructorId: "inst_7" },
  { id: "assign-it-y3-a-1", departmentId: "IT", year: 3, section: "Sec A", courseCode: "IT-3202", instructorId: "inst_5" },
  { id: "assign-it-y3-a-2", departmentId: "IT", year: 3, section: "Sec A", courseCode: "SeEng-3211", instructorId: "inst_4" },

  // --- Information Systems ---
  { id: "assign-is-y2-a-1", departmentId: "IS", year: 2, section: "Sec A", courseCode: "IS-2111", instructorId: "inst_2" },
  { id: "assign-is-y2-a-2", departmentId: "IS", year: 2, section: "Sec A", courseCode: "IS-3121", instructorId: "inst_10" },
  { id: "assign-is-y3-a-1", departmentId: "IS", year: 3, section: "Sec A", courseCode: "IS-3121", instructorId: "inst_10" },
  { id: "assign-is-y3-a-2", departmentId: "IS", year: 3, section: "Sec A", courseCode: "SeEng-4212", instructorId: "inst_2" },

  // --- Cyber Security ---
  { id: "assign-cy-y2-a-1", departmentId: "CY", year: 2, section: "Sec A", courseCode: "CY-2101", instructorId: "inst_8" },
  { id: "assign-cy-y2-a-2", departmentId: "CY", year: 2, section: "Sec A", courseCode: "CoSc-2021", instructorId: "inst_9" },
  { id: "assign-cy-y3-a-1", departmentId: "CY", year: 3, section: "Sec A", courseCode: "CY-3201", instructorId: "inst_6" },
  { id: "assign-cy-y3-a-2", departmentId: "CY", year: 3, section: "Sec A", courseCode: "CoSc-3022", instructorId: "inst_3" }
];
