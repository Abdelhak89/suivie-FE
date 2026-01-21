import { useEffect, useMemo, useState } from "react";

function safeParse(v) {
  try {
    const obj = JSON.parse(v);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function Analyse6MModal({ open, initialValue, onCancel, onSave }) {
  const parsed = useMemo(() => safeParse(initialValue), [initialValue]);

  const [probleme, setProbleme] = useState("");
  const [date, setDate] = useState(""); // ✅ input type="date" (YYYY-MM-DD)
  const [participant, setParticipant] = useState("");

  const [matiere, setMatiere] = useState("");
  const [materiel, setMateriel] = useState("");
  const [methode, setMethode] = useState("");
  const [mainOeuvre, setMainOeuvre] = useState("");
  const [milieu, setMilieu] = useState("");
  const [mesure, setMesure] = useState("");

  useEffect(() => {
    if (!open) return;

    const p = parsed || {};
    setProbleme(p.probleme || "");
    setDate(p.date || "");
    setParticipant(p.participant || "");

    setMatiere(p.matiere || "");
    setMateriel(p.materiel || "");
    setMethode(p.methode || "");
    setMainOeuvre(p.main_oeuvre || "");
    setMilieu(p.milieu || "");
    setMesure(p.mesure || "");
  }, [open, parsed]);

  if (!open) return null;

  const buildPayload = () => ({
    probleme: probleme.trim(),
    date: date.trim(),
    participant: participant.trim(),
    matiere: matiere.trim(),
    materiel: materiel.trim(),
    methode: methode.trim(),
    main_oeuvre: mainOeuvre.trim(),
    milieu: milieu.trim(),
    mesure: mesure.trim(),
  });

  const save = () => onSave(JSON.stringify(buildPayload(), null, 2));

  const exportPdf = () => {
    const p = buildPayload();
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup bloquée : autorise les popups pour exporter en PDF.");
      return;
    }

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Analyse 6M</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .box { border: 1px solid #ddd; border-radius: 10px; padding: 10px; }
    .label { font-weight: 700; margin-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    pre { white-space: pre-wrap; margin: 0; }
    @media print { button { display:none } }
  </style>
</head>
<body>
  <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  <h1>Analyse 6M</h1>

  <div class="meta">
    <div class="box">
      <div class="label">Problème / Effet</div>
      <pre>${escapeHtml(p.probleme)}</pre>
    </div>
    <div class="box">
      <div class="label">Date</div>
      <pre>${escapeHtml(p.date)}</pre>
      <div class="label" style="margin-top:10px;">Participant</div>
      <pre>${escapeHtml(p.participant)}</pre>
    </div>
  </div>

  <div class="grid">
    <div class="box"><div class="label">Matière</div><pre>${escapeHtml(p.matiere)}</pre></div>
    <div class="box"><div class="label">Matériel</div><pre>${escapeHtml(p.materiel)}</pre></div>
    <div class="box"><div class="label">Méthode</div><pre>${escapeHtml(p.methode)}</pre></div>
    <div class="box"><div class="label">Main d'œuvre</div><pre>${escapeHtml(p.main_oeuvre)}</pre></div>
    <div class="box"><div class="label">Milieu</div><pre>${escapeHtml(p.milieu)}</pre></div>
    <div class="box"><div class="label">Mesure</div><pre>${escapeHtml(p.mesure)}</pre></div>
  </div>
</body>
</html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={backdrop} onMouseDown={onCancel}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Analyse 6M</div>
          <button style={btn} onClick={onCancel}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <a
            href="/docs/6M%20KTIS%20-%20Vierge.pptx"
            target="_blank"
            rel="noreferrer"
            style={btnLink}
          >
            Ouvrir / Télécharger le modèle PPT
          </a>

          <button style={btn} onClick={exportPdf}>
            Export PDF
          </button>
        </div>

        {/* En-tête */}
        <div style={grid2}>
          <Field label="Problème / Effet" value={probleme} onChange={setProbleme} rows={2} />
          <div style={{ display: "grid", gap: 10 }}>
            {/* ✅ calendrier */}
            <SmallFieldDate label="Date" value={date} onChange={setDate} />
            <SmallField label="Participant" value={participant} onChange={setParticipant} />
          </div>
        </div>

        {/* 6M */}
        <div style={grid2}>
          <Field label="Matière" value={matiere} onChange={setMatiere} />
          <Field label="Matériel" value={materiel} onChange={setMateriel} />
          <Field label="Méthode" value={methode} onChange={setMethode} />
          <Field label="Main d'œuvre" value={mainOeuvre} onChange={setMainOeuvre} />
          <Field label="Milieu" value={milieu} onChange={setMilieu} />
          <Field label="Mesure" value={mesure} onChange={setMesure} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <button style={btn} onClick={onCancel}>Annuler</button>
          <button style={btnPrimary} onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows = 4 }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 800, color: "#374151" }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={textarea}
        placeholder="Saisir…"
      />
    </div>
  );
}

function SmallField({ label, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 800, color: "#374151" }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
        placeholder="…"
      />
    </div>
  );
}

function SmallFieldDate({ label, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 800, color: "#374151" }}>{label}</div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
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
  marginTop: 12,
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

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
};

const btn = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const btnLink = {
  ...btn,
  color: "#111827",
};

const btnPrimary = {
  ...btn,
  background: "#111827",
  color: "white",
  border: "1px solid #111827",
};
