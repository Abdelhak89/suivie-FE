// src/components/Badge8D.jsx
// Badge unifié — affiche le % réel calculé depuis les données 8D
import { compute8DProgress, parse8DData } from "../utils/compute8DProgress.js";


export default function Badge8D({ fe }) {
  const raw  = fe?.analyse_8d;
  const data = parse8DData(raw);
  const pct  = compute8DProgress(data);

  if (!data) return <span className="ap-badge ap-badge-gray">À démarrer</span>;

  const cls   = pct===100 ? "ap-badge-green" : pct>=50 ? "ap-badge-orange" : "ap-badge-blue";
  const label = pct===100 ? "✓ Complet" : `${pct}%`;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span className={`ap-badge ${cls}`}>{label}</span>
      <div style={{ width:44, height:4, borderRadius:2, background:"rgba(0,0,0,0.08)", overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:2, transition:"width .3s",
          background: pct===100?"#30d158":pct>=50?"#ff9f0a":"#0071e3" }}/>
      </div>
    </div>
  );
}