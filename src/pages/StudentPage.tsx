/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import StudentView from "../components/StudentView";
import { useAuth } from "../context/AuthContext";
import { useAcademicData } from "../hooks/useAcademicData";
import { Loader2 } from "lucide-react";

export default function StudentPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { schedule, instructors, courses, assignments, loading, error } = useAcademicData();

  const handleBack = () => {
    logout();
    window.dispatchEvent(new Event("edusched:logout-request"));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-mono uppercase tracking-widest">Loading your timetable...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}
      <StudentView
        studentData={session?.data}
        schedule={schedule}
        instructors={instructors}
        courses={courses}
        assignments={assignments}
        onBack={handleBack}
      />
    </div>
  );
}
