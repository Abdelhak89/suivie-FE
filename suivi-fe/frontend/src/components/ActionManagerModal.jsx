// src/components/ActionManagerModal.jsx
import { useEffect, useState } from "react";
import "../styles/app.css";

export default function ActionManagerModal({ open, title, initialValue, onCancel, onSave }) {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (!open) return;
    try {
      const p = JSON.parse(initialValue);
      setActions(Array.isArray(p) ? p : [{ description: initialValue || "", qui: "", quand: "" }]);
    } catch {
      setActions([{ description: initialValue || "", qui: "", quand: "" }]);
    }
  }, [initialValue, open]);

  const addLine = () => setActions((prev) => [...prev, { description: "", qui: "", quand: "" }]);

  const update = (idx, key, val) => {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, [key]: val } : a)));
  };

  if (!open) return null;

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="h1" style={{ fontSize: 16 }}>{title}</div>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Description de l'action</th>
                <th className="th" style={{ width: 160 }}>Qui</th>
                <th className="th" style={{ width: 160 }}>Quand</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((act, i) => (
                <tr key={i}>
                  <td className="td">
                    <input
                      className="input"
                      style={{ width: "100%", minWidth: 0 }}
                      value={act.description}
                      onChange={(e) => update(i, "description", e.target.value)}
                    />
                  </td>
                  <td className="td">
                    <input
                      className="input"
                      style={{ width: "100%", minWidth: 0 }}
                      value={act.qui}
                      onChange={(e) => update(i, "qui", e.target.value)}
                    />
                  </td>
                  <td className="td">
                    <input
                      type="date"
                      className="input"
                      style={{ width: "100%", minWidth: 0 }}
                      value={act.quand}
                      onChange={(e) => update(i, "quand", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addLine}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "8px",
            border: "1px dashed var(--border)",
            borderRadius: "var(--r-md)",
            background: "none",
            cursor: "pointer",
            color: "var(--inkLight)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          + Ajouter une ligne
        </button>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn btnDark" onClick={() => onSave(actions)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
