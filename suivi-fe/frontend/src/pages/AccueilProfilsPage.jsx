import { useNavigate } from "react-router-dom";
import { setProfile } from "../lib/session";
import "../styles/app.css";

const PROFILES = [
  { slug: "blanquart-nicolas", label: "BLANQUART Nicolas", clientCodes: ["141","162","150","214","148","142","240"] },
  { slug: "brisdet-trystan", label: "BRISDET Trystan", clientCodes: ["151"] },
  { slug: "doby-sandrine", label: "DOBY Sandrine", clientCodes: ["193","393"] },
  { slug: "sanchez-wright-juliette", label: "SANCHEZ WRIGHT Juliette", clientCodes: ["182","162","150","214","154"] },
  { slug: "sdraulig-florence", label: "SDRAULIG Florence", clientCodes: ["141","148","143","250"] },
  { slug: "responsable", label: "Responsable", role: "manager" },
  { slug: "toutes", label: "Toutes les FE", role: "all" },
];

export default function AccueilProfilsPage() {
  const nav = useNavigate();

  const go = (p) => {
    setProfile({
      slug: p.slug,
      label: p.label,
      role: p.role || "qualiticien",
      clientCodes: p.clientCodes || [],
    });

    if (p.role === "manager") return nav("/manager", { replace: true });
    if (p.role === "all") return nav("/all-fe", { replace: true });
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

      {/* petite grille simple sans nouveau CSS: on utilise panel + boutons */}
      <div className="grid2">
        {PROFILES.map((p) => (
          <button key={p.slug} className="panel" onClick={() => go(p)} style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>{p.label}</div>

            <div className="sub" style={{ marginTop: 6 }}>
              {p.clientCodes?.length
                ? `Portefeuille : ${p.clientCodes.join(", ")}`
                : p.role === "manager"
                ? "Gérer portefeuilles / transferts"
                : "Aucun filtre client"}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "var(--primaryDark)" }}>
              {p.role === "manager" ? "Accès pages manager" : p.role === "all" ? "Vue globale" : "Ouvrir mes FE"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
