/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Clipboard, Check, Code, Award, Layers, Terminal } from "lucide-react";

export default function CppPromptGuide() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"arch" | "dsa" | "prompt">("arch");

  const promptText = `I need you to write a complete desktop application in C++ using Qt Creator (Qt 6 or 5) and QSqlDatabase (SQLite).
The app is a College Scheduling System with strict multi-actor views and rigid timetable generation constraints.

Please design the C++ program utilizing fundamental DSA concepts:
1. STL list (<list>) for dynamic record tracking instead of standard vectors.
2. Plain 2D multi-dimensional arrays (e.g., Course assignments[5][8] or equivalent structures) to represent the daily schedule.
3. Use 'using namespace std' so we don't have to write std:: everywhere.
4. Implement a clean Recursive Backtracking search with backtracking state reset to solve the scheduling constraints.

Here are the details for the Database Schema (using Qt's QSqlDatabase with an insert-or-replace SQLite database file):
1. 'departments': (id TEXT PRIMARY KEY, name TEXT, durationYears INTEGER)
2. 'instructors': (id TEXT PRIMARY KEY, name TEXT, username TEXT, password TEXT, maxHoursPerWeek INTEGER)
3. 'courses': (code TEXT PRIMARY KEY, title TEXT, hasLab BOOLEAN, labHours INTEGER, lectureHours INTEGER)
4. 'assignments': (id TEXT PRIMARY KEY, departmentId TEXT, year INTEGER, section TEXT, courseCode TEXT, instructorId TEXT)
5. 'schedule': (id TEXT PRIMARY KEY, departmentId TEXT, year INTEGER, section TEXT, day INTEGER, period INTEGER, courseCode TEXT, isLab BOOLEAN, instructorId TEXT)

At initialization, create a default admin with username 'admin' and password 'admin123' if it doesn't already exist.

SCHEDULING CONSTRAINTS & DETAILS TO ENFORCE:
- Divided into 8 periods per day across 5 days (Monday-Friday).
- Periods 1 to 4 are Morning, 5 to 8 are Afternoon. Lunch time is a gap between 4 and 5 (12:05 PM to 1:30 PM). No scheduled lesson can split across the morning/afternoon lunch boundary.
- For a course with lab (hasLab = true, labHours = 3, lectureHours = 2):
  - The lab sessions MUST be placed as a single contiguous 3-period block (e.g., slots 1-3, 2-4, 5-7, or 6-8) on the same day.
  - The lecture sessions must be scheduled as a single contiguous 2-period block on another day (or same day, no penalty, but standard is different).
- Try to keep 2-period lecture blocks contiguous.
- Instructors have a strict maxHoursPerWeek. Ensure no instructor is assigned elements exceeding their capacity.
- Prevent overlaps:
  - Section overlaps: Only one class can occur for department D, year Y, section S at any day d, period p.
  - Instructor overlaps: An instructor cannot teach more than one section and course at any day d, period p.
- Exact Conflict Reporting:
  - If a schedule cannot be formed, the scheduling module MUST return a detailed report explaining the precise bottleneck. Trace and report:
    - If a course assignment has no instructor.
    - If an instructor's assigned total hours exceeds their weekly maximum.
    - Which specific section or instructor had overlapping time conflicts during state search, listing their literal names.

ACTOR SEGREGATION VIEWS:
1. Login View: 3 actor choices via radio buttons or dropdown (Admin, Student, Instructor).
   - Admin logs in with username and password.
   - Instructor logs in with instructor username and password.
   - Student logs in without account by choosing their Department, Year, and Section from dynamic dropdowns populated from active database records.
2. Admin Dashboard:
   - Persists a 'Logout' button.
   - Tab 1: Database Management - Forms to add, search, view, and delete records (Departments, Courses, Instructors). Supports parsing and importing separate CSV files using clean QFileDialog and transactions (QSqlDatabase::transaction() / rollback() / commit()).
   - Tab 2: Assign Relationships - Interface to assign courses to specific years of departments, and assign instructors to those courses (with checks against maxHoursPerWeek).
   - Tab 3: Scheduler - Displays a "Generate Schedule" button. If generation fails, opens a QMessageBox with detailed error traces. If it succeeds, shows the schedule grid for a chosen section.
3. Instructor Dashboard:
   - Shows their assigned courses list.
   - Displays their beautifully formatted, personalized 5x8 weekly timetable.
   - Persists a Logout button.
4. Student Dashboard:
   - Shows current course list for their section.
   - Displays their beautiful 5x8 weekly schedule.
   - Persists a Logout button to return to the selection page.

Please write clean, professional, fully commented Qt C++ code including 'mainwindow.h', 'mainwindow.cpp', 'scheduler.h', and 'scheduler.cpp'. Arrange layout panels nicely using QVBoxLayout, QHBoxLayout, QGridLayout, and QTabWidget. Ensure the program handles all pointers and SQLite configurations correctly.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="cpp-prompt-guide-container" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      <div className="bg-slate-50 border-b border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Qt Creator & C++ DSA Project Guide
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical mapping and optimized Copilot prompt for your VS Code development.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            <Terminal className="w-3 h-3 mr-1" />
            C++ / Qt 6
          </span>
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-2 mt-6">
          <button
            id="tab-arch-btn"
            onClick={() => setActiveTab("arch")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
              activeTab === "arch"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Qt / SQLite Architecture
          </button>
          <button
            id="tab-dsa-btn"
            onClick={() => setActiveTab("dsa")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
              activeTab === "dsa"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            DSA Mapping (STD List & Array)
          </button>
          <button
            id="tab-prompt-btn"
            onClick={() => setActiveTab("prompt")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1.5 ${
              activeTab === "prompt"
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Generate Copilot Prompt</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "arch" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Qt SQLite Database Blueprint</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Under the hood, Qt integrates with databases using the <code className="bg-white px-1 py-0.5 rounded border border-gray-200 text-red-500 font-mono">QSqlDatabase</code> class. To create tables safely at initialization, use transactional blocks inside a single helper function.
                </p>
                <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-3 rounded-lg overflow-x-auto leading-relaxed">
                  {`// db_manager.h
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>

bool initDatabase() {
    QSqlDatabase db = QSqlDatabase::addDatabase("QSQLITE");
    db.setDatabaseName("college_scheduler.db");
    if (!db.open()) return false;

    QSqlQuery q;
    // Create tables IF NOT EXISTS
    q.exec("CREATE TABLE IF NOT EXISTS departments ("
           "id TEXT PRIMARY KEY, name TEXT, durationYears INTEGER)");
    // Additional tables...
    return true;
}`}
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>CSV Parsing & Transactions</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  When dealing with file imports, a single error should revert all changes. This is achieved using SQLite transactions in Qt:
                </p>
                <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-3 rounded-lg overflow-x-auto leading-relaxed">
                  {`// Transaction handling in Qt C++
QSqlDatabase db = QSqlDatabase::database();
db.transaction(); // Start safe transaction

QSqlQuery query;
query.prepare("INSERT INTO instructors (id, name, username, password, maxHoursPerWeek) "
              "VALUES (?, ?, ?, ?, ?)");
// Loop over CSV rows...
if (error_occurred) {
    db.rollback(); // Rollback on error
    qDebug() << "CSV parsing failed. Reverted all changes.";
} else {
    db.commit(); // Commit all records
}`}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <span className="text-xs font-medium text-blue-800 block mb-1">Architecture Alignment</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                Notice how this layout maps exactly onto our interactive React prototype. Both the table structures and data relations inside this prototype simulate perfect relational integrity, preparing you directly for your C++ database queries.
              </p>
            </div>
          </div>
        )}

        {activeTab === "dsa" && (
          <div className="space-y-4">
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center space-x-2 mb-2">
                <Layers className="h-4 w-4 text-orange-500" />
                <span>DSA Alignment: Standard STL List & Plain Array Matrix</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                For a genuine college DSA course experience, we leverage basic, high-performance C++ structures:
                the **Standard List (<code className="font-mono text-red-500 bg-white px-1 py-0.5 rounded border border-gray-150">#include &lt;list&gt;</code>)** for dynamic sequences and **Plain 2D Multi-dimensional Arrays** to model schedule grids. Using <code className="font-mono bg-white px-1 rounded border">using namespace std;</code> ensures clean, direct namespace usage without cluttering.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">// Dynamic list of assignments</span>
                  {`#include <list>
#include <string>
using namespace std;

struct CourseAssignment {
    string id;
    string departmentId;
    int year;
    string section;
    string courseCode;
    string instructorId;
};

// Global assignment collection
list<CourseAssignment> assignmentsList;`}
                </div>

                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">// Grid Representation & Backtracking</span>
                  {`// 5 days (Mon-Fri) x 8 periods per day
// Store course identifier pointers or Structs
struct ScheduledClass {
    string courseCode;
    string instructorId;
    bool isLab;
};

// Plain array used in solver
ScheduledClass scheduleGrid[5][8] = {
    {{"", "", false}}
};`}
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white">
              <h5 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                The Heuristics and Constraints Solver Concept
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                The algorithm sorts blocks to schedule in descending order of size (**Lab block of 3 slots** placed before **Lecture blocks of 2 or 1**). During recursion, the backtracking search places blocks in available daily intervals. If placing a block causes an instructor collision or exceeds a section's schedule limits, the function automatically undoes the steps, registers conflict feedback details, and tests alternative periods.
              </p>
            </div>
          </div>
        )}

        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Click below to copy the Copilot prompt:
              </span>
              <button
                id="copy-copilot-prompt-btn"
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs transition duration-200 active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400 animate-pulse" />
                    <span>Copied! Ready for VS Code</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5" />
                    <span>Copy Copilot Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-950 p-4">
              <pre className="text-slate-300 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[380px] whitespace-pre-wrap select-all">
                {promptText}
              </pre>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>How to use this in VS Code:</strong> Open a new project in VS Code or Qt Creator, start standard empty files (<code className="font-mono bg-slate-100 p-0.5 rounded text-red-500">mainwindow.h</code>/<code className="font-mono bg-slate-100 p-0.5 rounded text-red-500">cpp</code>), open the GitHub Copilot Chat view, and paste this entire prompt. It will generate your entire UI file structures and DSA algorithms with perfect alignment to your dynamic React model.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
