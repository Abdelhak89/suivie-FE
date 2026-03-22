// src/components/DelaiSecuBadge.jsx
// Affiche le délai sécurisation client : date_creation + 48h ouvrées
import { useState } from "react";
import { addHeuresOuvrees, heuresOuvreesRestantes } from "../utils/heuresOuvrees.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

export default function DelaiSecuBadge({ fe, onCalculate, site }) {
  const [loading, setLoading] = useState(false);

  const delaiDate = fe?.delai_securisation
    ? fe.delai_securisation
    : fe?.date_creation
      ? addHeuresOuvrees(fe.date_creation, 48).toISOString()
      : null;

  if (!delaiDate) return null;

  const restantes = heuresOuvreesRestantes(delaiDate);
  const depasse   = restantes < 0;
  const urgent    = restantes >= 0 && restantes <= 8;

  const bg     = depasse ? "#fff0f0" : urgent ? "#fff8ed" : "#f6ffed";
  const color  = depasse ? "#cf1322" : urgent ? "#d46b08" : "#389e0d";
  const border = depasse ? "#ffa39e" : urgent ? "#ffd591" : "#b7eb8f";

  const absH = Math.abs(restantes);
  const h    = Math.floor(absH);
  const m    = Math.round((absH - h) * 60);
  const txt  = depasse
    ? `⚠ Dépassé ${h}h${m > 0 ? `${m}m` : ""}`
    : urgent
      ? `⏰ ${h}h${m > 0 ? `${m}m` : ""} restantes`
      : `✓ ${h}h${m > 0 ? `${m}m` : ""} restantes`;

  const handleSave = async () => {
    if (!fe?.id || !site || fe.delai_securisation) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("kep_token");
      const res = await fetch(`${API}/api/nc-fe/delai`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ site, id: fe.id }),
      });
      const json = await res.json();
      if (json.success && onCalculate) onCalculate(json.delai_securisation);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <span
        style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:bg, color, border:`1px solid ${border}`, cursor:!fe.delai_securisation?"pointer":"default", whiteSpace:"nowrap" }}
        onClick={handleSave}
        title={`Date limite : ${fmt(delaiDate)}`}
      >
        {loading ? "…" : txt}
      </span>
      <span style={{ fontSize:10, color:"#888", whiteSpace:"nowrap" }}>
        🗓 {fmt(delaiDate)}
      </span>
    </div>
  );
}