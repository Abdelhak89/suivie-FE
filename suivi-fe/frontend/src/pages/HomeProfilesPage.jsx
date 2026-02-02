// src/pages/HomeProfilesPage.jsx
import { useNavigate } from "react-router-dom";
import { setProfile } from "../lib/session";
import { QUALITICIENS, PORTFOLIO_BY_QUALITICIEN, PROFILES } from "../data/portfolio";

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "white",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

export default function HomeProfilesPage() {
  const nav = useNavigate();

  const goQualiticien = (name) => {
    const clientCodes = PORTFOLIO_BY_QUALITICIEN[name] || [];
    setProfile({ role: "qualiticien", name, clientCodes });
    nav("/dashboard");
  };

  const goProfile = (p) => {
    setProfile(p);
    nav("/dashboard");
  };

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Choisir un profil</h2>
        <div style={{ color: "#6b7280" }}>Sélection = filtre automatique des FE</div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {/* ✅ Qualiticiens */}
        {QUALITICIENS.map((n) => {
          const codes = PORTFOLIO_BY_QUALITICIEN[n] || [];
          return (
            <div key={n} style={cardStyle} onClick={() => goQualiticien(n)}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{n}</div>
              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                Portefeuille : {codes.length ? codes.join(", ") : "—"}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#111827" }}>
                Ouvre Dashboard + pages FE filtrées
              </div>
            </div>
          );
        })}

        {/* ✅ Responsable */}
        <div style={{ ...cardStyle, borderColor: "#111827" }} onClick={() => goProfile(PROFILES.manager)}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Responsable</div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            Gérer portefeuilles / transferts
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#111827" }}>
            Accès pages manager
          </div>
        </div>

        {/* ✅ Toutes FE */}
        <div style={{ ...cardStyle, borderColor: "#2563eb" }} onClick={() => goProfile(PROFILES.all)}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Toutes les FE</div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            Aucun filtre client
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#111827" }}>
            Vue globale
          </div>
        </div>
      </div>
    </div>
  );
}
