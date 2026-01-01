import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { isAdminEmail } from "../utils/adminConfig";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return <Navigate to="/" replace />;

  // Only check admin if required
  if (requireAdmin && !isAdminEmail(user.email)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
