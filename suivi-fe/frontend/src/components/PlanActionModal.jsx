import { useEffect, useMemo, useState } from "react";

function safeParse(v) {
  try {
    const obj = JSON.parse(v);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function Box({ label, value }) {
  const v = String(value ?? "").trim();
  return (
    <div style={box}>
      <div style={boxLabel}>{label}</div>
      <div style={boxValue}>{v ? v : "—"}</div>
    </div>
  );
}

export default function PlanActionModal({
  open,
  analyseValue,     // string JSON de data["Analyse"]
  initialValue,     // texte plan action actuel
  onCancel,
  onSave,
}) {
  const parsed = useMemo(() => safeParse(analyseValue), [analyseValue]);
  const a = parsed || {};

  const [value, setValue] = useState(initialValue ?? "");

  useEffect(() => {
    if (open) setValue(initialValue ?? "");
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div style={backdrop} onMouseDown={onCancel}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Plan d’action</div>
          <button style={btn} onClick={onCancel}>✕</button>
        </div>

        {/* ✅ Résumé Analyse 6M (lecture seule) */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8, color: "#374151" }}>
            Analyse 6M (rappel)
          </div>

          <div style={grid2}>
            <Box label="Problème / Effet" value={a.probleme} />
            <div style={{ display: "grid", gap: 10 }}>
              <Box label="Date" value={a.date} />
              <Box label="Participant" value={a.participant} />
            </div>
          </div>

          <div style={grid2}>
            <Box label="Matière" value={a.matiere} />
            <Box label="Matériel" value={a.materiel} />
            <Box label="Méthode" value={a.methode} />
            <Box label="Main d'œuvre" value={a.main_oeuvre} />
            <Box label="Milieu" value={a.milieu} />
            <Box label="Mesure" value={a.mesure} />
          </div>
        </div>

        {/* ✅ Saisie plan d'action */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, color: "#374151" }}>
            Plan d’action (à remplir)
          </div>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            style={textarea}
            placeholder="Décrire les actions, responsables, dates, jalons..."
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <button style={btn} onClick={onCancel}>Annuler</button>
          <button style={btnPrimary} onClick={() => onSave(value)}>
            Enregistrer
          </button>
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
  width: "min(980px, 96vw)",
  maxHeight: "92vh",
  overflow: "auto",
  background: "white",
  borderRadius: 16,
  border: "1px solid var(--border)",
  padding: 14,
};

const grid2 = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
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

const box = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 10,
  background: "white",
};

const boxLabel = {
  fontWeight: 800,
  color: "#374151",
  marginBottom: 6,
  fontSize: 13,
};

const boxValue = {
  whiteSpace: "pre-wrap",
  color: "#111827",
  fontSize: 14,
};
