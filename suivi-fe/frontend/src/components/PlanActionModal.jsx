// src/components/PlanActionModal.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/app.css";

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(String(v)); } catch { return null; }
}

function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

function onlyFilled(obj) {
  if (!obj) return [];
  return Object.entries(obj).filter(([, v]) => String(v ?? "").trim() !== "");
}

export default function PlanActionModal({ open, analyseValue, initialValue, onCancel, onSave }) {
  const analyseObj    = useMemo(() => { const p = safeParse(analyseValue); return p && !Array.isArray(p) ? p : null; }, [analyseValue]);
  const analyseFilled = useMemo(() => onlyFilled(analyseObj), [analyseObj]);

  const [actions, setActions]       = useState([]);
  const [newText, setNewText]       = useState("");

  useEffect(() => {
    if (!open) return;
    const arr = safeParse(initialValue);
    setActions(
      Array.isArray(arr)
        ? arr.map((a) => ({ id: a?.id || uid(), text: String(a?.text || ""), done: !!a?.done, notRealizable: !!a?.notRealizable, note: String(a?.note || "") }))
        : []
    );
    setNewText("");
  }, [open, initialValue]);

  if (!open) return null;

  const addAction = () => {
    const t = newText.trim();
    if (!t) return;
    setActions((p) => [...p, { id: uid(), text: t, done: false, notRealizable: false, note: "" }]);
    setNewText("");
  };

  const update = (id, patch) => {
    setActions((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const next = { ...a, ...patch };
      if (patch.done === true)          { next.notRealizable = false; next.note = ""; }
      if (patch.notRealizable === true) { next.done = false; }
      if (patch.notRealizable === false){ next.note = ""; }
      return next;
    }));
  };

  const remove = (id) => setActions((p) => p.filter((a) => a.id !== id));

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="h1" style={{ fontSize: 16 }}>Plan d'action</div>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>

        {/* Rappel analyse */}
        <div className="sub" style={{ marginBottom: 6 }}>Analyse (rappel)</div>
        <div className="panel" style={{ maxHeight: 180, overflow: "auto", marginBottom: 16 }}>
          {analyseFilled.length === 0 ? (
            <span className="sub">—</span>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "6px 12px" }}>
              {analyseFilled.map(([k, v]) => (
                <>
                  <div key={k + "_k"} style={{ fontWeight: 700, fontSize: 12, color: "var(--inkLight)" }}>{k}</div>
                  <div key={k + "_v"} style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{String(v)}</div>
                </>
              ))}
            </div>
          )}
        </div>

        {/* Nouvelle action */}
        <div className="label" style={{ marginBottom: 8 }}>Actions</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAction()}
            placeholder="Nouvelle action…"
          />
          <button className="btn btnDark" onClick={addAction}>+ Ajouter</button>
        </div>

        {/* Liste actions */}
        <div style={{ display: "grid", gap: 10, maxHeight: 380, overflowY: "auto" }}>
          {actions.length === 0 && <div className="sub">Aucune action.</div>}
          {actions.map((a, idx) => (
            <div
              key={a.id}
              className="panel"
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto auto auto",
                gap: 10,
                alignItems: "start",
                padding: "10px 14px",
                background: a.done ? "var(--greenBg)" : a.notRealizable ? "var(--amberBg)" : "var(--surface)",
              }}
            >
              <div style={{ fontWeight: 700, paddingTop: 2 }}>{idx + 1}.</div>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap", paddingTop: 2 }}>{a.text}</div>

              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={a.done} onChange={(e) => update(a.id, { done: e.target.checked })} />
                Fait
              </label>

              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={a.notRealizable} onChange={(e) => update(a.id, { notRealizable: e.target.checked })} />
                Non réalisable
              </label>

              <button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => remove(a.id)}>
                Suppr.
              </button>

              {a.notRealizable && (
                <div style={{ gridColumn: "2 / -1", marginTop: 4 }}>
                  <div className="label" style={{ marginBottom: 4 }}>Note (obligatoire)</div>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={a.note}
                    onChange={(e) => update(a.id, { note: e.target.value })}
                    placeholder="Pourquoi non réalisable ?"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn btnDark" onClick={() => onSave(JSON.stringify(actions))}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
