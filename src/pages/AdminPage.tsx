/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import AdminView from "../components/AdminView";
import { useAuth } from "../context/AuthContext";
import { useAcademicData } from "../hooks/useAcademicData";
import { api } from "../lib/api";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const {
    departments,
    instructors,
    courses,
    assignments,
    schedule,
    loading,
    error,
    setDepartments,
    setInstructors,
    setCourses,
    setAssignments,
    setSchedule,
    generateSchedule,
    resetDb
  } = useAcademicData();

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("edusched:logout-request"));
  };

  const handleResetDb = async () => {
    await resetDb();
    handleLogout();
  };

  const handleUpdateAdminPassword = async (newPass: string) => {
    await api.put("/auth/admin/password", { newPassword: newPass });
  };

  const handleDeleteAdminAccount = async () => {
    await api.delete("/auth/admin");
    handleLogout();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-mono uppercase tracking-widest">Loading academic data...</span>
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
      <AdminView
        departments={departments}
        instructors={instructors}
        courses={courses}
        assignments={assignments}
        schedule={schedule}
        setDepartments={setDepartments}
        setInstructors={setInstructors}
        setCourses={setCourses}
        setAssignments={setAssignments}
        setSchedule={setSchedule}
        onGenerateSchedule={generateSchedule}
        onLogout={handleLogout}
        onResetDb={handleResetDb}
        adminCredentials={session?.data}
        onUpdateAdminPassword={handleUpdateAdminPassword}
        onDeleteAdminAccount={handleDeleteAdminAccount}
      />
    </div>
  );
}
