import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getProfile } from "../lib/session";

const navItem = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 12,
  textDecoration: "none",
  color: isActive ? "#111827" : "#374151",
  background: isActive ? "#eef2ff" : "transparent",
  border: isActive ? "1px solid #c7d2fe" : "1px solid transparent",
  fontWeight: isActive ? 800 : 600,
});

const sectionTitle = {
  marginTop: 16,
  marginBottom: 8,
  color: "#6b7280",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

export default function Sidebar() {
  const nav = useNavigate();
  const profile = getProfile(); // { role, name, clientCodes }

  const role = profile?.role || "";
  const name = profile?.name || "—";

  return (
    <aside
      style={{
        background: "white",
        borderRight: "1px solid #e5e7eb",
        padding: 12,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: "#111827" }}>
          {name}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
          {role === "manager" ? "Responsable" : role === "all" ? "Vue globale" : "Qualiticien"}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => nav("/accueil")}
            style={btnLight}
            title="Revenir à l’écran de choix profil"
          >
            Changer profil
          </button>

          <button
            onClick={() => {
              clearSession();
              nav("/accueil", { replace: true });
            }}
            style={btnLight}
            title="Effacer la session"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: 12 }}>
        <div style={sectionTitle}>Général</div>
        <nav style={{ display: "grid", gap: 8 }}>
          

          <NavLink to="/kpi" style={navItem}>
            KPI
          </NavLink>

          <NavLink to="/clinique-qualite" style={navItem}>
            Clinique Qualité
          </NavLink>
        </nav>

        <div style={sectionTitle}>Exports</div>
        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/alerte-qualite" style={navItem}>
            Alerte Qualité (.xlsx)
          </NavLink>
          <NavLink to="/derogation" style={navItem}>
            Dérogation (.xlsx)
          </NavLink>
        </nav>

        <div style={sectionTitle}>FE</div>
        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/interne-serie" style={navItem}>
            Interne Série
          </NavLink>
          <NavLink to="/interne-fai" style={navItem}>
            Interne FAI
          </NavLink>
          <NavLink to="/client" style={navItem}>
            Client
          </NavLink>
          <NavLink to="/fournisseur" style={navItem}>
            Fournisseur
          </NavLink>
        </nav>

        {role === "manager" ? (
          <>
            <div style={sectionTitle}>Administration</div>
            <nav style={{ display: "grid", gap: 8 }}>
              <NavLink to="/manager" style={navItem}>
                Manager
              </NavLink>
            </nav>
          </>
        ) : null}
      </div>
    </aside>
  );
}

const btnLight = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  color: "#111827",
};
