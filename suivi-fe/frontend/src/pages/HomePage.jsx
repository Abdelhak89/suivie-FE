// src/pages/HomePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const QUALITICIENS = [
  "BLANQUART Nicolas",
  "BRISDET Trystan",
  "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette",
  "SDRAULIG Florence",
];

export default function HomePage() {
  const nav = useNavigate();
  const [annee, setAnnee] = useState("2026");

  const goDash = (me) => {
    const params = new URLSearchParams();
    if (me) params.set("me", me);
    if (annee) params.set("annee", annee);
    nav(`/dashboard?${params.toString()}`);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Accueil</h2>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Choisis ton profil pour voir tes FE.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#6b7280" }}>Année :</span>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={selectStyle}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>
        </div>
      </div>

      {/* Cards Qualiticiens */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: 12 }}>
        {QUALITICIENS.map((name) => (
          <button key={name} onClick={() => goDash(name)} style={cardBtn}>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Qualiticien</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 6 }}>Ouvrir mes FE</div>
          </button>
        ))}
      </div>

      {/* Cards spéciales */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: 12 }}>
        <button onClick={() => goDash("__ALL__")} style={cardBtn}>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Accès</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>Toutes les FE</div>
          <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 6 }}>Client / Interne / Fournisseur</div>
        </button>

        <button onClick={() => nav("/manager")} style={cardBtn}>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Responsable</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>Manager</div>
          <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 6 }}>
            Portefeuilles / transferts
          </div>
        </button>

        <button onClick={() => nav("/kpi")} style={cardBtn}>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Pilotage</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>KPI</div>
          <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 6 }}>
            Pareto / analyses
          </div>
        </button>
      </div>
    </div>
  );
}

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  minWidth: 180,
};

const cardBtn = {
  textAlign: "left",
  background: "white",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 14,
  cursor: "pointer",
};
