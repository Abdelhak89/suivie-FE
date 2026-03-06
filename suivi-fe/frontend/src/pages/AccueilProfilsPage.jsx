// src/pages/AccueilProfilsPage.jsx — Style Apple — clients par qualiticien
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setProfile } from "../lib/session";
import { PORTFOLIO_BY_QUALITICIEN, QUALITICIENS } from "../data/portfolio.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

// ─── CSS spécifique ───────────────────────────────────────────────────────────
const PAGE_CSS = `
.accueil-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.profil-card {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  font-family: ${T.font};
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow .15s, border-color .15s, transform .12s;
  width: 100%;
}
.profil-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.10);
  border-color: rgba(0,0,0,0.14);
  transform: translateY(-2px);
}
.profil-card.manager {
  border-color: rgba(255,159,10,0.3);
  background: #fffcf0;
}
.profil-card.manager:hover { border-color: #ff9f0a; }
.profil-card.all {
  border-color: rgba(0,113,227,0.25);
  background: rgba(0,113,227,0.04);
}
.profil-card.all:hover { border-color: ${T.accent}; }

.profil-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.profil-name {
  font-family: ${T.fontDisplay};
  font-size: 15px;
  font-weight: 700;
  color: ${T.textPrimary};
  margin-bottom: 10px;
  letter-spacing: -.2px;
}

.profil-clients {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 14px;
  min-height: 26px;
}
.client-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(0,113,227,0.08);
  color: ${T.accent};
  border: 1px solid rgba(0,113,227,0.15);
  font-variant-numeric: tabular-nums;
  letter-spacing: .3px;
}

.profil-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${T.border};
  margin-top: auto;
}
.profil-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.profil-cta {
  font-family: ${T.font};
  font-size: 12px;
  font-weight: 600;
  color: ${T.textLight};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color .12s;
}
.profil-card:hover .profil-cta { color: ${T.accent}; }
`;

function injectPageCSS() {
  if (document.getElementById("accueil-css")) return;
  const s = document.createElement("style"); s.id = "accueil-css";
  s.textContent = PAGE_CSS; document.head.appendChild(s);
}

// ─── Construction des profils depuis portfolio.js ─────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function buildProfiles() {
  const qualiticiens = QUALITICIENS.map(nom => ({
    slug:        slugify(nom),
    label:       nom,
    role:        "qualiticien",
    clientCodes: PORTFOLIO_BY_QUALITICIEN[nom] || [],
  }));
  return [
    ...qualiticiens,
    { slug: "responsable", label: "Responsable", role: "manager",     clientCodes: [], icon: "⚙️" },
    { slug: "toutes",      label: "Toutes les FE", role: "all",       clientCodes: [], icon: "🌐" },
  ];
}

// ─── Initiales avatar ─────────────────────────────────────────────────────────
function getInitials(label) {
  return label.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#e8f0fe", color: "#1a56a0" },
  { bg: "#e8fdf0", color: "#1a7a3f" },
  { bg: "#fff8ed", color: "#b45309" },
  { bg: "#f3e5f5", color: "#7b1fa2" },
  { bg: "#fce4ec", color: "#c62828" },
];

// ─── Composant ────────────────────────────────────────────────────────────────
export default function AccueilProfilsPage() {
  const nav      = useNavigate();
  const profiles = buildProfiles();

  useEffect(() => { injectGlobalCSS(); injectPageCSS(); }, []);

  const go = (p) => {
    setProfile({ slug: p.slug, label: p.label, role: p.role, clientCodes: p.clientCodes || [] });
    if (p.role === "manager") return nav("/manager",                    { replace: true });
    if (p.role === "all")     return nav("/all-fe",                     { replace: true });
    return nav(`/qualiticien/${p.slug}`,                               { replace: true });
  };

  const qualiticiens = profiles.filter(p => p.role === "qualiticien");
  const specials     = profiles.filter(p => p.role !== "qualiticien");

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", padding: "32px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 800, color: T.textPrimary, letterSpacing: "-.5px", marginBottom: 6 }}>
          Suivi F.E
        </div>
        <div style={{ fontSize: 14, color: T.textSecond }}>
          Choisissez votre profil pour accéder à vos fiches événements
        </div>
      </div>

      {/* Qualiticiens */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>
          Qualiticiens
        </div>
        <div className="accueil-grid">
          {qualiticiens.map((p, i) => {
            const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const codes = p.clientCodes || [];
            return (
              <button key={p.slug} className="profil-card" onClick={() => go(p)}>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div className="profil-avatar" style={{ background: av.bg, color: av.color }}>
                    <span style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 15 }}>
                      {getInitials(p.label)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="profil-name">{p.label}</div>
                    <div style={{ fontSize: 11, color: T.textSecond }}>
                      {codes.length} code{codes.length > 1 ? "s" : ""} client
                    </div>
                  </div>
                </div>

                {/* Codes clients */}
                <div className="profil-clients">
                  {codes.length > 0
                    ? codes.map(c => <span key={c} className="client-chip">{c}</span>)
                    : <span style={{ fontSize: 12, color: T.textLight, fontStyle: "italic" }}>Aucun code assigné</span>
                  }
                </div>

                <div className="profil-footer">
                  <span className="profil-badge" style={{ background: "#e8fdf0", color: "#1a7a3f" }}>
                    ✓ Qualiticien
                  </span>
                  <span className="profil-cta">Ouvrir →</span>
                </div>

              </button>
            );
          })}
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, background: T.border, margin: "24px 0" }} />

      {/* Accès spéciaux */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>
          Accès spéciaux
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {specials.map(p => {
            const isManager = p.role === "manager";
            return (
              <button key={p.slug} className={`profil-card ${p.role}`} onClick={() => go(p)}>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div className="profil-avatar" style={{
                    background: isManager ? "#fff8ed" : "#e8f0fe",
                    color:      isManager ? "#b45309" : T.accent,
                    fontSize: 20,
                  }}>
                    {p.icon || (isManager ? "⚙️" : "🌐")}
                  </div>
                  <div>
                    <div className="profil-name" style={{ marginBottom: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: T.textSecond }}>
                      {isManager ? "Gestion & assignation des FE" : "Vue complète sans filtre client"}
                    </div>
                  </div>
                </div>

                <div className="profil-footer">
                  <span className="profil-badge" style={{
                    background: isManager ? "#fff8ed" : "#e8f0fe",
                    color:      isManager ? "#b45309" : T.accent,
                  }}>
                    {isManager ? "Manager" : "Vue globale"}
                  </span>
                  <span className="profil-cta">Accéder →</span>
                </div>

              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}