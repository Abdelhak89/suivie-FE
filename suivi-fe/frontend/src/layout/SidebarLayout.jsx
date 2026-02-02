import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getProfile, clearProfile } from "../lib/session"; // adapte si ton fichier diffère
import "../styles/app.css";
import "../styles/SidebarLayout.css";

const NAV = [
  { to: "/accueil", label: "Accueil profils" },
  
  { to: "/kpi", label: "KPI" },
  { to: "/clinique-qualite", label: "Clinique Qualité" },
  { to: "/alerte-qualite", label: "Alerte Qualité" },
  { to: "/derogation", label: "Dérogation" },
  { to: "/interne-serie", label: "Interne Série" },
  { to: "/interne-fai", label: "Interne FAI" },
  { to: "/client", label: "Client" },
  { to: "/fournisseur", label: "Fournisseur" },
  { to: "/manager", label: "Manager" },
];

export default function SidebarLayout() {
  const nav = useNavigate();
  const profile = getProfile?.() || null;

  return (
    <div className="appShell">
      <aside className="side">
        <div className="sideTop">
          <div className="brand">
            <div className="brandLogo">FE</div>
            <div>
              <div className="brandTitle">Suivi F.E</div>
              <div className="brandSub">Qualité • KPI • Exports</div>
            </div>
          </div>

          <div className="meCard">
            <div className="meName">{profile?.label || "Aucun profil"}</div>
            <div className="meMeta">
              <span className="badge badgeBlue">{profile?.role || "—"}</span>
              {profile?.clientCodes?.length ? (
                <span className="badge badgeDark">{profile.clientCodes.length} clients</span>
              ) : null}
            </div>

            <div className="meActions">
              <button className="btn" onClick={() => nav("/accueil")}>
                Changer profil
              </button>
              <button
                className="btn btnDark"
                onClick={() => {
                  clearProfile?.();
                  nav("/accueil", { replace: true });
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <nav className="sideNav">
          {NAV.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              className={({ isActive }) => "navItem" + (isActive ? " active" : "")}
            >
              {x.label}
            </NavLink>
          ))}
        </nav>

        <div className="sideBottom">
          <div className="sideHint">UI moderne • Bleu doux • Arrondi</div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
