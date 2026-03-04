// src/components/Analyse6MModal.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/app.css";

function safeParse(v) {
  try { const o = JSON.parse(v); return o && typeof o === "object" ? o : null; } catch { return null; }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const M6_FIELDS = [
  { key: "matiere",    label: "Matière" },
  { key: "materiel",   label: "Matériel" },
  { key: "methode",    label: "Méthode" },
  { key: "main_oeuvre",label: "Main d'œuvre" },
  { key: "milieu",     label: "Milieu" },
  { key: "mesure",     label: "Mesure" },
];

export default function Analyse6MModal({ open, initialValue, onCancel, onSave }) {
  const parsed = useMemo(() => safeParse(initialValue), [initialValue]);

  const [probleme,   setProbleme]   = useState("");
  const [date,       setDate]       = useState("");
  const [participant,setParticipant]= useState("");
  const [vals, setVals] = useState({
    matiere: "", materiel: "", methode: "", main_oeuvre: "", milieu: "", mesure: ""
  });

  useEffect(() => {
    if (!open) return;
    const p = parsed || {};
    setProbleme(p.probleme || "");
    setDate(p.date || "");
    setParticipant(p.participant || "");
    setVals({
      matiere:     p.matiere     || "",
      materiel:    p.materiel    || "",
      methode:     p.methode     || "",
      main_oeuvre: p.main_oeuvre || "",
      milieu:      p.milieu      || "",
      mesure:      p.mesure      || "",
    });
  }, [open, parsed]);

  if (!open) return null;

  const build = () => ({ probleme: probleme.trim(), date: date.trim(), participant: participant.trim(), ...vals });

  const save = () => onSave(JSON.stringify(build(), null, 2));

  const exportPdf = () => {
    const p = build();
    const w = window.open("", "_blank");
    if (!w) { alert("Popup bloquée."); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Analyse 6M</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px}
  h1{font-size:18px;margin:0 0 14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .box{border:1px solid #ddd;border-radius:8px;padding:10px}
  .lbl{font-weight:700;font-size:12px;margin-bottom:4px}
  pre{white-space:pre-wrap;margin:0;font-size:13px}
  @media print{button{display:none}}
</style></head><body>
<button onclick="window.print()">Imprimer / PDF</button>
<h1>Analyse 6M</h1>
<div class="grid" style="margin-bottom:12px">
  <div class="box"><div class="lbl">Problème / Effet</div><pre>${escapeHtml(p.probleme)}</pre></div>
  <div class="box">
    <div class="lbl">Date</div><pre>${escapeHtml(p.date)}</pre>
    <div class="lbl" style="margin-top:8px">Participant</div><pre>${escapeHtml(p.participant)}</pre>
  </div>
</div>
<div class="grid">
  ${M6_FIELDS.map(f => `<div class="box"><div class="lbl">${escapeHtml(f.label)}</div><pre>${escapeHtml(p[f.key] || "")}</pre></div>`).join("")}
</div>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 980 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="h1" style={{ fontSize: 16 }}>Analyse 6M</div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/docs/6M%20KTIS%20-%20Vierge.pptx" target="_blank" rel="noreferrer" className="btn">
              Modèle PPT
            </a>
            <button className="btn" onClick={exportPdf}>Export PDF</button>
            <button className="btn" onClick={onCancel}>✕</button>
          </div>
        </div>

        {/* En-tête */}
        <div className="grid2" style={{ marginBottom: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Problème / Effet</div>
            <textarea className="textarea" rows={3} value={probleme} onChange={(e) => setProbleme(e.target.value)} placeholder="Décrire le problème…" />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Date</div>
              <input type="date" className="input" style={{ width: "100%" }} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Participant</div>
              <input className="input" style={{ width: "100%" }} value={participant} onChange={(e) => setParticipant(e.target.value)} placeholder="…" />
            </div>
          </div>
        </div>

        {/* 6M */}
        <div className="grid2">
          {M6_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="label" style={{ marginBottom: 6 }}>{label}</div>
              <textarea
                className="textarea"
                rows={4}
                value={vals[key]}
                onChange={(e) => setVals((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="Saisir…"
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn btnDark" onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
