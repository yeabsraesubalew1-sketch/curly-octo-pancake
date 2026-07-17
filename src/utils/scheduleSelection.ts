export interface ScheduleSelectionInput {
  departments: Array<{ id: string; durationYears?: number }>;
  assignments: Array<{ departmentId: string; year: number; section: string }>;
  schedule: Array<{ departmentId: string; year: number; section: string }>;
  currentDepartmentId?: string;
  currentYear?: number;
  currentSection?: string;
}

export interface ScheduleSelectionResult {
  departmentId: string;
  year: number;
  section: string;
}

export function resolveScheduleSelection(input: ScheduleSelectionInput): ScheduleSelectionResult {
  const firstDepartment = input.departments[0]?.id || "";
  const fallbackDept = input.currentDepartmentId || firstDepartment;
  const fallbackYear = input.currentYear ?? 2;
  const fallbackSection = input.currentSection || "Sec A";

  const deptCandidates = input.departments
    .map((dept) => dept.id)
    .filter((deptId) => input.assignments.some((a) => a.departmentId === deptId));

  const preferredDepartment = deptCandidates.includes(fallbackDept)
    ? fallbackDept
    : deptCandidates[0] || fallbackDept;

  const validSections = input.assignments
    .filter((a) => a.departmentId === preferredDepartment && a.year === fallbackYear)
    .map((a) => a.section);

  const sectionOptions = Array.from(new Set(validSections.concat([fallbackSection, "Sec A", "Sec B"]))).filter(Boolean);

  const hasVisibleRows = (deptId: string, year: number, section: string) =>
    input.schedule.some((s) => s.departmentId === deptId && s.year === year && s.section === section);

  const preferredSection = sectionOptions.find((section) => hasVisibleRows(preferredDepartment, fallbackYear, section)) ||
    sectionOptions.find((section) => validSections.includes(section)) ||
    sectionOptions[0] || fallbackSection;

  return {
    departmentId: preferredDepartment,
    year: fallbackYear,
    section: preferredSection
  };
}
