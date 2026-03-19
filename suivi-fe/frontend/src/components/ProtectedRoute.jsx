// components/ProtectedRoute.jsx
// Redirige vers /login si pas de token valide
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("kep_token");
  if (!token) return <Navigate to="/login" replace />;

  // Vérifie expiration
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("kep_token");
      localStorage.removeItem("kep_user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}