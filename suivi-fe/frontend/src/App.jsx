import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./layout/SidebarLayout.jsx";

import GenericFePage from "./pages/GenericFePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";
import AlerteQualitePage from "./pages/AlerteQualitePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<SidebarLayout />}>
        {/* ✅ page d’accueil */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* ✅ page manager */}
        <Route path="/manager" element={<ManagerPage />} />

        {/* ✅ pages FE (Excel-like) */}
        <Route
          path="/interne-serie"
          element={<GenericFePage pageKey="interne-serie" />}
        />
        <Route
          path="/interne-fai"
          element={
            <GenericFePage pageKey="interne-fai" titleOverride="Interne FAI" />
          }
        />
        <Route path="/client" element={<GenericFePage pageKey="client" />} />
        <Route
          path="/fournisseur"
          element={<GenericFePage pageKey="fournisseur" />}
        />
        <Route
          path="/derogation"
          element={<GenericFePage pageKey="derogation" titleOverride="Dérogation" />}
        />
        <Route path="/kpi" element={<GenericFePage pageKey="kpi" titleOverride="KPI" />} />
        
        <Route
          path="/clinique-qualite"
          element={
            <GenericFePage pageKey="clinique-qualite" titleOverride="Clinique SUI" />
          }
        />
        <Route path="/alerte-qualite" element={<AlerteQualitePage />} />

        {/* 404 */}
        <Route
          path="*"
          element={<GenericFePage pageKey="404" titleOverride="404 - Not Found" />}
        />
      </Route>
    </Routes>
  );
}
