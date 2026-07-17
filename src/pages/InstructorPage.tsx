/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import InstructorView from "../components/InstructorView";
import { useAuth } from "../context/AuthContext";
import { useAcademicData } from "../hooks/useAcademicData";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

export default function InstructorPage() {
  const { session } = useAuth();
  const { schedule, courses, assignments, loading, error } = useAcademicData();

  const handleLogout = () => {
    window.dispatchEvent(new Event("edusched:logout-request"));
  };

  const handleUpdatePassword = async (newPass: string) => {
    await api.put(`/auth/instructor/${session?.data.id}/password`, { newPassword: newPass });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-mono uppercase tracking-widest">Loading your teaching load...</span>
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
      <InstructorView
        instructor={session?.data}
        schedule={schedule}
        courses={courses}
        assignments={assignments}
        onLogout={handleLogout}
        onUpdatePassword={handleUpdatePassword}
      />
    </div>
  );
}
