// src/components/EditCellModal.jsx
import { useEffect, useState } from "react";
import "../styles/app.css";

export default function EditCellModal({ open, title, initialValue, mode = "text", options = null, onCancel, onSave }) {
  const [value, setValue] = useState(initialValue ?? "");

  useEffect(() => { setValue(initialValue ?? ""); }, [initialValue, open]);

  if (!open) return null;

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="h1" style={{ fontSize: 16 }}>{title}</div>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>

        <div className="sub" style={{ marginBottom: 6 }}>Contenu actuel</div>
        <div className="panel" style={{ maxHeight: 140, overflow: "auto", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--fontMono)", fontSize: 12, color: "var(--inkMid)", whiteSpace: "pre-wrap" }}>
            {String(initialValue ?? "").trim() || "—"}
          </span>
        </div>

        <div className="label" style={{ marginBottom: 6 }}>Modifier</div>

        {mode === "select" ? (
          <select className="select" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: "100%" }}>
            <option value="">(Vide)</option>
            {(options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <textarea
            className="textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            placeholder="Saisir la valeur..."
          />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn btnDark" onClick={() => onSave(value)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
