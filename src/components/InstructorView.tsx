/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ScheduleItem, Instructor, Course, CourseAssignment } from "../types";
import { LogOut, BookOpen, GraduationCap, Calendar, ListTodo, Download, Lock, CalendarClock } from "lucide-react";
import { exportInstructorPDF } from "../utils/pdfExport";

interface InstructorViewProps {
  instructor: Instructor;
  schedule: ScheduleItem[];
  courses: Course[];
  assignments: CourseAssignment[];
  onLogout: () => void;
  onUpdatePassword: (newPass: string) => void;
}

export default function InstructorView({
  instructor,
  schedule,
  courses,
  assignments,
  onLogout,
  onUpdatePassword
}: InstructorViewProps) {
  // Filter assignments for this instructor
  const myAssignments = assignments.filter(a => a.instructorId === instructor.id);

  // Filter schedule for this instructor
  const mySchedules = schedule.filter(s => s.instructorId === instructor.id);

  const [passwordMsg, setPasswordMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [showSecurity, setShowSecurity] = useState(false);

  // Calculate loaded hours total
  const loadedHours = myAssignments.reduce((acc, curr) => {
    const cObj = courses.find(c => c.code === curr.courseCode);
    const hrs = cObj ? (cObj.lectureHours + (cObj.hasLab ? cObj.labHours : 0)) : 0;
    return acc + hrs;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel - Geometric Balance Theme */}
      <div id="instructor-header-bar" className="bg-emerald-800 border-b-4 border-emerald-600 rounded-none p-6 shadow-sm flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-white">
        <div className="flex items-center space-x-3 text-white">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-none shadow-sm shrink-0">
            <div className="w-6 h-6 border-2 border-emerald-800 flex items-center justify-center font-bold text-sm">
              <CalendarClock className="h-4 w-4 text-emerald-800" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold font-sans uppercase">Welcome, Dr./Lec. {instructor.name}</h2>
            <p className="text-[10px] text-teal-200 font-mono uppercase tracking-wider mt-0.5">
              Academic Faculty Portal - Workload loading: <strong className="text-white bg-emerald-600 px-1.5 py-0.5 ml-1 inline-block font-mono font-bold text-[11px]">{loadedHours}/{instructor.maxHoursPerWeek} Hours</strong>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {schedule.length > 0 && (
            <button
              id="instructor-pdf-btn"
              onClick={() => exportInstructorPDF(instructor, schedule, courses, assignments, [instructor])}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF Schedule</span>
            </button>
          )}
        </div>
      </div>

      {schedule.length === 0 ? (
        <div id="inst-schedule-empty-alert" className="p-12 text-center border-2 border-dashed border-gray-300 bg-slate-50 rounded-none max-w-lg mx-auto">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Academic Timetable Not Formed</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed font-sans">
            The Department Registrar has not completed the mathematical schedule grid calculations into the database. Please request your Registrar to compile and execute the Backtracking Solver.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Workload Assignments (1/4 width) */}
          <div className="xl:col-span-1 space-y-4 font-sans">
            <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <ListTodo className="h-4 w-4 text-slate-500" />
                <span>My Lecturing Workload</span>
              </h3>
              
              <div className="space-y-3">
                {myAssignments.map((a) => {
                  const currC = courses.find(c => c.code === a.courseCode);
                  const hrs = currC ? (currC.lectureHours + (currC.hasLab ? currC.labHours : 0)) : 0;
                  return (
                    <div key={a.id} className="border-b border-gray-100 pb-3 last:border-none last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-xs">{a.courseCode}</span>
                        <span className="text-[9px] font-mono bg-blue-50 border border-blue-200 text-blue-800 font-semibold px-2 rounded-none">
                          {hrs}H Value
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate leading-3">{currC?.title}</p>
                      <span className="inline-block text-[9px] bg-gray-50 border border-gray-205 text-gray-700 px-1.5 py-0.5 rounded-none font-mono mt-1 font-semibold uppercase leading-none">
                        Dept: {a.departmentId} Y{a.year} {a.section}
                      </span>
                    </div>
                  );
                })}
                {myAssignments.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No lecturing load assignations found for Dr./Lec. {instructor.name}.</p>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Matrix (3/4 width) */}
          <div className="xl:col-span-3 border border-slate-200 bg-white rounded-none p-6 shadow-sm overflow-hidden">
            <div className="flex items-center space-x-1.5 mb-4">
              <Calendar className="h-4 w-4 text-[#2B6CB0]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">My Personalized 5-Day Lecture Matrix</h3>
            </div>

            <div className="timetable-scroll overflow-x-scroll rounded-none border border-gray-200">
              <table className="w-full text-center border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="bg-[#1A365D] text-white font-mono text-[10px] border-b-2 border-[#2B6CB0] uppercase tracking-wider">
                    <th className="p-3 w-28 font-bold border-r border-[#1a2d4b] bg-[#152e50]">Period & Hour</th>
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
                        const cell = mySchedules.find(s => s.day === dayIdx && s.period === pNum);
                        return renderTimetableCell(cell, dayIdx);
                      })}
                    </tr>
                  ))}

                  {/* LUNCH ROW */}
                  <tr className="bg-gray-100 text-[#1A365D] font-mono font-bold text-center border-y border-gray-250">
                    <td className="p-2 border-r border-gray-200 font-semibold text-slate-700 text-[10px]">12:05-13:30</td>
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
                        const cell = mySchedules.find(s => s.day === dayIdx && s.period === pNum);
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

      {/* Account Security Toggle & Section at the very bottom */}
      <div id="inst-security-container" className="pt-6 border-t border-gray-200 flex flex-col items-center">
        <button
          id="toggle-inst-security-btn"
          onClick={() => setShowSecurity(!showSecurity)}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
        >
          {showSecurity ? "Hide Security Settings" : "Update Password"}
        </button>

        {showSecurity && (
          <div className="mt-6 w-full max-w-md bg-white border border-slate-200 p-6 shadow-sm rounded-none space-y-4 font-sans text-left">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Lock className="h-4 w-4 text-[#1A365D]" />
                <span>Account Security</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Update your faculty login password. Make sure to record it safely.
              </p>
            </div>
            
            {passwordMsg && (
              <div className={`p-3 text-xs font-mono rounded-none border-l-4 ${passwordMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-red-50 text-red-800 border-[#E53E3E]'}`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const newPass = (form.elements.namedItem("new-inst-pass") as HTMLInputElement).value;
              const confirmPass = (form.elements.namedItem("confirm-inst-pass") as HTMLInputElement).value;
              if (newPass !== confirmPass) {
                setPasswordMsg({ success: false, text: "Passwords do not match." });
                return;
              }
              if (newPass.length < 3) {
                setPasswordMsg({ success: false, text: "Minimum 3 characters." });
                return;
              }
              onUpdatePassword(newPass);
              setPasswordMsg({ success: true, text: "Password updated successfully." });
              form.reset();
            }} className="space-y-3">
              <div>
                <label htmlFor="new-inst-pass" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  New Password
                </label>
                <input
                  id="new-inst-pass"
                  name="new-inst-pass"
                  type="password"
                  placeholder="New Password"
                  required
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs outline-none text-slate-805 focus:ring-1 focus:ring-[#2B6CB0] focus:border-[#2B6CB0]"
                />
              </div>
              <div>
                <label htmlFor="confirm-inst-pass" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-inst-pass"
                  name="confirm-inst-pass"
                  type="password"
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs outline-none text-slate-805 focus:ring-1 focus:ring-[#2B6CB0] focus:border-[#2B6CB0]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1A365D] hover:bg-[#2B6CB0] text-white font-bold py-2 rounded-none text-xs uppercase tracking-widest transition cursor-pointer"
              >
                Change Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  function renderTimetableCell(cell: ScheduleItem | undefined, day: number) {
    if (!cell) {
      return (
        <td key={day} className="timetable-cell timetable-cell-empty p-2 border-r border-gray-200 bg-gray-100/10 text-slate-300 italic text-[10px]">
          [ open ]
        </td>
      );
    }

    return (
      <td key={day} className="timetable-cell p-1 border-r border-gray-200 align-stretch">
        {cell.isLab ? (
          <div className="timetable-cell-content h-full bg-amber-950/40 border border-amber-800/30 border-l-4 border-l-amber-500 p-2 text-[10px] text-left rounded-none">
            <div className="font-bold text-white uppercase">{cell.courseCode}</div>
            <p className="text-[10px] mt-0.5 text-amber-200 font-semibold uppercase font-mono leading-none">
              {cell.departmentId} Y{cell.year} {cell.section}
            </p>
            <span className="text-[8px] bg-amber-950/60 border border-amber-500/30 text-amber-400 px-1 font-mono font-bold block w-fit mt-1 rounded">LAB</span>
          </div>
        ) : (
          <div className="timetable-cell-content h-full bg-emerald-950/40 border border-emerald-800/30 border-l-4 border-l-emerald-500 p-2 text-[10px] text-left rounded-none">
            <div className="font-bold text-white uppercase">{cell.courseCode}</div>
            <p className="text-[10px] mt-0.5 text-emerald-200 font-semibold uppercase font-mono leading-none">
              {cell.departmentId} Y{cell.year}
            </p>
            <span className="text-[9px] text-emerald-400 font-mono block mt-0.5 leading-none">
              {cell.section}
            </span>
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
