// src/components/CauseAnalysisModal.jsx
import { useEffect, useState } from "react";
import "../styles/app.css";

const FIELDS = [
  { key: "methode",    label: "Méthode" },
  { key: "matiere",    label: "Matière" },
  { key: "milieu",     label: "Milieu" },
  { key: "materiel",   label: "Matériel" },
  { key: "mainOeuvre", label: "Main d'œuvre" },
];

const EMPTY = { methode: "", matiere: "", milieu: "", materiel: "", mainOeuvre: "", pourquoi: "" };

export default function CauseAnalysisModal({ open, initialValue, onCancel, onSave }) {
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    try {
      const p = JSON.parse(initialValue || "{}");
      setData({ ...EMPTY, ...p });
    } catch {
      setData({ ...EMPTY, pourquoi: initialValue || "" });
    }
  }, [initialValue, open]);

  if (!open) return null;

  const set = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="h1" style={{ fontSize: 16 }}>Analyse des causes</div>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>

        <div className="grid2" style={{ marginBottom: 14 }}>
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="label" style={{ marginBottom: 6 }}>{label}</div>
              <input
                className="input"
                style={{ width: "100%" }}
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="label" style={{ marginBottom: 6 }}>Analyse — Pourquoi / Conclusion</div>
        <textarea
          className="textarea"
          rows={4}
          value={data.pourquoi}
          onChange={(e) => set("pourquoi", e.target.value)}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn btnDark" onClick={() => onSave(data)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
