/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginView from "./components/LoginView";
import AdminPage from "./pages/AdminPage";
import StudentPage from "./pages/StudentPage";
import InstructorPage from "./pages/InstructorPage";
import { CalendarClock, MoonStar, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type HealthStatus = "operational" | "degraded" | "offline" | "starting" | "unknown";
type ThemeMode = "dark" | "light";

interface HealthPayload {
  status: HealthStatus;
  db?: {
    state?: HealthStatus;
    mode?: "mongodb" | "fallback" | "unknown";
    message?: string;
  };
}

interface ToastMessage {
  id: number;
  type: "success" | "error" | "warning";
  text: string;
}

function RootRedirect() {
  const { session } = useAuth();
  if (session) return <Navigate to={`/${session.role}`} replace />;
  return <Navigate to="/login" replace />;
}

function AppShell() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = React.useState<HealthPayload>({ status: "unknown" });
  const [checkingHealth, setCheckingHealth] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const [theme, setTheme] = React.useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("edusched-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const pushToast = React.useCallback((type: ToastMessage["type"], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const refreshHealth = React.useCallback(async (showToast = false) => {
    if (showToast) {
      pushToast("warning", "Checking system status...");
    }

    setCheckingHealth(true);
    try {
      const res = await fetch(showToast ? "/api/health?retry=1" : "/api/health", { cache: "no-store" });
      if (!res.ok) {
        const nextHealth: HealthPayload = {
          status: "offline",
          db: {
            state: "offline",
            mode: "unknown",
            message: `Health check failed with status ${res.status}.`,
          },
        };
        setHealth(nextHealth);
        return nextHealth;
      }

      const data = (await res.json()) as HealthPayload;
      setHealth(data);
      return data;
    } catch {
      const nextHealth: HealthPayload = {
        status: "offline",
        db: {
          state: "offline",
          mode: "unknown",
          message: "Server is unreachable.",
        },
      };
      setHealth(nextHealth);
      return nextHealth;
    } finally {
      setCheckingHealth(false);
    }
  }, [pushToast]);

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      logout();
      pushToast("success", "Logged out successfully.");
      window.requestAnimationFrame(() => {
        navigate("/login", { replace: true });
      });

      window.setTimeout(() => {
        if (window.location.pathname !== "/login") {
          pushToast("warning", "Navigation stalled. Returning to the login screen.");
          window.location.assign("/login");
        }
      }, 250);
    } catch {
      pushToast("error", "Logout encountered a problem. Please reload if the session does not clear.");
      window.location.assign("/login");
    } finally {
      window.setTimeout(() => setIsLoggingOut(false), 500);
    }
  }, [isLoggingOut, logout, navigate, pushToast]);

  React.useEffect(() => {
    void refreshHealth();
    const intervalId = window.setInterval(() => {
      void refreshHealth();
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [refreshHealth]);

  React.useEffect(() => {
    const onLogoutRequest = () => {
      void handleLogout();
    };

    window.addEventListener("edusched:logout-request", onLogoutRequest);
    return () => window.removeEventListener("edusched:logout-request", onLogoutRequest);
  }, [handleLogout]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("edusched-theme", theme);
  }, [theme]);

  const effectiveHealthStatus = health.db?.state ?? health.status;
  const isOperational = effectiveHealthStatus === "operational";
  const statusLabel =
    effectiveHealthStatus === "operational"
      ? "Operational"
      : effectiveHealthStatus === "degraded"
        ? health.db?.mode === "fallback"
          ? "Degraded (Fallback)"
          : "Degraded"
        : effectiveHealthStatus === "offline"
          ? "Offline"
          : effectiveHealthStatus === "starting"
            ? "Starting"
            : "Unknown";

  const statusDescription = health.db?.message || (effectiveHealthStatus === "degraded"
    ? "The system is running in fallback mode."
    : "The system is currently unavailable.");

  const statusColorClass =
    effectiveHealthStatus === "operational"
      ? "bg-emerald-500"
      : effectiveHealthStatus === "degraded"
        ? "bg-amber-400"
        : "bg-rose-500";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
      {/* Floating Translucent Capsule Top Navigation Bar */}
      <header className={`backdrop-blur-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 py-3 sm:px-6 md:px-8 md:py-4 sticky top-2 sm:top-4 mx-2 sm:mx-4 md:mx-8 my-2 z-50 shadow-xl rounded-2xl border shrink-0 transition-colors duration-200 ${theme === "dark"
        ? "bg-slate-900/50 text-white border-white/10 shadow-teal-950/20"
        : "bg-white/80 text-slate-900 border-slate-200/70 shadow-slate-300/50"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center rounded-xl shrink-0 shadow-md">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm md:text-lg font-bold tracking-tight uppercase flex flex-wrap items-center gap-1.5 leading-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              EduSched <span className={`font-light text-xs md:text-sm font-sans ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>Academic Flow</span>
            </h1>
            <span className={`text-[9px] font-mono block mt-0.5 tracking-wider uppercase leading-none ${theme === "dark" ? "text-teal-300" : "text-teal-700"}`}>College Scheduling Portal</span>
          </div>
        </div>

        <div className="flex flex-wrap items-start sm:items-center justify-end gap-2 sm:gap-3 md:gap-5">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-wider transition w-full sm:w-auto ${theme === "dark"
              ? "border-white/15 bg-slate-800/70 text-slate-100 hover:bg-slate-700/80"
              : "border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <MoonStar className="h-3.5 w-3.5" />}
          </button>
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right min-w-0">
            <span className={`text-[8px] md:text-[9px] uppercase font-semibold tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>System State</span>
            <span className={`text-[10px] md:text-xs font-mono font-bold flex items-center gap-1 ${isOperational ? (theme === "dark" ? "text-emerald-400" : "text-emerald-600") : (theme === "dark" ? "text-rose-300" : "text-rose-600")}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusColorClass} ${checkingHealth ? "animate-pulse" : ""}`}></span>
              {statusLabel}
            </span>
            <span className={`text-[9px] max-w-[190px] truncate ${isOperational ? (theme === "dark" ? "text-slate-400" : "text-slate-500") : (theme === "dark" ? "text-rose-200/90" : "text-rose-700")}`}>
              {statusDescription}
            </span>
          </div>
          {!isOperational && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => void refreshHealth(true)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider transition ${theme === "dark"
                  ? "bg-slate-800/80 border border-white/20 text-white hover:bg-slate-700"
                  : "bg-white/90 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {checkingHealth ? "Checking..." : "Retry"}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider bg-rose-600/90 text-white hover:bg-rose-500 transition"
              >
                Reload
              </button>
            </div>
          )}
          {session && (
            <button
              id="global-logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-4 py-2 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider transition-all duration-300 text-white cursor-pointer shadow-md shadow-red-200/50 hover:shadow-red-300/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className={`flex-grow max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-8 transition-colors duration-200 ${theme === "dark" ? "" : "bg-transparent"}`}>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={session ? `dashboard-${session.role}` : "login"}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={session ? `${theme === "dark" ? "bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl shadow-slate-950/30" : "bg-white/70 backdrop-blur-2xl border border-slate-200/70 rounded-3xl p-4 md:p-8 shadow-2xl shadow-slate-300/40"}` : ""}
            >
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={session ? <Navigate to={`/${session.role}`} replace /> : <LoginView />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role="student">
                      <StudentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor"
                  element={
                    <ProtectedRoute role="instructor">
                      <InstructorPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Transparent Floating Footer Details */}
      <footer className={`py-4 px-3 sm:px-6 md:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[10px] font-mono tracking-wider shrink-0 bg-transparent transition-colors duration-200 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
        <div>EduSched Scheduling System</div>
        <div className="hidden sm:block">All rights reserved — © 2026</div>
        <div>Status: Active</div>
      </footer>

      <div className="fixed top-20 right-2 sm:top-24 sm:right-4 z-[60] space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-[320px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[220px] max-w-full sm:min-w-[240px] px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "warning"
                  ? "bg-amber-950/90 border-amber-500/40 text-amber-200"
                  : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
