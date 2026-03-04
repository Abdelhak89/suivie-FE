// src/pages/AccueilProfilsPage.jsx
import { useNavigate } from "react-router-dom";
import { setProfile } from "../lib/session";
import "../styles/app.css";

const PROFILES = [
  { slug: "blanquart-nicolas",      label: "BLANQUART Nicolas",       clientCodes: ["141","162","150","214","148","142","240"] },
  { slug: "brisdet-trystan",        label: "BRISDET Trystan",         clientCodes: ["151"] },
  { slug: "doby-sandrine",          label: "DOBY Sandrine",           clientCodes: ["193","393"] },
  { slug: "sanchez-wright-juliette",label: "SANCHEZ WRIGHT Juliette", clientCodes: ["182","162","150","214","154"] },
  { slug: "sdraulig-florence",      label: "SDRAULIG Florence",       clientCodes: ["141","148","143","250"] },
  { slug: "responsable",            label: "Responsable",             role: "manager" },
  { slug: "toutes",                 label: "Toutes les FE",           role: "all" },
];

export default function AccueilProfilsPage() {
  const nav = useNavigate();

  const go = (p) => {
    setProfile({ slug: p.slug, label: p.label, role: p.role || "qualiticien", clientCodes: p.clientCodes || [] });
    if (p.role === "manager") return nav("/manager", { replace: true });
    if (p.role === "all")     return nav("/all-fe",  { replace: true });
    return nav(`/qualiticien/${p.slug}`, { replace: true });
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Choisir un profil</h2>
          <div className="sub">Sélection = filtre automatique des FE</div>
        </div>
        <span className="badge badgeBlue">Clinique Qualité</span>
      </div>

      <div className="grid3">
        {PROFILES.map((p) => (
          <button
            key={p.slug}
            className="navCard"
            onClick={() => go(p)}
            style={{ textAlign: "left", background: "var(--surface)" }}
          >
            <div className="navCard__title">{p.label}</div>
            <div className="navCard__sub">
              {p.clientCodes?.length
                ? `Portefeuille : ${p.clientCodes.join(", ")}`
                : p.role === "manager" ? "Gérer portefeuilles / transferts" : "Aucun filtre client"}
            </div>
            <div style={{ marginTop: 10 }}>
              <span className={`badge ${p.role === "manager" ? "badgeAmber" : p.role === "all" ? "badgeBlue" : "badgeGreen"}`}>
                {p.role === "manager" ? "Accès manager" : p.role === "all" ? "Vue globale" : "Ouvrir mes FE"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
