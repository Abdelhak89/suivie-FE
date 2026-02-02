import { Routes, Route, Navigate, Form } from "react-router-dom";
import SidebarLayout from "./layout/SidebarLayout.jsx";

import GenericFePage from "./pages/GenericFePage.jsx";

import ManagerPage from "./pages/ManagerPage.jsx";
import AlerteQualitePage from "./pages/AlerteQualitePage.jsx";
import DerogationPage from "./pages/DerogationPage.jsx";
import KpiPage from "./pages/KpiPage.jsx";
import CliniqueQualitePage from "./pages/CliniqueQualitePage.jsx";
import AllFePage from "./pages/AllFePage.jsx";
import AccueilProfilsPage from "./pages/AccueilProfilsPage.jsx";
import QualiticienPage from "./pages/QualiticienPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route element={<SidebarLayout />}>
        {/* ✅ page d’accueil : profils */}
        <Route path="/" element={<Navigate to="/accueil" replace />} />
        <Route path="/accueil" element={<AccueilProfilsPage />} />

        {/* ✅ pages */}
        
        <Route path="/qualiticien/:slug" element={<QualiticienPage />} />
        <Route path="/manager" element={<ManagerPage />} />

        {/* ✅ pages FE (Excel-like) */}
        <Route path="/interne-serie" element={<GenericFePage pageKey="interne-serie" />} />
        <Route path="/interne-fai" element={<GenericFePage pageKey="interne-fai" titleOverride="Interne FAI" />} />
        <Route path="/client" element={<GenericFePage pageKey="client" />} />
        <Route path="/fournisseur" element={<GenericFePage pageKey="fournisseur" />} />

        <Route path="/derogation" element={<DerogationPage />} />
        <Route path="/kpi" element={<KpiPage />} />
        <Route path="/clinique-qualite" element={<CliniqueQualitePage />} />
        <Route path="/alerte-qualite" element={<AlerteQualitePage />} />
        <Route path="/all-FE" element = {<AllFePage/>}></Route>

        {/* ✅ 404 (NE PAS renvoyer Accueil/Dashboard ici) */}
        <Route path="*" element={<GenericFePage pageKey="404" titleOverride="404 - Not Found" />} />
      </Route>
    </Routes>
  );
}
