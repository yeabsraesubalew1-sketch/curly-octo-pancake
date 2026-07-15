/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side port of src/scheduler.ts. Kept logically identical so the
 * "engine" behaves the same whether it was ever run client-side or here;
 * it now runs here so that schedule generation is authoritative and
 * persisted straight into MongoDB.
 */

function dayName(day) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days[day] || "Day";
}

export function generateFullSchedule(departments, instructors, courses, assignments) {
  // --- PRE-CHECKS ---

  if (assignments.length === 0) {
    return {
      success: false,
      schedule: [],
      errors: [{
        type: "no_courses",
        message: "No course relationships or assignments have been added yet."
      }]
    };
  }

  // 1. Check for unassigned instructors
  for (const assign of assignments) {
    if (!assign.instructorId) {
      const course = courses.find((c) => c.code === assign.courseCode);
      const courseName = course ? `${course.code} (${course.title})` : assign.courseCode;
      return {
        success: false,
        schedule: [],
        errors: [{
          type: "unassigned_instructor",
          message: `The course ${courseName} in Department ${assign.departmentId}, Year ${assign.year}, ${assign.section} has no instructor assigned to it.`,
          offendingEntity: assign.courseCode
        }]
      };
    }
  }

  // 2. Check Instructor maximum hours per week legal limit
  const instructorWeeklyHoursMap = new Map();
  for (const assign of assignments) {
    const course = courses.find((c) => c.code === assign.courseCode);
    if (!course) continue;
    const hours = (course.hasLab ? course.labHours : 0) + course.lectureHours;
    instructorWeeklyHoursMap.set(
      assign.instructorId,
      (instructorWeeklyHoursMap.get(assign.instructorId) || 0) + hours
    );
  }

  for (const [instId, hours] of instructorWeeklyHoursMap.entries()) {
    const instructor = instructors.find((i) => i.id === instId);
    if (instructor && hours > instructor.maxHoursPerWeek) {
      return {
        success: false,
        schedule: [],
        errors: [{
          type: "instructor_limit_exceeded",
          message: `Instructor ${instructor.name} is assigned to teach ${hours} hours in a week, which exceeds their legally mandated maximum of ${instructor.maxHoursPerWeek} hours under university guidelines.`,
          offendingEntity: instructor.name
        }]
      };
    }
  }

  // 3. Check for sections overload (max 40 hours)
  const sectionWeeklyHoursMap = new Map();
  for (const assign of assignments) {
    const course = courses.find((c) => c.code === assign.courseCode);
    if (!course) continue;
    const hours = (course.hasLab ? course.labHours : 0) + course.lectureHours;
    const key = `${assign.departmentId}-${assign.year}-${assign.section}`;
    const curr = sectionWeeklyHoursMap.get(key) || { dept: assign.departmentId, yr: assign.year, sec: assign.section, hours: 0 };
    curr.hours += hours;
    sectionWeeklyHoursMap.set(key, curr);
  }

  for (const [, details] of sectionWeeklyHoursMap.entries()) {
    if (details.hours > 40) {
      return {
        success: false,
        schedule: [],
        errors: [{
          type: "insufficient_slots",
          message: `Department ${details.dept} Year ${details.yr} ${details.sec} has courses assigned for a total of ${details.hours} hours. The available weekly slots are capped at 40 (5 days x 8 slots), making a valid schedule mathematically impossible.`,
          offendingEntity: `${details.dept} Y${details.yr} ${details.sec}`
        }]
      };
    }
  }

  // --- BLOCK PREPARATION ---
  const blocks = [];
  let blockIdCounter = 1;

  for (const assign of assignments) {
    const course = courses.find((c) => c.code === assign.courseCode);
    if (!course) continue;

    const sections = [];
    if (course.hasLab) {
      sections.push({ isLab: true, size: course.labHours || 3 });
      if (course.lectureHours > 0) {
        sections.push({ isLab: false, size: course.lectureHours });
      }
    } else {
      let hoursLeft = course.lectureHours;
      while (hoursLeft > 0) {
        if (hoursLeft >= 2) {
          sections.push({ isLab: false, size: 2 });
          hoursLeft -= 2;
        } else {
          sections.push({ isLab: false, size: 1 });
          hoursLeft -= 1;
        }
      }
    }

    for (const sec of sections) {
      blocks.push({
        id: `blk_${blockIdCounter++}`,
        assignmentId: assign.id,
        courseCode: assign.courseCode,
        departmentId: assign.departmentId,
        year: assign.year,
        section: assign.section,
        instructorId: assign.instructorId,
        isLab: sec.isLab,
        size: sec.size
      });
    }
  }

  blocks.sort((a, b) => {
    if (b.size !== a.size) return b.size - a.size;
    if (a.isLab !== b.isLab) return a.isLab ? -1 : 1;
    return 0;
  });

  // --- BACKTRACKING SOLVER ---
  const sectionGrids = {};
  const instGrids = {};

  for (const assign of assignments) {
    const sKey = `${assign.departmentId}-${assign.year}-${assign.section}`;
    if (!sectionGrids[sKey]) {
      sectionGrids[sKey] = Array.from({ length: 5 }, () => Array(8).fill(null));
    }
    if (!instGrids[assign.instructorId]) {
      instGrids[assign.instructorId] = Array.from({ length: 5 }, () => Array(8).fill(null));
    }
  }

  const placements = {};
  let iterations = 0;
  const MAX_ITERATIONS = 40000;
  const failTrace = {};

  function recordTrace(msg) {
    failTrace[msg] = (failTrace[msg] || 0) + 1;
  }

  function canPlace(blk, day, startPeriod) {
    const size = blk.size;
    const endPeriod = startPeriod + size - 1;

    if (endPeriod > 8) return false;

    const isMorning = startPeriod <= 4;
    const endsMorning = endPeriod <= 4;
    const isAfternoon = startPeriod >= 5;
    const endsAfternoon = endPeriod >= 5 && endPeriod <= 8;

    if (!((isMorning && endsMorning) || (isAfternoon && endsAfternoon))) {
      return false;
    }

    const sKey = `${blk.departmentId}-${blk.year}-${blk.section}`;
    const sGrid = sectionGrids[sKey];
    const iGrid = instGrids[blk.instructorId];

    for (let p = startPeriod; p <= endPeriod; p++) {
      const idx = p - 1;
      if (sGrid && sGrid[day][idx] !== null) {
        recordTrace(`Section ${sKey} is busy at ${dayName(day)} Period ${p}`);
        return false;
      }
      if (iGrid && iGrid[day][idx] !== null) {
        const other = iGrid[day][idx];
        const instructor = instructors.find((i) => i.id === blk.instructorId);
        const instName = instructor ? instructor.name : "Instructor";
        recordTrace(`Instructor ${instName} has overlapping class scheduled with ${other.courseCode} in ${other.departmentId} Y${other.year} ${dayName(day)} Period ${p}`);
        return false;
      }
    }

    return true;
  }

  function placeBlock(blk, day, startPeriod) {
    const sKey = `${blk.departmentId}-${blk.year}-${blk.section}`;
    const sGrid = sectionGrids[sKey];
    const iGrid = instGrids[blk.instructorId];

    placements[blk.id] = { day, startPeriod };

    for (let p = startPeriod; p < startPeriod + blk.size; p++) {
      const idx = p - 1;
      if (sGrid) sGrid[day][idx] = blk;
      if (iGrid) iGrid[day][idx] = blk;
    }
  }

  function removeBlock(blk) {
    const loc = placements[blk.id];
    if (!loc) return;

    const sKey = `${blk.departmentId}-${blk.year}-${blk.section}`;
    const sGrid = sectionGrids[sKey];
    const iGrid = instGrids[blk.instructorId];

    for (let p = loc.startPeriod; p < loc.startPeriod + blk.size; p++) {
      const idx = p - 1;
      if (sGrid) sGrid[loc.day][idx] = null;
      if (iGrid) iGrid[loc.day][idx] = null;
    }

    delete placements[blk.id];
  }

  function solve(index) {
    iterations++;
    if (iterations > MAX_ITERATIONS) return false;
    if (index >= blocks.length) return true;

    const blk = blocks[index];
    const possibleStarts = [1, 2, 3, 4, 5, 6, 7, 8];

    for (let day = 0; day < 5; day++) {
      for (const start of possibleStarts) {
        if (canPlace(blk, day, start)) {
          placeBlock(blk, day, start);
          if (solve(index + 1)) return true;
          removeBlock(blk);
        }
      }
    }

    return false;
  }

  const solved = solve(0);

  if (solved) {
    const scheduleItems = [];
    let itemId = 1;

    for (const [blkId, loc] of Object.entries(placements)) {
      const blk = blocks.find((b) => b.id === blkId);
      for (let p = loc.startPeriod; p < loc.startPeriod + blk.size; p++) {
        scheduleItems.push({
          id: `item_${itemId++}`,
          departmentId: blk.departmentId,
          year: blk.year,
          section: blk.section,
          day: loc.day,
          period: p,
          courseCode: blk.courseCode,
          isLab: blk.isLab,
          instructorId: blk.instructorId
        });
      }
    }

    return { success: true, schedule: scheduleItems, errors: [] };
  }

  const worstConflicts = Object.entries(failTrace)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);

  let errMsg = "Scheduling algorithm failed because it could not find a conflict-free solution for all constraints simultaneously. ";
  if (worstConflicts.length > 0) {
    errMsg += "Top constraints that blocked scheduling:\n" + worstConflicts.map((c, i) => `${i + 1}. ${c}`).join("\n");
  } else {
    errMsg += "This may be due to complex lab sessions (requiring contiguous block of 3 periods) or instructor assignments overlapping on all days.";
  }

  return {
    success: false,
    schedule: [],
    errors: [{ type: "general_conflict", message: errMsg }]
  };
}
