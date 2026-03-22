// src/layouts/SidebarLayout.jsx — Burger menu (toutes tailles)
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { getProfile, clearProfile } from "../lib/session";

const T = {
  bg:          "#f5f5f7",
  surface:     "#ffffff",
  border:      "rgba(0,0,0,0.08)",
  accent:      "#0071e3",
  accentLight: "rgba(0,113,227,0.10)",
  accentBorder:"rgba(0,113,227,0.22)",
  textPrimary: "#1d1d1f",
  textSecond:  "#6e6e73",
  textLight:   "#aeaeb2",
  font:        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
  fontDisplay: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

const LAYOUT_CSS = `
/* ── Shell ── */
.ap-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${T.bg};
}

/* ── Topbar ── */
.ap-topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 500;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid ${T.border};
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}

.ap-topbar-left  { display: flex; align-items: center; gap: 12px; }
.ap-topbar-right { display: flex; align-items: center; gap: 10px; }

/* ── Brand ── */
.ap-brand-logo {
  width: 34px; height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, ${T.accent} 0%, #34aadc 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: ${T.fontDisplay};
  font-weight: 900; font-size: 14px; color: #fff;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,113,227,0.28);
}
.ap-brand-title {
  font-family: ${T.fontDisplay};
  font-size: 15px; font-weight: 800;
  color: ${T.textPrimary}; letter-spacing: -.3px;
}

/* ── Topbar right ── */
.ap-topbar-user {
  font-size: 13px; font-weight: 600; color: ${T.textSecond};
}
.ap-topbar-logout {
  font-size: 12px; font-weight: 600;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid rgba(255,59,48,0.2);
  background: rgba(255,59,48,0.07); color: #ff3b30;
  cursor: pointer; font-family: inherit; transition: background .12s;
}
.ap-topbar-logout:hover { background: rgba(255,59,48,0.14); }

/* ── Burger ── */
.ap-burger {
  width: 40px; height: 40px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 5px;
  border: none; background: transparent;
  cursor: pointer; padding: 4px;
  border-radius: 8px; transition: background .12s;
}
.ap-burger:hover { background: rgba(0,0,0,0.06); }

.ap-burger-line {
  display: block; width: 22px; height: 2px;
  background: ${T.textPrimary}; border-radius: 2px;
  transition: transform .25s ease, opacity .2s ease;
  transform-origin: center;
}
.ap-burger-line.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.ap-burger-line.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
.ap-burger-line.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Overlay ── */
.ap-menu-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45);
  z-index: 800;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.ap-menu-overlay.open { display: block; }

/* ── Drawer ── */
.ap-drawer {
  position: fixed;
  top: 0; left: -300px;
  width: 280px; height: 100vh;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid ${T.border};
  box-shadow: 4px 0 40px rgba(0,0,0,0.14);
  z-index: 900;
  display: flex; flex-direction: column;
  transition: left .28s cubic-bezier(0.4,0,0.2,1);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.ap-drawer.open { left: 0; }

/* ── Drawer header ── */
.ap-drawer-header {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${T.border};
  background: linear-gradient(135deg, rgba(0,113,227,0.05), rgba(52,170,220,0.05));
  flex-shrink: 0;
}
.ap-drawer-brand { display: flex; align-items: center; gap: 10px; }
.ap-drawer-brand-text .ap-brand-title { font-size: 14px; }
.ap-drawer-brand-text .ap-brand-sub { font-size: 11px; color: ${T.textLight}; margin-top: 1px; }

.ap-drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid ${T.border}; background: ${T.bg};
  color: ${T.textSecond}; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.ap-drawer-close:hover { background: #e8e8ea; color: ${T.textPrimary}; }

/* ── Drawer user card ── */
.ap-drawer-user {
  padding: 14px 16px;
  border-bottom: 1px solid ${T.border};
  background: ${T.bg};
  flex-shrink: 0;
}
.ap-drawer-user-name  { font-size: 13px; font-weight: 700; color: ${T.textPrimary}; margin-bottom: 2px; }
.ap-drawer-user-email { font-size: 11px; color: ${T.textSecond}; margin-bottom: 6px; }
.ap-drawer-user-meta  { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
.ap-drawer-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 20px;
  font-size: 10.5px; font-weight: 700;
}
.ap-drawer-badge--blue  { background: rgba(0,113,227,0.10); color: ${T.accent}; }
.ap-drawer-badge--green { background: rgba(48,209,88,0.12); color: #1a7a3f; }
.ap-drawer-logout {
  width: 100%; padding: 8px 12px;
  border-radius: 9px;
  border: 1px solid rgba(255,59,48,0.25);
  background: rgba(255,59,48,0.07); color: #ff3b30;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  text-align: center; transition: background .12s;
}
.ap-drawer-logout:hover { background: rgba(255,59,48,0.14); }

/* ── Drawer nav ── */
.ap-drawer-nav {
  flex: 1; padding: 8px 10px;
  display: flex; flex-direction: column; gap: 2px;
}
.ap-drawer-sep {
  padding: 10px 10px 4px;
  font-size: 10px; font-weight: 700;
  color: ${T.textLight};
  text-transform: uppercase; letter-spacing: .6px;
}
.ap-drawer-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px; border-radius: 10px;
  border: 1.5px solid transparent;
  color: ${T.textSecond};
  font-size: 13.5px; font-weight: 500;
  text-decoration: none;
  transition: background .12s, color .12s, border-color .12s;
}
.ap-drawer-item:hover { background: rgba(0,0,0,0.04); color: ${T.textPrimary}; }
.ap-drawer-item.active {
  background: ${T.accentLight};
  border-color: ${T.accentBorder};
  color: ${T.accent}; font-weight: 600;
}
.ap-drawer-item.cta {
  background: ${T.accent}; border-color: ${T.accent};
  color: #fff; font-weight: 600; margin-bottom: 4px;
}
.ap-drawer-item.cta:hover { background: #0077ed; }
.ap-drawer-icon { font-size: 15px; width: 22px; text-align: center; flex-shrink: 0; }

.ap-drawer-divider {
  height: 1px; background: ${T.border};
  margin: 6px 4px;
}

/* ── Drawer footer ── */
.ap-drawer-footer {
  padding: 12px 16px;
  border-top: 1px solid ${T.border};
  flex-shrink: 0;
}
.ap-drawer-version { font-size: 10.5px; color: ${T.textLight}; text-align: center; margin-top: 8px; }

/* ── Main ── */
.ap-main {
  flex: 1;
  padding-top: 56px;
  min-height: calc(100vh - 56px);
  background: ${T.bg};
  overflow: auto;
}

/* ── Safe area iPhone ── */
@supports (padding: max(0px)) {
  .ap-topbar {
    padding-left:  max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
  .ap-main { padding-bottom: max(0px, env(safe-area-inset-bottom)); }
  .ap-drawer { padding-top: max(0px, env(safe-area-inset-top)); }
}

/* ── Responsive tablette ── */
@media (max-width: 768px) {
  .ap-topbar-user { display: none; }
  .ap-topbar-logout { display: none; }
}

/* ── Responsive mobile ── */
@media (max-width: 480px) {
  .ap-topbar { height: 52px; padding: 0 12px; }
  .ap-main   { padding-top: 52px; }
  .ap-brand-title { font-size: 13px; }
  .ap-drawer { width: 260px; }
  .ap-drawer-item { font-size: 14px; padding: 13px 12px; }
}
`;

function injectCSS() {
  if (document.getElementById("ap-sidebar-css")) return;
  const s = document.createElement("style");
  s.id = "ap-sidebar-css";
  s.textContent = LAYOUT_CSS;
  document.head.appendChild(s);
}

const NAV_BASE = [
  { to: "/declaration-fe",   label: "Nouvelle FE",          icon: "➕", cta: true },
  { sep: "Suivi NC" },
  { to: "/interne-serie",    label: "Interne Série",        icon: "🔧" },
  { to: "/interne-fai",      label: "Interne FAI",          icon: "📋" },
  { to: "/client",           label: "Client",               icon: "👥" },
  { to: "/fournisseur",      label: "Fournisseur",          icon: "📦" },
  { to: "/groupe",           label: "Groupe",               icon: "🔗" },
  { sep: "Analyse" },
  { to: "/kpi",              label: "KPI",                  icon: "📊" },
  { to: "/historique-fe",    label: "Historique / Article", icon: "🗂️" },
  { sep: "Exports" },
  { to: "/alerte-qualite",   label: "Alerte Qualité",       icon: "🚨" },
  { to: "/derogation",       label: "Dérogation",           icon: "📝" },
  { sep: "Admin" },
  { to: "/manager",          label: "Manager",              icon: "⚙️", roles: ["responsable","admin"] },
  { to: "/accueil",          label: "Accueil profils",      icon: "🏠" },
];

function handleLogout(nav) {
  localStorage.removeItem("kep_token");
  localStorage.removeItem("kep_user");
  clearProfile?.();
  nav("/login", { replace: true });
}

export default function SidebarLayout() {
  const nav      = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Fermer au changement de page
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Fermer avec Escape
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  injectCSS();

  const kepUser = (() => {
    try { return JSON.parse(localStorage.getItem("kep_user")); } catch { return null; }
  })();
  const profile  = getProfile?.() || null;
  const userRole = kepUser?.role || "";
  const NAV      = NAV_BASE.filter(x => !x.roles || x.roles.includes(userRole));
  const nomAffiche = kepUser ? `${kepUser.prenom || ""} ${kepUser.nom || ""}`.trim() || kepUser.email : profile?.label || "";

  return (
    <div className="ap-shell">

      {/* ── Topbar ── */}
      <header className="ap-topbar">
        <div className="ap-topbar-left">
          <button className="ap-burger" onClick={() => setOpen(v => !v)} aria-label="Menu">
            <span className={`ap-burger-line ${open ? "open" : ""}`}/>
            <span className={`ap-burger-line ${open ? "open" : ""}`}/>
            <span className={`ap-burger-line ${open ? "open" : ""}`}/>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div className="ap-brand-logo">FE</div>
            <span className="ap-brand-title">Suivi F.E</span>
          </div>
        </div>
        <div className="ap-topbar-right">
          {nomAffiche && <span className="ap-topbar-user">{nomAffiche}</span>}
          <button className="ap-topbar-logout" onClick={() => handleLogout(nav)}>Déconnexion</button>
        </div>
      </header>

      {/* ── Overlay ── */}
      <div className={`ap-menu-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      {/* ── Drawer ── */}
      <nav className={`ap-drawer ${open ? "open" : ""}`}>

        {/* Header */}
        <div className="ap-drawer-header">
          <div className="ap-drawer-brand">
            <div className="ap-brand-logo">FE</div>
            <div className="ap-drawer-brand-text">
              <div className="ap-brand-title">Suivi F.E</div>
              <div className="ap-brand-sub">Qualité · KPI · Exports</div>
            </div>
          </div>
          <button className="ap-drawer-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        {/* User */}
        <div className="ap-drawer-user">
          {kepUser ? (
            <>
              <div className="ap-drawer-user-name">{kepUser.prenom} {kepUser.nom}</div>
              <div className="ap-drawer-user-email">{kepUser.email}</div>
              <div className="ap-drawer-user-meta">
                <span className="ap-drawer-badge ap-drawer-badge--blue">{kepUser.role}</span>
                <span className="ap-drawer-badge ap-drawer-badge--green">{kepUser.sites}</span>
              </div>
              <button className="ap-drawer-logout" onClick={() => handleLogout(nav)}>🚪 Déconnexion</button>
            </>
          ) : profile ? (
            <>
              <div className="ap-drawer-user-name">{profile.label || "—"}</div>
              <div className="ap-drawer-user-meta">
                <span className="ap-drawer-badge ap-drawer-badge--blue">{profile.role}</span>
              </div>
              <button className="ap-drawer-logout" onClick={() => { clearProfile?.(); nav("/accueil", { replace:true }); }}>Reset profil</button>
            </>
          ) : null}
        </div>

        {/* Nav */}
        <div className="ap-drawer-nav">
          {NAV.map((x, i) => {
            if (x.sep) return <div key={`sep-${i}`} className="ap-drawer-sep">{x.sep}</div>;
            return (
              <NavLink
                key={x.to}
                to={x.to}
                className={({ isActive }) =>
                  `ap-drawer-item${x.cta ? " cta" : ""}${isActive && !x.cta ? " active" : ""}`
                }
              >
                <span className="ap-drawer-icon">{x.icon}</span>
                {x.label}
              </NavLink>
            );
          })}
        </div>

        {/* Footer */}
        <div className="ap-drawer-footer">
          <div className="ap-drawer-version">Suivi-FE · v2 · KEP Qualité</div>
        </div>

      </nav>

      {/* ── Content ── */}
      <main className="ap-main">
        <Outlet />
      </main>

    </div>
  );
}