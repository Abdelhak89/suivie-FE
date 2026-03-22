// src/components/SidebarLayout.jsx
// Navigation : burger menu uniquement — pas de sidebar fixe
import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./SidebarLayout.css";

const NAV_BASE = [
  { to:"/accueil",        icon:"🏠", label:"Accueil"        },
  { to:"/all-fe",         icon:"📋", label:"Toutes les FE"  },
  { to:"/interne",        icon:"🔧", label:"Interne"        },
  { to:"/client",         icon:"👥", label:"Client"         },
  { to:"/fournisseur",    icon:"📦", label:"Fournisseur"    },
  { to:"/alerte-qualite", icon:"🚨", label:"Alerte Qualité" },
  { to:"/derogation",     icon:"📝", label:"Dérogation"     },
  { to:"/historique-fe",  icon:"🗂️", label:"Historique FE"  },
  { to:"/kpi",            icon:"📊", label:"KPI"            },
];

const NAV_MANAGER = [
  { to:"/manager", icon:"⚙️", label:"Manager" },
];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Fermer au changement de page
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Fermer avec Escape
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const raw     = localStorage.getItem("kep_user");
  const kepUser = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
  const role    = kepUser?.role || "";
  const sites   = kepUser?.sites || "";
  const nom     = kepUser?.nom || kepUser?.email || "Utilisateur";
  const isManager = role === "responsable" || role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("kep_token");
    localStorage.removeItem("kep_user");
    navigate("/login");
  };

  return (
    <div className="appShell">

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="burger" onClick={() => setOpen(v => !v)} aria-label="Menu">
            <span className={`burger-line ${open ? "open" : ""}`}/>
            <span className={`burger-line ${open ? "open" : ""}`}/>
            <span className={`burger-line ${open ? "open" : ""}`}/>
          </button>
          <div className="topbar-brand">
            <div className="brandLogo">FE</div>
            <span className="brandTitle">Suivi F.E</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">{nom}</span>
          <button onClick={handleLogout} className="topbar-logout">Déconnexion</button>
        </div>
      </header>

      {/* ── Overlay ── */}
      <div className={`menuOverlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      {/* ── Drawer menu ── */}
      <nav className={`drawerMenu ${open ? "open" : ""}`}>
        <div className="drawerHeader">
          <div className="drawerBrand">
            <div className="brandLogo">FE</div>
            <div>
              <div className="brandTitle">Suivi F.E</div>
              <div className="brandSub">KEP Métal — Qualité</div>
            </div>
          </div>
          <button className="drawerClose" onClick={() => setOpen(false)}>✕</button>
        </div>

        {/* User card */}
        <div className="drawerUser">
          <div className="drawerUserName">{nom}</div>
          <div className="drawerUserMeta">
            <span className="drawerBadge drawerBadge--blue">{role || "qualiticien"}</span>
            {sites && sites !== "ALL" && (
              <span className="drawerBadge drawerBadge--gray">{sites}</span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="drawerNav">
          {NAV_BASE.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `drawerNavItem${isActive ? " active" : ""}`}>
              <span className="drawerNavIcon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}

          {isManager && (
            <>
              <div className="drawerNavDivider" />
              {NAV_MANAGER.map(n => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `drawerNavItem${isActive ? " active" : ""}`}>
                  <span className="drawerNavIcon">{n.icon}</span>
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="drawerFooterMenu">
          <button onClick={handleLogout} className="drawerLogout">
            🚪 Déconnexion
          </button>
          <div className="drawerVersion">Suivi FE v2.0 — KEP Métal</div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="main">
        {children}
      </main>

    </div>
  );
}