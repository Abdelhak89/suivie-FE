// src/components/RoleRoute.jsx
import { Navigate } from "react-router-dom";

/**
 * Props:
 *  - roles: string[] — rôles autorisés ex: ["responsable", "admin"]
 *  - children: JSX
 * Redirige vers /accueil si le rôle du user connecté n'est pas dans la liste
 */
export default function RoleRoute({ roles, children }) {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("kep_user")); }
    catch { return null; }
  })();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/accueil" replace />;
  }

  return children;
}