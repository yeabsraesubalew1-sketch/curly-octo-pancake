/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Department, CourseAssignment } from "../types";
import { GraduationCap, Shield, User, Loader2, KeyRound, CalendarClock } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth, Role } from "../context/AuthContext";

export default function LoginView() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [allAssignments, setAllAssignments] = useState<CourseAssignment[]>([]);
  const [adminInitialized, setAdminInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");

  const loadBootstrapData = React.useCallback(async () => {
    setBootstrapLoading(true);
    setBootstrapError("");

    try {
      const [deps, assignments, status] = await Promise.all([
        api.get<Department[]>("/departments", false),
        api.get<CourseAssignment[]>("/assignments", false),
        api.get<{ adminInitialized: boolean }>("/auth/status", false),
      ]);

      setDepartments(deps);
      setAllAssignments(assignments);
      setAdminInitialized(status.adminInitialized);
    } catch {
      setDepartments([]);
      setAllAssignments([]);
      setAdminInitialized(false);
      setBootstrapError("Unable to load login data. Check server status and retry.");
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  // Load public data needed for the login form (no auth required yet)
  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await loadBootstrapData();
      } catch {
        if (!mounted) return;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadBootstrapData]);

  const onLoginSuccess = (role: Role, data: any, token: string) => {
    login(role, data, token);
    navigate(`/${role}`, { replace: true });
  };

  const onInitializeAdmin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any }>("/auth/admin/setup", { username, password }, false);
      onLoginSuccess("admin", res.user, res.token);
    } catch (err) {
      const shouldAttemptLogin =
        (err instanceof ApiError && err.status === 409) ||
        (err instanceof Error && !(err instanceof ApiError));

      if (shouldAttemptLogin) {
        try {
          const loginRes = await api.post<{ token: string; user: any }>(
            "/auth/admin/login",
            { username, password },
            false,
          );
          onLoginSuccess("admin", loginRes.user, loginRes.token);
          return;
        } catch {
          // Fall through to the original error message below.
        }
      }

      setLoginError(
        err instanceof ApiError
          ? err.message
          : "Server is restarting or temporarily unavailable. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  const [role, setRole] = useState<"admin" | "student" | "instructor">("student");
  
  // Admin credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Student dropdown selections
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(2);
  const [selectedSection, setSelectedSection] = useState("Sec A");
  
  // Get years for the selected department
  const currentDeptObj = departments.find(d => d.id === selectedDept);
  const maxYears = currentDeptObj ? currentDeptObj.durationYears : 4;
  const availableYears = Array.from({ length: maxYears - 1 }, (_, i) => i + 2); // Exclude Year 1 as freshman

  // Dynamically fetch active sections from current assignments, or default to standard A/B
  const [availableSections, setAvailableSections] = useState<string[]>(["Sec A", "Sec B"]);

  useEffect(() => {
    if (departments.length > 0 && (!selectedDept || !departments.some((dept) => dept.id === selectedDept))) {
      setSelectedDept(departments[0].id);
    }
  }, [departments, selectedDept]);

  useEffect(() => {
    // Collect active sections for the selected dept + year to prevent dead selectors, default to Sec A/Sec B
    if (selectedDept) {
      const activeSecs = allAssignments
        .filter(a => a.departmentId === selectedDept && a.year === selectedYear)
        .map(a => a.section);
      const uniqueSecs = Array.from(new Set(activeSecs));
      if (uniqueSecs.length > 0) {
        setAvailableSections(uniqueSecs);
        setSelectedSection(uniqueSecs[0]);
      } else {
        setAvailableSections(["Sec A", "Sec B"]);
        setSelectedSection("Sec A");
      }
    }
  }, [selectedDept, selectedYear, allAssignments]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      if (role === "admin") {
        const res = await api.post<{ token: string; user: any }>("/auth/admin/login", { username, password }, false);
        onLoginSuccess("admin", res.user, res.token);
      } else if (role === "instructor") {
        const res = await api.post<{ token: string; user: any }>("/auth/instructor/login", { username, password }, false);
        onLoginSuccess("instructor", res.user, res.token);
      }
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bootstrapLoading) {
      setLoginError("Please wait while departments are loading.");
      return;
    }
    if (!selectedDept) {
      setLoginError("Please select a department first.");
      return;
    }
    setLoginError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any }>(
        "/auth/student/login",
        { departmentId: selectedDept, year: selectedYear, section: selectedSection },
        false
      );
      onLoginSuccess("student", res.user, res.token);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : "Could not open the timetable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-panel" className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-teal-950/40 overflow-hidden mt-8 md:mt-16 transition-all duration-300">
      {/* Visual Header - Flowy Gradient style with beautiful rounded details */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-500 px-6 py-8 text-center text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 animate-pulse duration-5000">
          <CalendarClock className="h-40 w-40" />
        </div>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
          <CalendarClock className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold font-sans tracking-tight uppercase">EduSched</h2>
        <p className="text-[10px] text-teal-100 mt-1 font-mono uppercase tracking-widest opacity-90">College Scheduling System</p>
      </div>

      <div className="p-6 md:p-8">
        {/* Role Selector Radio Group with Flowy styling */}
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 font-sans">
          Select Faculty Portal
        </label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            id="role-student-btn"
            type="button"
            onClick={() => { setRole("student"); setLoginError(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer hover:scale-[1.03] ${
              role === "student"
                ? "bg-emerald-950/40 border-2 border-emerald-500/80 text-emerald-400 shadow-sm shadow-emerald-950/50"
                : "bg-slate-800/40 hover:bg-slate-800/60 border-slate-700/60 text-slate-400"
            }`}
          >
            <User className="h-4 w-4 mb-1" />
            <span className="text-[10px]">Student</span>
          </button>
          
          <button
            id="role-instructor-btn"
            type="button"
            onClick={() => { setRole("instructor"); setLoginError(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer hover:scale-[1.03] ${
              role === "instructor"
                ? "bg-emerald-950/40 border-2 border-emerald-500/80 text-emerald-400 shadow-sm shadow-emerald-950/50"
                : "bg-slate-800/40 hover:bg-slate-800/60 border-slate-700/60 text-slate-400"
            }`}
          >
            <GraduationCap className="h-4 w-4 mb-1" />
            <span className="text-[10px]">Instructor</span>
          </button>

          <button
            id="role-admin-btn"
            type="button"
            onClick={() => { setRole("admin"); setLoginError(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer hover:scale-[1.03] ${
              role === "admin"
                ? "bg-emerald-950/40 border-2 border-emerald-500/80 text-emerald-400 shadow-sm shadow-emerald-950/50"
                : "bg-slate-800/40 hover:bg-slate-800/60 border-slate-700/60 text-slate-400"
            }`}
          >
            <Shield className="h-4 w-4 mb-1" />
            <span className="text-[10px]">Registrar</span>
          </button>
        </div>

        {/* Display feedback errors with secondary danger colors */}
        {loginError && (
          <div id="login-error-alert" className="mb-4 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl text-xs font-mono leading-relaxed shadow-sm">
            <span className="font-bold block uppercase text-[10px]">Login Error:</span>
            <span>{loginError}</span>
          </div>
        )}

        {bootstrapError && (
          <div className="mb-4 p-3.5 bg-amber-950/40 border-l-4 border-amber-500 text-amber-200 rounded-r-xl text-xs font-mono leading-relaxed shadow-sm">
            <span className="font-bold block uppercase text-[10px]">System Notice:</span>
            <span>{bootstrapError}</span>
            <button
              type="button"
              onClick={() => void loadBootstrapData()}
              className="mt-2 inline-flex items-center rounded-full border border-amber-400/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-100 hover:bg-amber-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {bootstrapLoading && (
          <div className="mb-4 p-3.5 bg-slate-900/60 border border-slate-700 text-slate-200 rounded-xl text-xs font-mono flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Loading departments and access settings...</span>
          </div>
        )}

        {/* Form rendering */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {role === "student" ? (
              <motion.div
                key="student"
                initial={{ opacity: 0, x: -22, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 22, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <form id="student-login-form" onSubmit={handleStudentSubmit} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="dept-select" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Department
                    </label>
                    <select
                      id="dept-select"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      disabled={bootstrapLoading || departments.length === 0}
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                    >
                      {bootstrapLoading && <option value="">Loading departments...</option>}
                      {!bootstrapLoading && departments.length === 0 && <option value="">No departments available</option>}
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.id}) - {dept.durationYears} Years
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year-select" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                        Year
                      </label>
                      <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            Year {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="section-select" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                        Section / Stream
                      </label>
                      <select
                        id="section-select"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                      >
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="student-view-schedule-btn"
                      type="submit"
                      disabled={loading || bootstrapLoading || departments.length === 0}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                      <span>{loading ? "Opening..." : "View Timetable"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (role === "admin" && adminInitialized === false) ? (
              <motion.div
                key="admin-setup"
                initial={{ opacity: 0, x: -22, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 22, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <form id="admin-setup-form" onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const userVal = (form.elements.namedItem("setup-username") as HTMLInputElement).value.trim();
                  const passVal = (form.elements.namedItem("setup-password") as HTMLInputElement).value;
                  const confirmVal = (form.elements.namedItem("setup-confirm") as HTMLInputElement).value;

                  if (passVal !== confirmVal) {
                    setLoginError("Passwords do not match.");
                    return;
                  }
                  if (passVal.length < 4) {
                    setLoginError("Password must be at least 4 characters long.");
                    return;
                  }
                  onInitializeAdmin(userVal, passVal);
                  setLoginError("");
                }} className="space-y-4 font-sans">
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/50 text-emerald-200 rounded-xl text-xs leading-relaxed shadow-sm">
                    <strong>Account Setup Required:</strong> No Administrator account exists. Please initialize the Administrator account now.
                  </div>

                  <div>
                    <label htmlFor="setup-username" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Username
                    </label>
                    <input
                      id="setup-username"
                      name="setup-username"
                      type="text"
                      defaultValue="admin"
                      required
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="setup-password" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Password
                    </label>
                    <input
                      id="setup-password"
                      name="setup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="setup-confirm" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Confirm Password
                    </label>
                    <input
                      id="setup-confirm"
                      name="setup-confirm"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      id="admin-setup-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      <span>{loading ? "Setting up..." : "Initialize Registrar Account"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={`auth-${role}`}
                initial={{ opacity: 0, x: role === "admin" ? 20 : -20, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: role === "admin" ? -20 : 20, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <form id="auth-login-form" onSubmit={handleLoginSubmit} className="space-y-4 font-sans">
                  <div>
                    <label htmlFor="username-input" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Username
                    </label>
                    <input
                      id="username-input"
                      type="text"
                      placeholder={role === "admin" ? "e.g. admin" : "e.g. abebe"}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="password-input" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                      />
                      <div className="absolute right-3.5 top-3.5 text-emerald-400">
                        <KeyRound className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="auth-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>{loading ? "Signing in..." : role === "admin" ? "Login as an Admin" : "Login as an Instructor"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
