import test from "node:test";
import assert from "node:assert/strict";
import { resolveScheduleSelection } from "./scheduleSelection.ts";

test("prefers a section with actual generated rows when the current selection is stale", () => {
  const result = resolveScheduleSelection({
    departments: [
      { id: "CS", durationYears: 4 },
      { id: "SE", durationYears: 4 }
    ],
    assignments: [
      { departmentId: "CS", year: 2, section: "Sec A" },
      { departmentId: "SE", year: 2, section: "Sec A" }
    ],
    schedule: [{ departmentId: "CS", year: 2, section: "Sec A" }],
    currentDepartmentId: "IT",
    currentYear: 2,
    currentSection: "Sec B"
  });

  assert.equal(result.departmentId, "CS");
  assert.equal(result.year, 2);
  assert.equal(result.section, "Sec A");
});

test("falls back to the first available section when the current section is not valid for the selected year", () => {
  const result = resolveScheduleSelection({
    departments: [{ id: "CS", durationYears: 4 }],
    assignments: [
      { departmentId: "CS", year: 3, section: "Sec B" },
      { departmentId: "CS", year: 2, section: "Sec A" }
    ],
    schedule: [],
    currentDepartmentId: "CS",
    currentYear: 2,
    currentSection: "Sec C"
  });

  assert.equal(result.departmentId, "CS");
  assert.equal(result.year, 2);
  assert.equal(result.section, "Sec A");
});
