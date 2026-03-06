// src/layouts/SidebarLayout.jsx — Style Apple

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getProfile, clearProfile } from "../lib/session";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:          "#f5f5f7",
  surface:     "#ffffff",
  border:      "rgba(0,0,0,0.08)",
  accent:      "#0071e3",
  accentLight: "rgba(0,113,227,0.10)",
  accentBorder:"rgba(0,113,227,0.22)",
  green:       "#30d158",
  greenLight:  "#e8fdf0",
  textPrimary: "#1d1d1f",
  textSecond:  "#6e6e73",
  textLight:   "#aeaeb2",
  font:        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
  fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  shadow:      "0 2px 8px rgba(0,0,0,0.06)",
  shadowMd:    "0 8px 32px rgba(0,0,0,0.12)",
};

// ─── CSS injecté ──────────────────────────────────────────────────────────────
const SIDEBAR_CSS = `
.ap-shell {
  display: grid;
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
  background: ${T.bg};
}

/* ── Sidebar ── */
.ap-side {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid ${T.border};
  overflow: hidden;
  z-index: 100;
}

/* ── Brand ── */
.ap-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 14px;
  flex-shrink: 0;
}
.ap-brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, ${T.accent} 0%, #34aadc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${T.fontDisplay};
  font-weight: 900;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,113,227,0.28);
}
.ap-brand-title {
  font-family: ${T.fontDisplay};
  font-size: 15px;
  font-weight: 800;
  color: ${T.textPrimary};
  letter-spacing: -.3px;
}
.ap-brand-sub {
  font-size: 11px;
  color: ${T.textLight};
  margin-top: 1px;
}

/* ── Profile card ── */
.ap-me-card {
  margin: 0 12px 14px;
  padding: 12px 14px;
  background: ${T.bg};
  border: 1.5px solid ${T.border};
  border-radius: 12px;
  flex-shrink: 0;
}
.ap-me-name {
  font-family: ${T.fontDisplay};
  font-size: 13px;
  font-weight: 700;
  color: ${T.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-me-meta {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.ap-me-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  background: rgba(0,113,227,0.10);
  color: ${T.accent};
  white-space: nowrap;
}
.ap-me-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.ap-me-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 8px;
  border: 1.5px solid ${T.border};
  background: ${T.surface};
  font-family: ${T.font};
  font-size: 11.5px;
  font-weight: 600;
  color: ${T.textSecond};
  cursor: pointer;
  transition: all .15s;
  text-align: center;
}
.ap-me-btn:hover { background: ${T.bg}; border-color: rgba(0,0,0,.14); color: ${T.textPrimary}; }
.ap-me-btn-dark {
  background: ${T.textPrimary};
  border-color: ${T.textPrimary};
  color: #fff;
}
.ap-me-btn-dark:hover { background: #2d2d2f; }

/* ── Nav separator label ── */
.ap-nav-sep {
  padding: 10px 18px 4px;
  font-size: 10px;
  font-weight: 700;
  color: ${T.textLight};
  text-transform: uppercase;
  letter-spacing: .6px;
  flex-shrink: 0;
}

/* ── Nav ── */
.ap-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ap-nav::-webkit-scrollbar { width: 4px; }
.ap-nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,.10); border-radius: 2px; }

.ap-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  color: ${T.textSecond};
  font-family: ${T.font};
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background .12s, color .12s, border-color .12s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ap-nav-item:hover {
  background: rgba(0,0,0,0.04);
  color: ${T.textPrimary};
}
.ap-nav-item.active {
  background: ${T.accentLight};
  border-color: ${T.accentBorder};
  color: ${T.accent};
  font-weight: 600;
}
.ap-nav-item.cta {
  background: ${T.accent};
  border-color: ${T.accent};
  color: #fff;
  font-weight: 600;
  margin-bottom: 6px;
}
.ap-nav-item.cta:hover { background: #0077ed; border-color: #0077ed; }
.ap-nav-item.cta.active { background: ${T.accent}; color: #fff; }

.ap-nav-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

/* ── Bottom ── */
.ap-side-bottom {
  flex-shrink: 0;
  padding: 10px 18px 14px;
  border-top: 1px solid ${T.border};
}
.ap-side-hint {
  font-size: 10.5px;
  color: ${T.textLight};
  line-height: 1.5;
}

/* ── Main ── */
.ap-main {
  min-height: 100vh;
  background: ${T.bg};
  overflow: auto;
}

/* ── Responsive ── */
@media (max-width: 1000px) {
  .ap-shell { grid-template-columns: 1fr; }
  .ap-side {
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid ${T.border};
  }
  .ap-nav {
    flex-direction: row;
    flex-wrap: wrap;
    overflow: visible;
    padding: 0 8px 8px;
  }
  .ap-side-bottom { display: none; }
  .ap-nav-sep { display: none; }
}
`;

function injectCSS() {
  if (document.getElementById("ap-sidebar-css")) return;
  const s = document.createElement("style");
  s.id = "ap-sidebar-css";
  s.textContent = SIDEBAR_CSS;
  document.head.appendChild(s);
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  // CTA en haut
  { to: "/declaration-fe",   label: "Nouvelle FE",      icon: "➕", cta: true },
  // Suivi
  { sep: "Suivi NC" },
  { to: "/interne-serie",    label: "Interne Série",    icon: "🔧" },
  { to: "/interne-fai",      label: "Interne FAI",      icon: "📋" },
  { to: "/client",           label: "Client",           icon: "👥" },
  { to: "/fournisseur",      label: "Fournisseur",      icon: "📦" },
  // Analyse
  { sep: "Analyse" },
  { to: "/kpi",              label: "KPI",              icon: "📊" },
  
  // Exports
  { sep: "Exports" },
  { to: "/alerte-qualite",   label: "Alerte Qualité",   icon: "🚨" },
  { to: "/derogation",       label: "Dérogation",       icon: "📝" },
  // Admin
  { sep: "Admin" },
  { to: "/manager",          label: "Manager",          icon: "⚙️" },
  { to: "/accueil",          label: "Accueil profils",  icon: "🏠" },
];

// ─── Composant ────────────────────────────────────────────────────────────────
export default function SidebarLayout() {
  const nav     = useNavigate();
  const profile = getProfile?.() || null;

  // inject CSS once
  injectCSS();

  return (
    <div className="ap-shell">
      <aside className="ap-side">

        {/* Brand */}
        <div className="ap-brand">
          <div className="ap-brand-logo">FE</div>
          <div>
            <div className="ap-brand-title">Suivi F.E</div>
            <div className="ap-brand-sub">Qualité · KPI · Exports</div>
          </div>
        </div>

        {/* Profil card */}
        <div className="ap-me-card">
          <div className="ap-me-name">{profile?.label || "Aucun profil"}</div>
          <div className="ap-me-meta">
            <span className="ap-me-badge">{profile?.role || "—"}</span>
            {profile?.clientCodes?.length > 0 && (
              <span className="ap-me-badge" style={{ background: "rgba(48,209,88,0.12)", color: "#1a7a3f" }}>
                {profile.clientCodes.length} clients
              </span>
            )}
          </div>
          <div className="ap-me-actions">
            <button className="ap-me-btn" onClick={() => nav("/accueil")}>Changer</button>
            <button className="ap-me-btn ap-me-btn-dark" onClick={() => { clearProfile?.(); nav("/accueil", { replace: true }); }}>Reset</button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ap-nav">
          {NAV.map((x, i) => {
            if (x.sep) return (
              <div key={`sep-${i}`} className="ap-nav-sep">{x.sep}</div>
            );
            return (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `ap-nav-item${x.cta ? " cta" : ""}${isActive && !x.cta ? " active" : ""}`
                }
              >
                <span className="ap-nav-icon">{x.icon}</span>
                {x.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom hint */}
        <div className="ap-side-bottom">
          <div className="ap-side-hint">Suivi-FE · v2 · Apple UI</div>
        </div>

      </aside>

      <main className="ap-main">
        <Outlet />
      </main>
    </div>
  );
}