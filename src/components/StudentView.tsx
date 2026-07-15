/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ScheduleItem, Instructor, Course, CourseAssignment } from "../types";
import { ArrowLeft, BookOpen, GraduationCap, Calendar, Clock, Download, CalendarClock } from "lucide-react";
import { exportStudentPDF } from "../utils/pdfExport";

interface StudentViewProps {
  studentData: {
    departmentId: string;
    year: number;
    section: string;
  };
  schedule: ScheduleItem[];
  instructors: Instructor[];
  courses: Course[];
  assignments: CourseAssignment[];
  onBack: () => void;
}

export default function StudentView({
  studentData,
  schedule,
  instructors,
  courses,
  assignments,
  onBack
}: StudentViewProps) {
  const { departmentId, year, section } = studentData;

  // Filter assignments for this student
  const studentAssignments = assignments.filter(
    a => a.departmentId === departmentId && a.year === year && a.section === section
  );

  // Filter schedule slots for this student
  const studentSchedules = schedule.filter(
    s => s.departmentId === departmentId && s.year === year && s.section === section
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Back Button */}
      <div id="student-header-bar" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b-2 border-slate-200 pb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-800 text-white flex items-center justify-center rounded-none shadow-sm">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide leading-tight">
              Student Matrix: Year {year} Section {section}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase leading-none">
              Department Branch: {departmentId}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {schedule.length > 0 && (
            <button
              id="student-pdf-btn"
              onClick={() => exportStudentPDF(studentData, schedule, instructors, courses, assignments)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF Timetable</span>
            </button>
          )}
        </div>
      </div>

      {schedule.length === 0 ? (
        <div id="student-schedule-unbuilt-notice" className="p-12 text-center border-2 border-dashed border-gray-300 bg-slate-50 rounded-none max-w-lg mx-auto">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Timetable Has Not Been Formed</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            The Dean has not computed the final matrix scheduler in the database yet. Please contact your Registrar to initiate schedule solving!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Section Course Catalogue card (1/4 width) */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span>Classroom Directory</span>
              </h3>
              
              <div className="space-y-3">
                {studentAssignments.map((a) => {
                  const currC = courses.find(c => c.code === a.courseCode);
                  const inst = instructors.find(i => i.id === a.instructorId);
                  
                  return (
                    <div key={a.id} className="border-b border-gray-100 pb-3 last:border-none last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-xs">{a.courseCode}</span>
                        {currC?.hasLab && (
                          <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded-none uppercase">
                            Lab Included
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5 max-w-[200px] leading-3 truncate">
                        {currC ? currC.title : "Course study"}
                      </p>
                      <p className="text-[10px] text-slate-700 font-medium font-mono mt-1 uppercase">
                        Fac: {inst ? inst.name : "Faculty staff"}
                      </p>
                    </div>
                  );
                })}
                {studentAssignments.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No course relationships linked to your section.</p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-none font-sans">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Time Allocations</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Lessons start at 8:30 AM. Each slot is exactly 50 minutes long with a 5-minute transition period. Normal lectures and hands-on lab blocks are kept contiguous on separate days.
              </p>
            </div>
          </div>

          {/* Timetable schedule grid (3/4 width) */}
          <div className="xl:col-span-3 border border-slate-200 bg-white rounded-none p-6 shadow-sm overflow-hidden">
            <div className="flex items-center space-x-1.5 mb-4">
              <Calendar className="h-4 w-4 text-[#2B6CB0]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">5-Day Section Timetable Grid</h3>
            </div>

            <div className="timetable-scroll overflow-x-scroll rounded-none border border-gray-200">
              <table className="w-full text-center border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="bg-[#1A365D] text-white font-mono text-[10px] border-b-2 border-[#2B6CB0] uppercase tracking-wider">
                    <th className="p-3 w-28 font-bold border-r border-[#1a2d4b] bg-[#152e50]">Time slots</th>
                    <th className="p-3 border-r border-[#1a2d4b]">Monday</th>
                    <th className="p-3 border-r border-[#1a2d4b]">Tuesday</th>
                    <th className="p-3 border-r border-[#1a2d4b]">Wednesday</th>
                    <th className="p-3 border-r border-[#1a2d4b]">Thursday</th>
                    <th className="p-3">Friday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {/* Periods 1 to 4 */}
                  {[1, 2, 3, 4].map(pNum => (
                    <tr key={pNum}>
                      <td className="p-2 border-r border-gray-200 bg-gray-50 font-semibold font-mono text-center">
                        <span className="block text-[11px] text-slate-700">Period {pNum}</span>
                        <span className="block text-[9px] text-slate-400 font-normal">{getPeriodTime(pNum)}</span>
                      </td>
                      {[0, 1, 2, 3, 4].map(dayIdx => {
                        const cell = studentSchedules.find(s => s.day === dayIdx && s.period === pNum);
                        return renderTimetableCell(cell, dayIdx);
                      })}
                    </tr>
                  ))}

                  {/* LUNCH BREAK COFFEE */}
                  <tr className="bg-gray-100 text-[#1A365D] font-mono font-bold text-center border-y border-gray-250">
                    <td className="p-2 border-r border-gray-250 font-semibold text-slate-700 text-[10px]">12:05-13:30</td>
                    <td colSpan={5} className="py-2.5 tracking-[0.4em] text-[10px] uppercase font-bold text-slate-500">
                      ☕ LUNCH RECESS BREAK ☕
                    </td>
                  </tr>

                  {/* Periods 5 to 8 */}
                  {[5, 6, 7, 8].map(pNum => (
                    <tr key={pNum}>
                      <td className="p-2 border-r border-gray-200 bg-gray-50 font-semibold font-mono text-center">
                        <span className="block text-[11px] text-slate-700">Period {pNum}</span>
                        <span className="block text-[9px] text-slate-400 font-normal">{getPeriodTime(pNum)}</span>
                      </td>
                      {[0, 1, 2, 3, 4].map(dayIdx => {
                        const cell = studentSchedules.find(s => s.day === dayIdx && s.period === pNum);
                        return renderTimetableCell(cell, dayIdx);
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );

  function renderTimetableCell(cell: ScheduleItem | undefined, day: number) {
    if (!cell) {
      return (
        <td key={day} className="timetable-cell timetable-cell-empty p-2 border-r border-gray-200 bg-gray-50/10 text-slate-300 italic text-[10px]">
          [ open ]
        </td>
      );
    }

    const tInst = instructors.find(i => i.id === cell.instructorId);

    // Apply exact HTML theme specs for Lecture / Lab blocks using clean rectangular shapes
    return (
      <td key={day} className="timetable-cell p-1 border-r border-gray-200 align-stretch">
        {cell.isLab ? (
          <div className="timetable-cell-content h-full bg-amber-950/40 border border-amber-800/30 border-l-4 border-l-amber-500 p-2 text-[10px] text-left rounded-none">
            <div className="font-bold text-white uppercase">{cell.courseCode}</div>
            <div className="text-slate-300 font-medium truncate mt-0.5">{tInst ? tInst.name : "Lab Asst"}</div>
            <span className="text-[8px] bg-amber-950/60 border border-amber-500/30 text-amber-400 px-1 font-mono font-bold block w-fit mt-1 rounded">LAB</span>
          </div>
        ) : (
          <div className="timetable-cell-content h-full bg-emerald-950/40 border border-emerald-800/30 border-l-4 border-l-emerald-500 p-2 text-[10px] text-left rounded-none">
            <div className="font-bold text-white uppercase">{cell.courseCode}</div>
            <div className="text-slate-300 font-medium truncate mt-0.5">{tInst ? tInst.name : "Dr. Faculty"}</div>
          </div>
        )}
      </td>
    );
  }

  function getPeriodTime(p: number): string {
    const times = [
      "",
      "8:30-9:20",
      "9:25-10:15",
      "10:20-11:10",
      "11:15-12:05",
      "13:30-14:20",
      "14:25-15:15",
      "15:20-16:10",
      "16:15-17:05"
    ];
    return times[p] || "";
  }
}
