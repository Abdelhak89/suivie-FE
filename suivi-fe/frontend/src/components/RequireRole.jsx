// frontend/src/components/RequireRole.jsx
import { Navigate } from "react-router-dom";
import { getSession } from "../auth/auth";

export default function RequireRole({ role, children }) {
  const s = getSession();
  if (!s) return <Navigate to="/login" replace />;
  if (role && s.role !== role) return <Navigate to="/login" replace />;
  return children;
}
