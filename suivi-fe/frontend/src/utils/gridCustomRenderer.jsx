// src/utils/gridCustomRenderer.jsx
// Renderer partagé pour les colonnes spéciales (Animateur, Support, Mesure Eff.)
import { ANIMATEURS, SUPPORTS } from "../hooks/useGridPage.js";
import { getFieldValue } from "./feFieldMapper.js";

const selectStyle = (bg) => ({
  padding: "4px 6px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  fontSize: 12,
  width: "100%",
  cursor: "pointer",
  background: bg,
});

export function makeCustomRenderer(assignments, setAssign) {
  return function customRenderer(row, colLabel) {
    const ass = assignments[row.numero_fe] || { animateur: "", support: "", mesure_efficacite: false };

    if (colLabel === "Animateur") {
      return (
        <select
          value={ass.animateur}
          onChange={(e) => setAssign(row.numero_fe, "animateur", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={selectStyle(ass.animateur ? "var(--blueBg)" : "white")}
        >
          {ANIMATEURS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }

    if (colLabel === "Support") {
      return (
        <select
          value={ass.support}
          onChange={(e) => setAssign(row.numero_fe, "support", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={selectStyle(ass.support ? "var(--amberBg)" : "white")}
        >
          {SUPPORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }

    if (colLabel === "Mesure Eff.") {
      const on = ass.mesure_efficacite;
      return (
        <select
          value={on ? "Oui" : "Non"}
          onChange={(e) => setAssign(row.numero_fe, "mesure_efficacite", e.target.value === "Oui")}
          onClick={(e) => e.stopPropagation()}
          style={{ ...selectStyle(on ? "var(--greenBg)" : "var(--redBg)"), color: on ? "var(--green)" : "var(--red)", fontWeight: 700 }}
        >
          <option value="Non">Non</option>
          <option value="Oui">Oui</option>
        </select>
      );
    }

    return getFieldValue(row, colLabel);
  };
}
