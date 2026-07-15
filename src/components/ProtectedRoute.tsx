/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";

export default function ProtectedRoute({
  role,
  children
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role) {
    return <Navigate to={`/${session.role}`} replace />;
  }

  return <>{children}</>;
}
