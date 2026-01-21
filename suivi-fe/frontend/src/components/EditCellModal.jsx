import { useEffect, useState } from "react";

export default function EditCellModal({ open, title, initialValue, onCancel, onSave }) {
  const [value, setValue] = useState(initialValue ?? "");

  useEffect(() => {
    if (open) setValue(initialValue ?? "");
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div style={backdrop} onMouseDown={onCancel}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>{title || "Modifier"}</div>
          <button style={btn} onClick={onCancel}>✕</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Saisir la valeur..."
            rows={6}
            style={textarea}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <button style={btn} onClick={onCancel}>Annuler</button>
          <button style={btnPrimary} onClick={() => onSave(value)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16,
};

const modal = {
  width: "min(720px, 96vw)",
  background: "white",
  borderRadius: 16,
  border: "1px solid var(--border)",
  padding: 14,
};

const textarea = {
  width: "100%",
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  resize: "vertical",
  fontFamily: "inherit",
};

const btn = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  cursor: "pointer",
};

const btnPrimary = {
  ...btn,
  background: "#111827",
  color: "white",
  border: "1px solid #111827",
};
