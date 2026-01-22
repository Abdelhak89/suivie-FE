import { useEffect, useState } from "react";

export default function EditCellModal({
  open,
  title,
  initialValue,
  mode = "text", // "text" | "select"
  options = null,
  onCancel,
  onSave,
}) {
  const [value, setValue] = useState(initialValue ?? "");

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue, open]);

  if (!open) return null;

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={header}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button onClick={onCancel} style={xBtn}>✕</button>
        </div>

        {/* ✅ lecture complète */}
        <div style={{ marginBottom: 10, color: "#6b7280", fontSize: 13 }}>
          Contenu actuel :
        </div>
        <div style={readBox}>
          {String(initialValue ?? "").trim() ? String(initialValue) : "—"}
        </div>

        <div style={{ marginTop: 14, fontWeight: 600 }}>Modifier</div>

        {mode === "select" ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} style={input}>
            <option value="">(Vide)</option>
            {(options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            style={{ ...input, resize: "vertical" }}
            placeholder="Saisir la valeur..."
          />
        )}

        <div style={footer}>
          <button onClick={onCancel} style={btnGhost}>Annuler</button>
          <button onClick={() => onSave(value)} style={btnPrimary}>Enregistrer</button>
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
  padding: 16,
  zIndex: 2000,
};

const modal = {
  width: "min(760px, 96vw)",
  background: "white",
  borderRadius: 16,
  boxShadow: "0 10px 40px rgba(0,0,0,.2)",
  padding: 16,
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const xBtn = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};

const readBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#f9fafb",
  maxHeight: 160,
  overflow: "auto",
  whiteSpace: "pre-wrap",
};

const input = {
  width: "100%",
  marginTop: 8,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const footer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 14,
};

const btnGhost = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};
