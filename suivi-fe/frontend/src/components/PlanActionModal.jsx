// src/components/PlanActionModal.jsx
import { useEffect, useMemo, useState } from "react";

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function toArray(v) {
  const p = safeParse(v);
  return Array.isArray(p) ? p : [];
}

function toObj(v) {
  const p = safeParse(v);
  return p && typeof p === "object" && !Array.isArray(p) ? p : null;
}

function onlyFilledEntries(obj) {
  if (!obj) return [];
  return Object.entries(obj).filter(([_, val]) => String(val ?? "").trim() !== "");
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function PlanActionModal({
  open,
  analyseValue,   // JSON object string (6M)
  initialValue,   // JSON array string (plan actions)
  onCancel,
  onSave,
}) {
  const analyseObj = useMemo(() => toObj(analyseValue) || null, [analyseValue]);

  const analyseFilled = useMemo(() => onlyFilledEntries(analyseObj), [analyseObj]);

  const [actions, setActions] = useState([]);
  const [newActionText, setNewActionText] = useState("");

  useEffect(() => {
    if (!open) return;
    const arr = toArray(initialValue).map((a) => ({
      id: a?.id || uid(),
      text: String(a?.text || ""),
      done: !!a?.done,
      notRealizable: !!a?.notRealizable,
      note: String(a?.note || ""),
    }));
    setActions(arr);
    setNewActionText("");
  }, [open, initialValue]);

  if (!open) return null;

  const addAction = () => {
    const t = String(newActionText || "").trim();
    if (!t) return;
    setActions((prev) => [...prev, { id: uid(), text: t, done: false, notRealizable: false, note: "" }]);
    setNewActionText("");
  };

  const updateAction = (id, patch) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patch };

        // mutual exclusive
        if (patch.done === true) {
          next.notRealizable = false;
          next.note = "";
        }
        if (patch.notRealizable === true) {
          next.done = false;
        }
        if (patch.notRealizable === false) {
          next.note = "";
        }

        return next;
      })
    );
  };

  const removeAction = (id) => setActions((prev) => prev.filter((a) => a.id !== id));

  const save = () => {
    // on garde tout, mais côté clôture on checkera la complétude
    onSave(JSON.stringify(actions));
  };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={header}>
          <div style={{ fontWeight: 800 }}>Plan d’action</div>
          <button onClick={onCancel} style={xBtn}>✕</button>
        </div>

        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>Analyse (rappel)</div>

        <div style={analyseBox}>
          {analyseFilled.length === 0 ? (
            <div style={{ color: "#6b7280" }}>—</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
              {analyseFilled.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <div style={{ fontWeight: 700 }}>{k}</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{String(v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, fontWeight: 800 }}>Actions</div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input
            value={newActionText}
            onChange={(e) => setNewActionText(e.target.value)}
            placeholder="Nouvelle action…"
            style={input}
          />
          <button onClick={addAction} style={btnPrimary}>+ Ajouter</button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {actions.length === 0 ? (
            <div style={{ color: "#6b7280" }}>Aucune action.</div>
          ) : (
            actions.map((a, idx) => (
              <div key={a.id} style={actionRow}>
                <div style={{ fontWeight: 700 }}>{idx + 1}.</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{a.text}</div>

                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={a.done}
                    onChange={(e) => updateAction(a.id, { done: e.target.checked })}
                  />
                  Fait
                </label>

                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={a.notRealizable}
                    onChange={(e) => updateAction(a.id, { notRealizable: e.target.checked })}
                  />
                  Non réalisable
                </label>

                <button onClick={() => removeAction(a.id)} style={btnGhost}>Suppr.</button>

                {a.notRealizable && (
                  <div style={{ gridColumn: "2 / -1", marginTop: 6 }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                      Note (obligatoire si non réalisable)
                    </div>
                    <textarea
                      value={a.note}
                      onChange={(e) => updateAction(a.id, { note: e.target.value })}
                      rows={3}
                      style={{ ...input, resize: "vertical" }}
                      placeholder="Pourquoi non réalisable ?"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={footer}>
          <button onClick={onCancel} style={btnGhost}>Annuler</button>
          <button onClick={save} style={btnPrimary}>Enregistrer</button>
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
  width: "min(900px, 96vw)",
  maxHeight: "92vh",
  overflow: "auto",
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

const analyseBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#f9fafb",
  maxHeight: 200,
  overflow: "auto",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const actionRow = {
  display: "grid",
  gridTemplateColumns: "28px 1fr 90px 140px 90px",
  gap: 10,
  alignItems: "start",
  border: "1px solid #eef2f7",
  borderRadius: 14,
  padding: 12,
  background: "#fff",
};

const checkLabel = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: 13,
  whiteSpace: "nowrap",
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
