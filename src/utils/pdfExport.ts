import { jsPDF } from "jspdf";
import { ScheduleItem, Instructor, Course, CourseAssignment, Department } from "../types";

/**
 * Draw a single timetable matrix page onto the PDF document.
 */
function drawTimetablePage(
  doc: jsPDF,
  title: string,
  subtitle: string,
  scheduleItems: ScheduleItem[],
  assignmentsList: CourseAssignment[],
  courses: Course[],
  instructors: Instructor[],
  isMultiPage: boolean
) {
  if (isMultiPage) {
    doc.addPage();
  }

  // Draw header block
  doc.setFillColor(26, 54, 93); // #1A365D (Navy Blue)
  doc.rect(15, 12, 267, 18, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 20, 24);

  // Header Subtitle (Right aligned)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254); // Light Blue Text
  doc.text(subtitle, 276, 24, { align: "right" });

  // Grid start
  const startX = 15;
  const startY = 35;
  const colWidths = [27, 48, 48, 48, 48, 48];
  const headerHeight = 7;
  const periodHeight = 7.5;
  const lunchHeight = 5;

  // Draw grid header
  doc.setFillColor(43, 108, 176); // #2B6CB0 (Medium Blue)
  doc.rect(startX, startY, 267, headerHeight, "F");
  
  const headers = ["Time / Period", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  
  let currentX = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], currentX + colWidths[i] / 2, startY + 5, { align: "center" });
    currentX += colWidths[i];
  }

  // Periods and Lunch
  let currentY = startY + headerHeight;
  
  const getPeriodTime = (p: number) => {
    const times = ["", "08:30-09:20", "09:25-10:15", "10:20-11:10", "11:15-12:05", "13:30-14:20", "14:25-15:15", "15:20-16:10", "16:15-17:05"];
    return times[p] || "";
  };

  for (let p = 1; p <= 8; p++) {
    if (p === 5) {
      // Draw Lunch Break row
      doc.setFillColor(241, 245, 249); // light gray
      doc.rect(startX, currentY, 267, lunchHeight, "F");
      doc.setDrawColor(203, 213, 225);
      doc.line(startX, currentY, startX + 267, currentY);
      doc.line(startX, currentY + lunchHeight, startX + 267, currentY + lunchHeight);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("LUNCH RECESS BREAK (12:05 - 13:30)", startX + 267 / 2, currentY + 3.8, { align: "center" });
      currentY += lunchHeight;
    }

    // Draw Period row background & border
    doc.setDrawColor(226, 232, 240);
    doc.line(startX, currentY, startX + 267, currentY);
    doc.line(startX, currentY + periodHeight, startX + 267, currentY + periodHeight);

    // Leftmost cell (Period / Time)
    doc.setFillColor(248, 250, 252);
    doc.rect(startX, currentY, colWidths[0], periodHeight, "F");
    doc.setDrawColor(203, 213, 225);
    doc.line(startX + colWidths[0], currentY, startX + colWidths[0], currentY + periodHeight);

    doc.setTextColor(71, 85, 105);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`Period ${p}`, startX + colWidths[0] / 2, currentY + 3.2, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(getPeriodTime(p), startX + colWidths[0] / 2, currentY + 6.2, { align: "center" });

    // Monday to Friday cells
    let cellX = startX + colWidths[0];
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      doc.setDrawColor(226, 232, 240);
      doc.line(cellX + colWidths[dayIdx + 1], currentY, cellX + colWidths[dayIdx + 1], currentY + periodHeight);

      // Find match
      const match = scheduleItems.find(s => s.day === dayIdx && s.period === p);
      if (match) {
        if (match.isLab) {
          // Lab fill - soft amber #FEF3C7
          doc.setFillColor(254, 243, 199);
          doc.rect(cellX + 0.5, currentY + 0.5, colWidths[dayIdx + 1] - 1, periodHeight - 1, "F");
          doc.setTextColor(120, 53, 4); // deep amber
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text(`${match.courseCode} (LAB)`, cellX + 3, currentY + 3.2);
        } else {
          // Lecture fill - soft blue #DBEAFE
          doc.setFillColor(219, 234, 254);
          doc.rect(cellX + 0.5, currentY + 0.5, colWidths[dayIdx + 1] - 1, periodHeight - 1, "F");
          doc.setTextColor(30, 58, 138); // deep blue
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text(match.courseCode, cellX + 3, currentY + 3.2);
        }

        // Instructor name
        const cellInst = instructors.find(i => i.id === match.instructorId);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        const instName = cellInst ? cellInst.name : "Faculty Staff";
        const displayName = instName.length > 22 ? instName.substring(0, 19) + "..." : instName;
        doc.text(displayName, cellX + 3, currentY + 6.2);
      } else {
        doc.setTextColor(203, 213, 225);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7);
        doc.text("-", cellX + colWidths[dayIdx + 1] / 2, currentY + 4.5, { align: "center" });
      }

      cellX += colWidths[dayIdx + 1];
    }

    currentY += periodHeight;
  }

  // Draw final border of the grid
  doc.setDrawColor(71, 85, 105);
  doc.rect(startX, startY, 267, currentY - startY);

  // Now draw the Course List below the grid
  let listY = currentY + 6;
  doc.setFillColor(26, 54, 93); // #1A365D
  doc.rect(startX, listY, 267, 5.5, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("SECTION COURSE WORKLOAD & STAFF DIRECTORY", startX + 4, listY + 3.8);

  listY += 5.5;

  // Table header for Courses
  doc.setFillColor(241, 245, 249);
  doc.rect(startX, listY, 267, 5.5, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(startX, listY + 5.5, startX + 267, listY + 5.5);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  
  const colC = [35, 112, 65, 55]; // total = 267
  const x0 = startX;
  const x1 = x0 + colC[0];
  const x2 = x1 + colC[1];
  const x3 = x2 + colC[2];

  doc.text("Course Code", x0 + 4, listY + 3.8);
  doc.text("Course Title Name", x1 + 4, listY + 3.8);
  doc.text("Dedicated Teaching Faculty", x2 + 4, listY + 3.8);
  doc.text("Format & Load Slots", x3 + 4, listY + 3.8);

  listY += 5.5;

  // Render course list rows
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  if (assignmentsList.length === 0) {
    doc.text("No assignments defined for this section.", x0 + 4, listY + 3.8);
    listY += 5.5;
  } else {
    assignmentsList.forEach((a, idx) => {
      // Row alternate background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, listY, 267, 5, "F");
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(startX, listY + 5, startX + 267, listY + 5);

      const cObj = courses.find(c => c.code === a.courseCode);
      const iObj = instructors.find(i => i.id === a.instructorId);

      const codeText = a.courseCode;
      const titleText = cObj ? cObj.title : "Course Study";
      const instName = iObj ? iObj.name : "Unassigned Staff";
      
      let formatText = "Lecture";
      if (cObj) {
        const totalHrs = cObj.lectureHours + (cObj.hasLab ? cObj.labHours : 0);
        formatText = `${cObj.lectureHours} Lec` + (cObj.hasLab ? ` + ${cObj.labHours} Lab` : "") + ` (${totalHrs} Hrs)`;
      }

      // Draw texts
      doc.setFont("Helvetica", "bold");
      doc.text(codeText, x0 + 4, listY + 3.5);
      doc.setFont("Helvetica", "normal");
      doc.text(titleText, x1 + 4, listY + 3.5);
      doc.text(instName, x2 + 4, listY + 3.5);
      doc.text(formatText, x3 + 4, listY + 3.5);

      listY += 5;
    });
  }

  // Draw border outline around course table
  const tableHeight = assignmentsList.length ? assignmentsList.length * 5 : 5;
  doc.setDrawColor(203, 213, 225);
  doc.rect(startX, listY - tableHeight - 11, 267, tableHeight + 11);
}

/**
 * Export student timetable.
 */
export function exportStudentPDF(
  studentData: { departmentId: string; year: number; section: string },
  schedule: ScheduleItem[],
  instructors: Instructor[],
  courses: Course[],
  assignments: CourseAssignment[]
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const { departmentId, year, section } = studentData;

  const studentSchedules = schedule.filter(
    s => s.departmentId === departmentId && s.year === year && s.section === section
  );
  const studentAssignments = assignments.filter(
    a => a.departmentId === departmentId && a.year === year && a.section === section
  );

  const title = "STUDENT ACADEMIC TIMETABLE REPORT";
  const subtitle = `Branch: ${departmentId} | Year ${year} - ${section}`;

  drawTimetablePage(doc, title, subtitle, studentSchedules, studentAssignments, courses, instructors, false);

  doc.save(`timetable_student_${departmentId}_Y${year}_${section.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Export instructor timetable.
 */
export function exportInstructorPDF(
  instructor: Instructor,
  schedule: ScheduleItem[],
  courses: Course[],
  assignments: CourseAssignment[],
  instructors: Instructor[]
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const mySchedules = schedule.filter(s => s.instructorId === instructor.id);
  const myAssignments = assignments.filter(a => a.instructorId === instructor.id);

  const title = `FACULTY WORKLOAD MATRIX: ${instructor.name.toUpperCase()}`;
  const subtitle = `Username: ${instructor.username} | Capacity Max: ${instructor.maxHoursPerWeek} Slots`;

  drawTimetablePage(doc, title, subtitle, mySchedules, myAssignments, courses, instructors, false);

  doc.save(`timetable_instructor_${instructor.username}.pdf`);
}

/**
 * Export all schedules as a single multi-page PDF document for Admin/Registrar.
 * Generates pages for all classes (sections) that have at least one course assigned to them.
 */
export function exportAdminPDF(
  departments: Department[],
  instructors: Instructor[],
  courses: Course[],
  assignments: CourseAssignment[],
  schedule: ScheduleItem[]
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Group active classes (dept + year + section) that have assignments
  const activeClassKeys = Array.from(
    new Set(assignments.map(a => `${a.departmentId}|${a.year}|${a.section}`))
  );

  if (activeClassKeys.length === 0) {
    // Just draw an empty generic template
    drawTimetablePage(doc, "REGISTRAR COMPILED TIMETABLE REPORT", "No Active Assigned Classes Defined", [], [], courses, instructors, false);
    doc.save("university_complete_timetables_empty.pdf");
    return;
  }

  activeClassKeys.forEach((key, idx) => {
    const [departmentId, yearStr, section] = key.split("|");
    const year = Number(yearStr);

    const classSchedules = schedule.filter(
      s => s.departmentId === departmentId && s.year === year && s.section === section
    );
    const classAssignments = assignments.filter(
      a => a.departmentId === departmentId && a.year === year && a.section === section
    );

    const title = "REGISTRAR COMPILED TIMETABLE REPORT";
    const subtitle = `Branch: ${departmentId} | Year ${year} - ${section} (Class ${idx + 1} of ${activeClassKeys.length})`;

    drawTimetablePage(doc, title, subtitle, classSchedules, classAssignments, courses, instructors, idx > 0);
  });

  doc.save("university_complete_timetables_report.pdf");
}
