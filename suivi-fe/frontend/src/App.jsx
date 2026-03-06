import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./layout/SidebarLayout.jsx";

import InterneSeriePage from "./pages/InterneSeriePage.jsx";
import FournisseurPage from "./pages/FournisseurPage.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import InterneFAI from "./pages/InterneFAI.jsx"; // ✅ composant dédié FAI

import ManagerPage from "./pages/ManagerPage.jsx";
import AlerteQualitePage from "./pages/AlerteQualitePage.jsx";
import DerogationPage from "./pages/DerogationPage.jsx";
import KpiPage from "./pages/KpiPage.jsx";
import CliniqueQualitePage from "./pages/CliniqueQualitePage.jsx";
import AllFePage from "./pages/AllFePage.jsx";
import AccueilProfilsPage from "./pages/AccueilProfilsPage.jsx";
import QualiticienPage from "./pages/QualiticienPage.jsx";
import DeclarationFEPage from "./pages/DeclarationFEPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route element={<SidebarLayout />}>
        <Route path="/" element={<Navigate to="/accueil" replace />} />
        <Route path="/accueil" element={<AccueilProfilsPage />} />

        <Route path="/qualiticien/:slug" element={<QualiticienPage />} />
        <Route path="/manager" element={<ManagerPage />} />

        <Route path="/interne-serie" element={<InterneSeriePage />} />
        <Route path="/fournisseur" element={<FournisseurPage />} />
        <Route path="/client" element={<ClientPage />} />

        {/* ✅ FAI → composant dédié avec filtre is_dvi */}
        <Route path="/interne-fai" element={<InterneFAI />} />

        <Route path="/derogation" element={<DerogationPage />} />
        <Route path="/kpi" element={<KpiPage />} />
        <Route path="/clinique-qualite" element={<CliniqueQualitePage />} />
        <Route path="/alerte-qualite" element={<AlerteQualitePage />} />
        <Route path="/all-fe" element={<AllFePage />} />
        <Route path="/declaration-fe" element={<DeclarationFEPage />} />

        <Route path="*" element={<div style={{padding:32}}>404 - Page introuvable</div>} />
      </Route>
    </Routes>
  );
}