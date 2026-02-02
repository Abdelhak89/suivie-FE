// src/pages/DashboardPage.jsx
import { Link } from "react-router-dom";
import { PROFILES } from "../data/profiles.js";

export default function DashboardPage() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Choisir un profil</h2>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Sélection = filtre automatique des FE
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
          gap: 14,
          alignItems: "stretch",
          maxWidth: 980,
        }}
      >
        {PROFILES.map((p) => {
          const to =
            p.kind === "responsable"
              ? "/manager"
              : p.kind === "all"
              ? "/qualiticien/all"
              : `/qualiticien/${p.key}`;

          return (
            <Link
              key={p.key}
              to={to}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 14,
                  cursor: "pointer",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 900 }}>{p.label}</div>

                {p.kind === "qualiticien" ? (
                  <>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      Portefeuille : {p.clientCodes.join(", ") || "—"}
                    </div>
                    <div style={{ color: "#111827", fontSize: 12 }}>
                      Ouvre Dashboard + pages FE filtrées
                    </div>
                  </>
                ) : p.kind === "responsable" ? (
                  <>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      Gérer portefeuilles / transferts
                    </div>
                    <div style={{ color: "#111827", fontSize: 12 }}>
                      Accès page manager
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      Aucun filtre client
                    </div>
                    <div style={{ color: "#111827", fontSize: 12 }}>
                      Vue globale
                    </div>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
