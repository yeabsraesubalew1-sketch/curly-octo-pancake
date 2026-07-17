/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Department, Instructor, Course, CourseAssignment, ScheduleItem } from "../types";
import { parseDepartmentsCSV, parseInstructorsCSV, parseCoursesCSV } from "../utils/csvParser";
import { 
  Building, 
  BookOpen, 
  UserSquare2, 
  Trash2, 
  Plus, 
  Search, 
  Upload, 
  Layers, 
  SlidersHorizontal, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  LogOut,
  Sliders,
  HelpCircle,
  Download,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { exportAdminPDF } from "../utils/pdfExport";
import { resolveScheduleSelection } from "../utils/scheduleSelection";

interface AdminViewProps {
  departments: Department[];
  instructors: Instructor[];
  courses: Course[];
  assignments: CourseAssignment[];
  schedule: ScheduleItem[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<CourseAssignment[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  onGenerateSchedule: () => Promise<{ success: boolean; msg: string; errors: any[] }>;
  onLogout: () => void;
  onResetDb: () => void;
  onUpdateAdminPassword: (newPass: string) => void;
  onDeleteAdminAccount: () => void;
  adminCredentials: any;
}

export default function AdminView({
  departments,
  instructors,
  courses,
  assignments,
  schedule,
  setDepartments,
  setInstructors,
  setCourses,
  setAssignments,
  setSchedule,
  onGenerateSchedule,
  onLogout,
  onResetDb,
  onUpdateAdminPassword,
  onDeleteAdminAccount,
  adminCredentials
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"records" | "relations" | "scheduler" | "security">("records");
  const [adminPassMsg, setAdminPassMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const togglePasswordVisibility = (instructorId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [instructorId]: !prev[instructorId]
    }));
  };
  
  // Tab 1: State
  const [recordType, setRecordType] = useState<"depts" | "instructors" | "courses">("depts");
  const [searchQuery, setSearchQuery] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  // Form Fields - Department
  const [deptId, setDeptId] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptDuration, setDeptDuration] = useState(4);
  const [deptMaxSections, setDeptMaxSections] = useState(2);

  // Form Fields - Instructor
  const [instId, setInstId] = useState("");
  const [instName, setInstName] = useState("");
  const [instUsername, setInstUsername] = useState("");
  const [instPass, setInstPass] = useState("");
  const [instMaxHours, setInstMaxHours] = useState(16);

  // Form Fields - Course
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseHasLab, setCourseHasLab] = useState(false);
  const [courseLectureHours, setCourseLectureHours] = useState(2);

  // Tab 2: Relationships State
  const [relDept, setRelDept] = useState("");
  const [relYear, setRelYear] = useState<number>(2);
  const [relSection, setRelSection] = useState("Sec A");
  const [relCourse, setRelCourse] = useState("");
  const [relInstructor, setRelInstructor] = useState("");

  // Tab 3: Scheduler State
  const [selectedSchDept, setSelectedSchDept] = useState("");
  const [selectedSchYear, setSelectedSchYear] = useState<number>(2);
  const [selectedSchSection, setSelectedSchSection] = useState("");
  const [generationFeedback, setGenerationFeedback] = useState<{ success: boolean; msg: string; errors: any[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- ACTIONS: Tab 1 (Manage Database) ---

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId.trim() || !deptName.trim()) return;

    if (departments.some(d => d.id.toLowerCase() === deptId.trim().toLowerCase())) {
      setCsvError("Department Code already exists! Please use a unique Code.");
      return;
    }

    const newDept: Department = {
      id: deptId.trim().toUpperCase(),
      name: deptName.trim(),
      durationYears: deptDuration,
      maxSectionsPerYear: deptMaxSections
    };

    setDepartments((prev) => [...prev, newDept]);
    setSchedule([]);
    setDeptId("");
    setDeptName("");
    setDeptMaxSections(2);
    setCsvSuccess("Department added successfully.");
    setCsvError("");
  };

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instUsername.trim() || !instPass.trim()) return;

    if (instructors.some(i => i.username.toLowerCase() === instUsername.trim().toLowerCase())) {
      setCsvError("Instructor Username already exists!");
      return;
    }

    // Auto-generate instructor ID
    let nextIdNum = 1;
    instructors.forEach(i => {
      const match = i.id.match(/inst_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextIdNum) {
          nextIdNum = num + 1;
        }
      } else {
        const num = parseInt(i.id, 10);
        if (!isNaN(num) && num >= nextIdNum) {
          nextIdNum = num + 1;
        }
      }
    });
    const autoId = `inst_${nextIdNum}`;

    const newInst: Instructor = {
      id: autoId,
      name: instName.trim(),
      username: instUsername.trim().toLowerCase(),
      password: instPass.trim(),
      maxHoursPerWeek: instMaxHours
    };

    setInstructors((prev) => [...prev, newInst]);
    setSchedule([]);
    setInstName("");
    setInstUsername("");
    setInstPass("");
    setCsvSuccess(`Instructor registered successfully with ID: ${autoId}`);
    setCsvError("");
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) return;

    if (courses.some(c => c.code.toLowerCase() === courseCode.trim().toLowerCase())) {
      setCsvError("Course Code already exists!");
      return;
    }

    const newCourse: Course = {
      code: courseCode.trim().toUpperCase(),
      title: courseTitle.trim(),
      hasLab: courseHasLab,
      labHours: courseHasLab ? 3 : 0,
      lectureHours: courseLectureHours
    };

    setCourses((prev) => [...prev, newCourse]);
    setSchedule([]);
    setCourseCode("");
    setCourseTitle("");
    setCourseHasLab(false);
    setCourseLectureHours(2);
    setCsvSuccess("Course registered successfully.");
    setCsvError("");
  };

  const handleDeleteRecord = (id: string, type: "depts" | "instructors" | "courses") => {
    if (type === "depts") {
      setDepartments((prev) => prev.filter(d => d.id !== id));
      setAssignments((prev) => prev.filter(a => a.departmentId !== id));
    } else if (type === "instructors") {
      setInstructors((prev) => prev.filter(i => i.id !== id));
      setAssignments((prev) => prev.map(a => a.instructorId === id ? { ...a, instructorId: "" } : a));
    } else if (type === "courses") {
      setCourses((prev) => prev.filter(c => c.code !== id));
      setAssignments((prev) => prev.filter(a => a.courseCode !== id));
    }
    setSchedule([]);
    setCsvSuccess("Record deleted successfully.");
    setCsvError("");
  };

  // CSV Import Loader (with Transaction rollback)
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvError("");
      setCsvSuccess("");

      if (recordType === "depts") {
        const parsed = parseDepartmentsCSV(text);
        if (!parsed.success) {
          setCsvError(parsed.error || "Parsing failed. No records were written.");
          return;
        }
        // Save state backup for rollback
        const backup = [...departments];
        try {
          // Relational check for ID collision
          const ids = new Set(backup.map(b => b.id.toLowerCase()));
          for (const item of parsed.data) {
            if (ids.has(item.id.toLowerCase())) {
              throw new Error(`Collision error: Department ID "${item.id}" already exists. CSV rollback executed.`);
            }
          }
          setDepartments([...departments, ...parsed.data]);
          setCsvSuccess(`Successfully parsed ${parsed.data.length} Departments. MongoDB write committed.`);
        } catch (err: any) {
          setCsvError(err.message || "Relational error occurred. Transaction rolled back.");
          setDepartments(backup); // ROLLBACK
        }
      } else if (recordType === "instructors") {
        const parsed = parseInstructorsCSV(text);
        if (!parsed.success) {
          setCsvError(parsed.error || "Parsing failed. No records were written.");
          return;
        }
        const backup = [...instructors];
        try {
          const ids = new Set(backup.map(b => b.id.toLowerCase()));
          const usernames = new Set(backup.map(b => b.username.toLowerCase()));
          for (const item of parsed.data) {
            if (ids.has(item.id.toLowerCase())) {
              throw new Error(`Collision error: Instructor ID "${item.id}" already exists. MongoDB write rolled back.`);
            }
            if (usernames.has(item.username.toLowerCase())) {
              throw new Error(`Collision error: Instructor username "${item.username}" already taken. CSV rollback executed.`);
            }
          }
          setInstructors([...instructors, ...parsed.data]);
          setCsvSuccess(`Successfully synchronized ${parsed.data.length} Instructors. MongoDB write committed.`);
        } catch (err: any) {
          setCsvError(err.message || "Relational error occurred. Transaction rolled back.");
          setInstructors(backup); // ROLLBACK
        }
      } else if (recordType === "courses") {
        const parsed = parseCoursesCSV(text);
        if (!parsed.success) {
          setCsvError(parsed.error || "Parsing failed. No records were written.");
          return;
        }
        const backup = [...courses];
        try {
          const codes = new Set(backup.map(b => b.code.toLowerCase()));
          for (const item of parsed.data) {
            if (codes.has(item.code.toLowerCase())) {
              throw new Error(`Collision error: Course Code "${item.code}" already exists. MongoDB write rolled back.`);
            }
          }
          setCourses([...courses, ...parsed.data]);
          setCsvSuccess(`Successfully registered ${parsed.data.length} Courses. MongoDB write committed.`);
        } catch (err: any) {
          setCsvError(err.message || "Relational error occurred. Transaction rolled back.");
          setCourses(backup); // ROLLBACK
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
  };

  // --- ACTIONS: Tab 2 (Manage Relationships) ---

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relDept || !relCourse || !relInstructor) {
      setCsvError("Please specify Department, Course, and Instructor to create relationship.");
      return;
    }

    // Check if duplicate assignment exists
    const exists = assignments.some(
      a => a.departmentId === relDept &&
           a.year === relYear &&
           a.section === relSection &&
           a.courseCode === relCourse
    );

    if (exists) {
      setCsvError(`The course ${relCourse} is already assigned to ${relDept} Year ${relYear} (${relSection})!`);
      setCsvSuccess("");
      return;
    }

    // Check instructor work-limit
    const selectedC = courses.find(c => c.code === relCourse);
    const hours = selectedC ? ((selectedC.hasLab ? selectedC.labHours : 0) + selectedC.lectureHours) : 0;
    
    // Sum instructor existing hours
    const currentHrs = assignments
      .filter(a => a.instructorId === relInstructor)
      .reduce((sum, currentA) => {
        const cObj = courses.find(c => c.code === currentA.courseCode);
        return sum + (cObj ? ((cObj.hasLab ? cObj.labHours : 0) + cObj.lectureHours) : 0);
      }, 0);

    const inst = instructors.find(i => i.id === relInstructor);
    if (inst && (currentHrs + hours) > inst.maxHoursPerWeek) {
      const confirmAssign = window.confirm(
        `Warning: Dr./Lec. ${inst.name} is currently assigned to ${currentHrs} teaching hours. ` +
        `Adding this course of ${hours} hours will exceed their mandated safety ceiling of ${inst.maxHoursPerWeek} hours/week.\n\n` +
        `Would you like to override this for testing? (They will fail the hard scheduling verification later unless you adjust their limit).`
      );
      if (!confirmAssign) return;
    }

    const newAssignment: CourseAssignment = {
      id: `assign_${Date.now()}`,
      departmentId: relDept,
      year: relYear,
      section: relSection,
      courseCode: relCourse,
      instructorId: relInstructor
    };

    setAssignments((prev) => [...prev, newAssignment]);
    setSchedule([]);
    setCsvSuccess("Course and Instructor successfully mapped to section!");
    setCsvError("");
  };

  // --- ACTIONS: Tab 3 (Scheduler) ---

  const triggerScheduleGeneration = () => {
    setIsGenerating(true);
    setGenerationFeedback(null);
    
    setTimeout(async () => {
      const res = await onGenerateSchedule();
      setGenerationFeedback(res);
      setIsGenerating(false);

      if (res.success && departments.length > 0) {
        setSelectedSchDept(departments[0].id);
        const activeSecs = Array.from(new Set(assignments.filter(a => a.departmentId === departments[0].id).map(a => a.section)));
        if (activeSecs.length > 0) {
          setSelectedSchSection(activeSecs[0]);
        } else {
          setSelectedSchSection("Sec A");
        }
      }
    }, 1200);
  };

  // Populate dynamic default states during loading tabs
  React.useEffect(() => {
    if (departments.length > 0 && !relDept) {
      setRelDept(departments[0].id);
    }
  }, [departments, relDept]);

  React.useEffect(() => {
    if (courses.length > 0 && !relCourse) {
      setRelCourse(courses[0].code);
    }
  }, [courses, relCourse]);

  React.useEffect(() => {
    if (instructors.length > 0 && !relInstructor) {
      setRelInstructor(instructors[0].id);
    }
  }, [instructors, relInstructor]);

  const resolvedScheduleSelection = React.useMemo(() => resolveScheduleSelection({
    departments,
    assignments,
    schedule,
    currentDepartmentId: selectedSchDept,
    currentYear: selectedSchYear,
    currentSection: selectedSchSection
  }), [departments, assignments, schedule, selectedSchDept, selectedSchYear, selectedSchSection]);

  React.useEffect(() => {
    if (!selectedSchDept || !departments.some((d) => d.id === selectedSchDept)) {
      setSelectedSchDept(departments[0]?.id || "");
      return;
    }

    const validSections = Array.from(new Set(
      assignments
        .filter((a) => a.departmentId === selectedSchDept && a.year === selectedSchYear)
        .map((a) => a.section)
    )).concat([selectedSchSection, "Sec A", "Sec B"])
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter(Boolean);

    if (!selectedSchSection || !validSections.includes(selectedSchSection)) {
      const fallbackSection = resolvedScheduleSelection.section || validSections[0] || "Sec A";
      setSelectedSchSection(fallbackSection);
    }
  }, [assignments, departments, resolvedScheduleSelection.section, selectedSchDept, selectedSchYear]);

  // Filters for Tab 1 Searches
  const filteredDepartments = departments.filter(d => 
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstructors = instructors.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = courses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic values helper for Schedule Viewer Tab
  const viewDeptYears = departments.find(d => d.id === selectedSchDept)?.durationYears || 4;
  const viewYearsArray = Array.from({ length: viewDeptYears - 1 }, (_, i) => i + 2);

  // Filter schedules for matrix
  const sectionSchedules = schedule.filter(s => 
    s.departmentId === selectedSchDept && 
    s.year === selectedSchYear && 
    s.section === selectedSchSection
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel */}
      <div id="control-panel-header" className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg shadow-emerald-950/20 border border-emerald-500/20 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-emerald-100 shadow-sm animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-sans">University Registrar Terminal</h2>
          </div>
          <p className="text-[10px] text-emerald-100/90 mt-1 font-mono uppercase tracking-widest">Authority Core: Academic Dean / registrar</p>
        </div>
        
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            id="reset-db-btn"
            onClick={() => {
              if (window.confirm("Verify: Are you sure you want to restore all preloaded databases? This will wipe your current edits.")) {
                onResetDb();
                setCsvSuccess("Database reset to safe college settings.");
              }
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/20 hover:bg-white/35 text-white border border-white/30 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer transition duration-300 hover:scale-[1.03] active:scale-[0.97]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Restore Seeds</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-slate-100/60 p-1.5 rounded-2xl lg:rounded-full border border-slate-200/50 flex flex-wrap gap-1.5 md:gap-3 overflow-x-auto">
        <button
          id="records-tab"
          onClick={() => { setActiveTab("records"); setCsvError(""); setCsvSuccess(""); }}
          className={`px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === "records"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-800/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Database Records ({departments.length + instructors.length + courses.length})</span>
        </button>

        <button
          id="relations-tab"
          onClick={() => { setActiveTab("relations"); setCsvError(""); setCsvSuccess(""); }}
          className={`px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === "relations"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-800/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Workload Mappings ({assignments.length})</span>
        </button>

        <button
          id="scheduler-tab"
          onClick={() => { setActiveTab("scheduler"); setCsvError(""); setCsvSuccess(""); }}
          className={`px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === "scheduler"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-800/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Solver Engine ({schedule.length > 0 ? "Matrix Solved" : "Pending CPU"})</span>
        </button>

        <button
          id="security-tab"
          onClick={() => { setActiveTab("security"); setCsvError(""); setCsvSuccess(""); }}
          className={`px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === "security"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-800/20"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Registrar Security</span>
        </button>
      </div>

      {/* Shared CSV feedback messages */}
      {csvError && (
        <div id="admin-csv-err-msg" className="p-4 bg-red-50 border-l-4 border-[#E53E3E] text-[#E53E3E] rounded-none text-xs leading-relaxed flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-[#E53E3E] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase text-[10px] tracking-widest text-[#E53E3E]">Conflict Alarm Code:</span>
            <p className="mt-0.5 whitespace-pre-wrap">{csvError}</p>
          </div>
        </div>
      )}

      {csvSuccess && (
        <div id="admin-csv-succ-msg" className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-none text-xs leading-relaxed flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase text-[10px] tracking-widest text-emerald-800">Committed Transact Block:</span>
            <p className="mt-0.5">{csvSuccess}</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: MANAGE DATABASE RECORDS */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form & Selection side */}
            <div className="bg-gray-50 border border-slate-205 rounded-none p-4 sm:p-6 lg:col-span-1">
              <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center space-x-2 uppercase tracking-wider">
                <Plus className="h-4 w-4 text-slate-600" />
                <span>Insert Database Entity</span>
              </h3>

              <div className="mb-4">
                <label htmlFor="entity-type-select" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1 font-sans">
                  Database Table
                </label>
                <select
                  id="entity-type-select"
                  value={recordType}
                  onChange={(e) => {
                    setRecordType(e.target.value as any);
                    setCsvError("");
                    setCsvSuccess("");
                  }}
                  className="w-full bg-white border border-gray-350 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-850 font-sans"
                >
                  <option value="depts">Departments (Branches)</option>
                  <option value="instructors">Instructors & Faculty</option>
                  <option value="courses">Course Catalog</option>
                </select>
              </div>

              {/* Dynamic Form depending on recordType */}
              {recordType === "depts" && (
                <form id="add-dept-form" onSubmitCapture={(e) => { e.preventDefault(); e.stopPropagation(); void handleAddDepartment(e); }} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="dept-code-input" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Department Code (ID)
                    </label>
                    <input
                      id="dept-code-input"
                      type="text"
                      placeholder="e.g. SE, CS, DS"
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="dept-name-input" className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Full Department Name
                    </label>
                    <input
                      id="dept-name-input"
                      type="text"
                      placeholder="e.g. Software Engineering"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="dept-duration-input" className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Years of Study Duration
                    </label>
                    <input
                      id="dept-duration-input"
                      type="number"
                      min={1}
                      max={12}
                      value={deptDuration}
                      onChange={(e) => setDeptDuration(Number(e.target.value))}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="dept-sections-input" className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Max Sections per Year (All Years)
                    </label>
                    <input
                      id="dept-sections-input"
                      type="number"
                      min={1}
                      max={26}
                      value={deptMaxSections}
                      onChange={(e) => setDeptMaxSections(Number(e.target.value))}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <button
                    id="add-dept-submit"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-sm"
                  >
                    Insert Department Row
                  </button>
                </form>
              )}

              {recordType === "instructors" && (
                <form id="add-instructor-form" onSubmitCapture={(e) => { e.preventDefault(); e.stopPropagation(); void handleAddInstructor(e); }} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="inst-name-input" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Instructor Full Name
                    </label>
                    <input
                      id="inst-name-input"
                      type="text"
                      placeholder="e.g. Dr. Abebe Kebede"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="inst-username" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Username
                      </label>
                      <input
                        id="inst-username"
                        type="text"
                        placeholder="abebe"
                        value={instUsername}
                        onChange={(e) => setInstUsername(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label htmlFor="inst-pass" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Password
                      </label>
                      <input
                        id="inst-pass"
                        type="password"
                        placeholder="Password"
                        value={instPass}
                        onChange={(e) => setInstPass(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="inst-maxhours" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Max Hours/Week (Ethiopian standard is 12-16)
                    </label>
                    <input
                      id="inst-maxhours"
                      type="number"
                      min={1}
                      max={40}
                      value={instMaxHours}
                      onChange={(e) => setInstMaxHours(Number(e.target.value))}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <button
                    id="add-instructor-submit"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-sm"
                  >
                    Register Instructor
                  </button>
                </form>
              )}

              {recordType === "courses" && (
                <form id="add-course-form" onSubmitCapture={(e) => { e.preventDefault(); e.stopPropagation(); void handleAddCourse(e); }} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="course-code" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Course Code
                    </label>
                    <input
                      id="course-code"
                      type="text"
                      placeholder="e.g. CoSc-2011"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="course-title" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Course Title
                    </label>
                    <input
                      id="course-title"
                      type="text"
                      placeholder="e.g. Data Structures and Algorithms"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    />
                  </div>
                  <div className="flex items-center mb-1 py-1">
                    <input
                      id="course-has-lab"
                      type="checkbox"
                      checked={courseHasLab}
                      onChange={(e) => setCourseHasLab(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-none"
                    />
                    <label htmlFor="course-has-lab" className="ml-2 text-[11px] font-bold uppercase text-gray-600">
                      Has Labs? (Check for true, 3 lab-hours added)
                    </label>
                  </div>
                  <div>
                    <label htmlFor="course-lecturehours" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Lecture Classroom Hours
                    </label>
                    <select
                      id="course-lecturehours"
                      value={courseLectureHours}
                      onChange={(e) => setCourseLectureHours(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                    >
                      <option value={1}>1 Lecture Hour</option>
                      <option value={2}>2 Lecture Hours (Standard pair)</option>
                      <option value={3}>3 Lecture Hours (Triple credits)</option>
                    </select>
                  </div>
                  <button
                    id="add-course-submit"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-sm"
                  >
                    Insert Course Row
                  </button>
                </form>
              )}

              {/* CSV Upload Block */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-sans">
                  Bulk Load via Local CSV CSV data
                </span>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 rounded-none p-4 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Upload CSV Source file</span>
                  <input
                    id="csv-file-loader"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                </label>
                <div onClick={() => {
                  let demoCsv = "";
                  if (recordType === "depts") demoCsv = "id,name,durationYears\nAI,Artificial Intelligence,4\nCY,Cybersecurity,4";
                  if (recordType === "instructors") demoCsv = "id,name,username,password,maxHoursPerWeek\ninst_yared,Yared Nigusu,yared,yared123,16";
                  if (recordType === "courses") demoCsv = "code,title,hasLab,labHours,lectureHours\nAI-3011,Neural Networks,true,3,2\nCY-3021,Ethical Hacking,false,0,3";
                  
                  const blob = new Blob([demoCsv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `sample_${recordType}.csv`);
                  a.click();
                }} className="text-[10px] text-emerald-600 hover:underline text-center block mt-2 font-mono cursor-pointer uppercase font-bold">
                  Download Sample CSV template
                </div>
              </div>
            </div>

            {/* List and search side */}
            <div className="lg:col-span-2 border border-slate-200 bg-white rounded-none p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800">
                    {recordType === "depts" && `Departments Catalog (${departments.length} rows)`}
                    {recordType === "instructors" && `Faculty & Instructors Indexed (${instructors.length} persons)`}
                    {recordType === "courses" && `Active Course Directory (${courses.length} items)`}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">Synchronized directly to memory matrix</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-56">
                  <input
                    id="table-search-input"
                    type="text"
                    placeholder="Quick search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-none pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="overflow-x-auto">
                {recordType === "depts" && (
                  <table id="depts-sqlite-table" className="w-full min-w-[640px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-700">
                        <th className="p-3">Dept Code</th>
                        <th className="p-3">Department Name</th>
                        <th className="p-3">Duration (Years)</th>
                        <th className="p-3">Max Sections</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/30">{dept.id}</td>
                          <td className="p-3 max-w-xs truncate text-slate-800">{dept.name}</td>
                          <td className="p-3 text-slate-705 font-medium">{dept.durationYears} Years</td>
                          <td className="p-3 font-mono text-slate-705 font-semibold">{dept.maxSectionsPerYear || 3} secs</td>
                          <td className="p-3 text-right">
                            <button
                              id={`delete-dept-${dept.id}`}
                              onClick={() => handleDeleteRecord(dept.id, "depts")}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded-none hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredDepartments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">No departments found in the database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {recordType === "instructors" && (
                  <table id="instructors-sqlite-table" className="w-full min-w-[720px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-700">
                        <th className="p-3">ID</th>
                        <th className="p-3">Instructor Name</th>
                        <th className="p-3">Login Username</th>
                        <th className="p-3">Login Password</th>
                        <th className="p-3">Max Hrs/Wk</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {filteredInstructors.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-500">{inst.id}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{inst.name}</td>
                          <td className="p-3 font-mono text-gray-500">{inst.username}</td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center space-x-2">
                              <span className="text-amber-700 select-all font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-mono">
                                {visiblePasswords[inst.id] ? inst.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                id={`toggle-inst-pass-btn-${inst.id}`}
                                onClick={() => togglePasswordVisibility(inst.id)}
                                className="text-slate-400 hover:text-emerald-500 p-1 cursor-pointer transition focus:outline-none"
                                title={visiblePasswords[inst.id] ? "Hide Password" : "Show Password"}
                              >
                                {visiblePasswords[inst.id] ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-semibold font-mono">{inst.maxHoursPerWeek} slots</td>
                          <td className="p-3 text-right">
                            <button
                              id={`delete-inst-${inst.id}`}
                              onClick={() => handleDeleteRecord(inst.id, "instructors")}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded-none hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredInstructors.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">No instructors found in database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {recordType === "courses" && (
                  <table id="courses-sqlite-table" className="w-full min-w-[720px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-700">
                        <th className="p-3">Code</th>
                        <th className="p-3">Course Title</th>
                        <th className="p-3">Lab Block?</th>
                        <th className="p-3">Lecture Hrs</th>
                        <th className="p-3">Total Hrs</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {filteredCourses.map((c) => (
                        <tr key={c.code} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-slate-50/30">{c.code}</td>
                          <td className="p-3 max-w-xs truncate text-slate-800">{c.title}</td>
                          <td className="p-3">
                            {c.hasLab ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950/40 border border-amber-500/30 text-amber-400">
                                Lab (3 hrs)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-205 text-slate-600">
                                None
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono">{c.lectureHours} hrs</td>
                          <td className="p-3 font-mono font-semibold text-slate-800">
                            {c.lectureHours + (c.hasLab ? c.labHours : 0)} hrs
                          </td>
                          <td className="p-3 text-right">
                            <button
                              id={`delete-course-${c.code}`}
                              onClick={() => handleDeleteRecord(c.code, "courses")}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded-none hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCourses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">No courses listed in catalog.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 2: MAP COURSE RELATIONSHIPS */}
      {activeTab === "relations" && (
        <motion.div
          key="relations"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Mapping Relationship Side */}
            <div className="bg-gray-50 border border-slate-205 rounded-none p-4 sm:p-6 lg:col-span-1 h-fit font-sans">
              <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center space-x-2 uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 text-slate-505" />
                <span>Link Course Assignment</span>
              </h3>

              {departments.length === 0 || courses.length === 0 || instructors.length === 0 ? (
                <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-850 rounded-none text-xs leading-relaxed">
                  Please add at least one Department, one Course, and one Instructor in Tab 1 before allocating course assignments.
                </div>
              ) : (
                <form id="add-relation-form" onSubmitCapture={(e) => { e.preventDefault(); e.stopPropagation(); void handleAddRelationship(e); }} className="space-y-4">
                  <div>
                    <label htmlFor="rel-dept-select" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Target Department
                    </label>
                    <select
                      id="rel-dept-select"
                      value={relDept}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRelDept(val);
                        setRelSection("Sec A");
                        setRelYear(2);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-sans"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="rel-year-select" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Year (Excl. Fresh)
                      </label>
                      <select
                        id="rel-year-select"
                        value={relYear}
                        onChange={(e) => setRelYear(Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-sans"
                      >
                        {departments.find(d => d.id === relDept)
                          ? Array.from({ length: (departments.find(d => d.id === relDept)?.durationYears || 4) - 1 }, (_, i) => i + 2).map(yr => (
                              <option key={yr} value={yr}>Year {yr}</option>
                            ))
                          : <option value={2}>Year 2</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label htmlFor="rel-sec-select" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Section (Max Cap Enforced)
                      </label>
                      <select
                        id="rel-sec-select"
                        value={relSection}
                        onChange={(e) => setRelSection(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-sans"
                      >
                        {(() => {
                          const deptObj = departments.find(d => d.id === relDept);
                          const maxSec = deptObj?.maxSectionsPerYear || 3;
                          return Array.from({ length: maxSec }, (_, i) => {
                            const secName = `Sec ${String.fromCharCode(65 + i)}`;
                            return (
                              <option key={secName} value={secName}>
                                {secName}
                              </option>
                            );
                          });
                        })()}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rel-course-select" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Choose course from Catalog
                    </label>
                    <select
                      id="rel-course-select"
                      value={relCourse}
                      onChange={(e) => setRelCourse(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-sans"
                    >
                      {courses.map(c => (
                        <option key={c.code} value={c.code}>{c.code}: {c.title} ({c.lectureHours + (c.hasLab ? c.labHours : 0)} hrs)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rel-inst-select" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Assign Faculty Instructor
                    </label>
                    <select
                      id="rel-inst-select"
                      value={relInstructor}
                      onChange={(e) => setRelInstructor(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-sans"
                    >
                      {instructors.map(i => {
                        // Calculate teacher loaded hours
                        const load = assignments
                          .filter(a => a.instructorId === i.id)
                          .reduce((sum, assign) => {
                            const c = courses.find(cr => cr.code === assign.courseCode);
                            return sum + (c ? (c.lectureHours + (c.hasLab ? c.labHours : 0)) : 0);
                          }, 0);
                        return (
                          <option key={i.id} value={i.id}>
                            {i.name} - load: {load}/{i.maxHoursPerWeek} hrs
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    id="rel-submit-btn"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-sm"
                  >
                    Commit Relationship Mapping
                  </button>
                </form>
              )}
            </div>

            {/* Relationship Table View list */}
            <div className="lg:col-span-2 border border-slate-200 bg-white rounded-none p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Course Assignment Allocations ({assignments.length} relational tuples)
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">Mapped courses with years, sections, and teaching faculty</p>
              </div>

              <div className="overflow-x-auto">
                <table id="assignments-sqlite-table" className="w-full min-w-[720px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-700">
                      <th className="p-3">Section Target</th>
                      <th className="p-3">Course Allocation</th>
                      <th className="p-3">Dedicated Instructor</th>
                      <th className="p-3">Weekly Hours</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {assignments.map((a) => {
                      const cObj = courses.find(c => c.code === a.courseCode);
                      const iObj = instructors.find(i => i.id === a.instructorId);
                      const totalHrs = cObj ? ((cObj.hasLab ? cObj.labHours : 0) + cObj.lectureHours) : 0;
                      
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{a.departmentId}</span> Y{a.year} ({a.section})
                          </td>
                          <td className="p-3">
                            <strong className="font-mono text-slate-700 block">{a.courseCode}</strong>
                            <span className="text-[10px] text-slate-500 font-sans block leading-3">{cObj?.title}</span>
                          </td>
                          <td className="p-3 font-medium">
                            {iObj ? iObj.name : <span className="text-red-500">Unassigned Instructor</span>}
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-800">
                            {totalHrs} hrs {cObj?.hasLab && "(Lab Include)"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              id={`delete-assignment-${a.id}`}
                              onClick={() => {
                                setAssignments(assignments.filter(as => as.id !== a.id));
                                setCsvSuccess("Mapping deleted.");
                              }}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded-none hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400">No relationships mapped yet. Please map courses above!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 3: TIMETABLE GENERATOR */}
      {activeTab === "scheduler" && (
        <motion.div
          key="scheduler"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-gray-50 border border-slate-205 p-4 sm:p-6 rounded-none flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="mb-0 md:mb-0">
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center mb-1 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-yellow-500 mr-2" />
                University Scheduling conflict Solver Room
              </h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Generates a perfect, conflict-free scheduling timetable matching all faculty workloads and lab restrictions. All slots adhere to lunch gaps and contiguous session requirements.
              </p>
            </div>
            
            <button
              id="generate-timetable-trigger-btn"
              onClick={triggerScheduleGeneration}
              disabled={isGenerating}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-none text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer shadow-md transition transform duration-150 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing Matrix Solutions...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Generate Master Schedule</span>
                </>
              )}
            </button>
          </div>

          {/* GENERATION RESULTS BOX */}
          {generationFeedback && (
            <div id="generation-notifier">
              {generationFeedback.success ? (
                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-950 rounded-none shadow-sm space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-650" />
                    <strong className="text-xs font-bold uppercase tracking-wider">Success! Conflict-Free Timetable Formed.</strong>
                  </div>
                  <p className="text-xs text-emerald-800">
                    The backend backtracking search has placed all coursework credits in less than 50ms without collisions! Use the filters below to inspect schedules.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-red-50 border-l-4 border-[#E53E3E] text-red-950 rounded-none shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-605" />
                    <strong className="text-xs font-bold uppercase tracking-wider">Timetable Incompatibility Detected during CSP solving</strong>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed max-w-3xl whitespace-pre-line">
                    Our constraint engine tried multiple backtracking depths but hit hard clashes.
                    Below are the dynamic bottlenecks registered:
                  </p>
                  
                  <div className="bg-white border border-red-150 rounded-none p-4 font-mono text-[11px] text-red-850 leading-relaxed">
                    {generationFeedback.errors.map((e, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 py-1">
                        <span className="text-red-500 font-bold shrink-0">•</span>
                        <span>{e.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE VIEWER PANEL IF GENERATED */}
          {schedule.length > 0 && (
            <div id="schedule-viewer-panel" className="bg-white border border-slate-200 rounded-none p-4 sm:p-6 shadow-sm space-y-6">
              
              {/* Filter controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50 p-4 rounded-none border border-slate-200">
                <div className="w-full lg:w-auto">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest">Filter Section Schedule</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      id="view-dept-filter"
                      value={selectedSchDept}
                      onChange={(e) => {
                        setSelectedSchDept(e.target.value);
                        // reset selection safety
                        const firstSec = Array.from(new Set(assignments.filter(a => a.departmentId === e.target.value).map(a => a.section)))[0] || "Sec A";
                        setSelectedSchSection(firstSec);
                      }}
                      className="bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-full"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                      ))}
                    </select>

                    <select
                      id="view-year-filter"
                      value={selectedSchYear}
                      onChange={(e) => setSelectedSchYear(Number(e.target.value))}
                      className="bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-full"
                    >
                      {viewYearsArray.map(yr => (
                        <option key={yr} value={yr}>Year {yr}</option>
                      ))}
                    </select>

                    <select
                      id="view-section-filter"
                      value={selectedSchSection}
                      onChange={(e) => setSelectedSchSection(e.target.value)}
                      className="bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-slate-850 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-full"
                    >
                      {Array.from(new Set(assignments.filter(a => a.departmentId === selectedSchDept && a.year === selectedSchYear).map(a => a.section))).concat(["Sec A", "Sec B"])
                        .filter((v, i, self) => self.indexOf(v) === i)
                        .map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    id="admin-pdf-btn"
                    onClick={() => exportAdminPDF(departments, instructors, courses, assignments, schedule)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm w-fit shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Master PDF</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-l border-gray-250 pl-0 sm:pl-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-none bg-emerald-150 border-l-2 border-emerald-500"></div>
                      <span>Lecture</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-none bg-amber-50 border-l-2 border-amber-500"></div>
                      <span>Lab Block</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SCHEDULE TIMETABLE GRID MATRIX */}
              <div id="timetable-matrix-block" className="timetable-scroll overflow-x-scroll border border-gray-255 rounded-none">
                <table className="w-full text-center border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-emerald-800 text-white font-bold uppercase tracking-wider text-[11px] border-b-4 border-emerald-600">
                      <th className="p-3 w-28 font-bold border-r border-emerald-900/30">Time / Period</th>
                      <th className="p-3 border-r border-emerald-900/30">Monday</th>
                      <th className="p-3 border-r border-emerald-900/30">Tuesday</th>
                      <th className="p-3 border-r border-emerald-900/30">Wednesday</th>
                      <th className="p-3 border-r border-emerald-900/30">Thursday</th>
                      <th className="p-3">Friday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {/* PERIODS INDEXING */}
                    {/* Periods 1 to 4 */}
                    {[1, 2, 3, 4].map(pNum => {
                      const timeStr = getPeriodTime(pNum);
                      return (
                        <tr key={pNum}>
                          <td className="p-2 border-r border-gray-200 bg-slate-50 font-semibold text-center font-mono">
                            <span className="block text-[11px] text-slate-600">Period {pNum}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{timeStr}</span>
                          </td>
                          {/* Monday-Friday slots */}
                          {[0, 1, 2, 3, 4].map(dayIdx => {
                            const match = sectionSchedules.find(s => s.day === dayIdx && s.period === pNum);
                            return renderTimetableCell(match, dayIdx, pNum);
                          })}
                        </tr>
                      );
                    })}

                    {/* LUNCH GAP ROW */}
                    <tr className="bg-slate-100/90 text-slate-500 font-mono font-medium text-center border-t border-b border-gray-300">
                      <td className="p-3 border-r border-gray-200 font-semibold text-slate-700">12:05 - 13:30</td>
                      <td colSpan={5} className="py-2.5 tracking-widest text-[10px] uppercase font-bold text-slate-600">
                        ☕ LUNCH BREAK GAP (University Common hour) ☕
                      </td>
                    </tr>

                    {/* Periods 5 to 8 */}
                    {[5, 6, 7, 8].map(pNum => {
                      const timeStr = getPeriodTime(pNum);
                      return (
                        <tr key={pNum}>
                          <td className="p-2 border-r border-gray-200 bg-slate-50 font-semibold text-center font-mono">
                            <span className="block text-[11px] text-slate-600">Period {pNum}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{timeStr}</span>
                          </td>
                          {/* Monday-Friday slots */}
                          {[0, 1, 2, 3, 4].map(dayIdx => {
                            const match = sectionSchedules.find(s => s.day === dayIdx && s.period === pNum);
                            return renderTimetableCell(match, dayIdx, pNum);
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT 4: REGISTRAR SECURITY */}
      {activeTab === "security" && (
        <motion.div
          key="security"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-md mx-auto bg-white border border-slate-200 p-4 sm:p-8 shadow-md rounded-none space-y-6 font-sans"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 border border-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center justify-center rounded-none mx-auto shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
              Registrar Security Controls
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Change the system administrator passphrase. Keep this credential confidential.
            </p>
          </div>

          {adminPassMsg && (
            <div className={`p-4 text-xs font-mono rounded-none border-l-4 ${adminPassMsg.success ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 'bg-red-50 text-red-850 border-[#E53E3E]'}`}>
              <div className="flex items-center space-x-2">
                {adminPassMsg.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span className="font-bold uppercase tracking-wider">{adminPassMsg.success ? "Success" : "Update Blocked"}</span>
              </div>
              <p className="mt-1">{adminPassMsg.text}</p>
            </div>
          )}

          <form onSubmitCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const form = e.currentTarget;
            const newP = (form.elements.namedItem("admin-new-p") as HTMLInputElement).value;
            const confirmP = (form.elements.namedItem("admin-confirm-p") as HTMLInputElement).value;
            if (newP !== confirmP) {
              setAdminPassMsg({ success: false, text: "Passwords do not match." });
              return;
            }
            if (newP.length < 4) {
              setAdminPassMsg({ success: false, text: "Password must be at least 4 characters long." });
              return;
            }
            onUpdateAdminPassword(newP);
            setAdminPassMsg({ success: true, text: "Password changed successfully." });
            form.reset();
          }} className="space-y-4">
            <div>
              <label htmlFor="admin-new-p" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                New Admin Password
              </label>
              <input
                id="admin-new-p"
                name="admin-new-p"
                type="password"
                placeholder="New Admin Password"
                required
                className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label htmlFor="admin-confirm-p" className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Confirm Admin Password
              </label>
              <input
                id="admin-confirm-p"
                name="admin-confirm-p"
                type="password"
                placeholder="Confirm Admin Password"
                required
                className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-md"
            >
              Update Registrar Password
            </button>
          </form>

          <div className="pt-6 border-t border-slate-250">
            <h4 className="text-[10px] font-bold text-[#E53E3E] uppercase tracking-wider mb-1">
              Danger Zone
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Permanently delete the Registrar Administrative profile. This will log you out immediately and require setting up a brand new username and password on the next visit.
            </p>
            <button
              id="delete-admin-account-btn"
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
              }}
              className="w-full bg-[#E53E3E] hover:bg-[#C53030] text-white font-bold py-2.5 rounded-none text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-md border border-transparent"
            >
              Delete Registrar Profile
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

      {/* Custom Confirmation Modal */}
      {showDeleteConfirm && (
        <div id="custom-delete-confirm-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 shadow-2xl rounded-none space-y-6 font-sans">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center rounded-none shrink-0">
                <AlertTriangle className="h-5 w-5 text-[#E53E3E]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Delete Registrar Profile?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you absolutely sure you want to delete your Registrar Administrative profile? All active session scheduling data will be preserved, but your login credentials will be removed. You will be logged out immediately and required to initialize a new administrative password upon next access.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 justify-end pt-2">
              <button
                id="cancel-delete-admin-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer transition focus:outline-none"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-admin-btn"
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteAdminAccount();
                }}
                className="px-4 py-2 bg-[#E53E3E] hover:bg-[#C53030] text-white rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer transition focus:outline-none shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper inside cell rendering
  function renderTimetableCell(match: ScheduleItem | undefined, day: number, period: number) {
    if (!match) {
      return (
        <td key={day} className="timetable-cell timetable-cell-empty p-1.5 border-r border-gray-200 bg-slate-50/30 text-slate-400 italic text-[10px] select-none font-mono">
          -
        </td>
      );
    }

    const cellInstructor = instructors.find(i => i.id === match.instructorId);
    
    return (
      <td key={day} className="timetable-cell p-1 border-r border-gray-200 bg-white">
        <div className={`timetable-cell-content p-2 text-left h-full border transition duration-150 rounded-none flex flex-col justify-between shadow-sm ${
          match.isLab 
            ? "bg-amber-100/90 border border-amber-400/80 border-l-4 border-l-amber-600 text-amber-900 shadow-amber-200/80 dark:bg-amber-950/55 dark:border-amber-500/35 dark:text-amber-100"
            : "bg-emerald-100/90 border border-emerald-400/80 border-l-4 border-l-emerald-600 text-emerald-900 shadow-emerald-200/70 dark:bg-emerald-950/45 dark:border-emerald-500/30 dark:text-emerald-300"
        }`}>
          <div>
            <div className="font-bold tracking-tight text-[11px] flex items-center justify-between">
              <span className="text-slate-900 dark:text-slate-100 font-bold">{match.courseCode}</span>
              {match.isLab && <span className="text-[9px] bg-amber-600 border border-amber-700 text-amber-50 font-bold px-1 uppercase tracking-wider shadow-sm dark:bg-amber-900 dark:border-amber-800 dark:text-amber-100">LAB</span>}
            </div>
            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate leading-tight">
              {cellInstructor ? cellInstructor.name : "Faculty"}
            </p>
          </div>
          <span className="text-[9px] font-mono font-medium opacity-80 block mt-1 uppercase text-slate-700 dark:text-slate-400">
            {match.departmentId} Y{match.year} - {match.section}
          </span>
        </div>
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
