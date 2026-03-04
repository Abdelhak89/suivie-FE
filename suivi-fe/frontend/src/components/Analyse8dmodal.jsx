// src/components/Analyse8DModal.jsx
// Formulaire complet 8D / Ishikawa / 5 Pourquoi / Plan d'action
// Données alimentées par src/data/ncData.js

import { useEffect, useMemo, useState } from "react";
import {
  ILOTS,
  FAMILLES_ISHIKAWA,
  CAUSES_ISHIKAWA_GENERIQUES,
  CAUSES_PAR_ILOT,
  CAUSES_NON_DETECTION_GENERIQUES,
  CAUSES_NON_DETECTION_PAR_ILOT,
  ACTIONS_IMMEDIATES,
  VERIF_EFFICACITE,
  RESULTAT_VERIF,
  DETECTE_PAR,
  TYPE_NC,
  FAI_TYPE,
  FOURNISSEUR_SITE,
  TYPES_DEFAUT,
} from "../data/ncData.js";
import "../styles/app.css";

// ── Helpers ──────────────────────────────────────────────────────

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(String(v)); } catch { return null; }
}

const STEPS = [
  { id: 1, label: "Identification" },
  { id: 2, label: "Description" },
  { id: 3, label: "Actions immédiates" },
  { id: 4, label: "Ishikawa (6M)" },
  { id: 5, label: "5 Pourquoi" },
  { id: 6, label: "Plan d'action" },
  { id: 7, label: "Vérification" },
  { id: 8, label: "Clôture" },
];

const EMPTY = {
  // D1 – Identification
  type_nc: "",
  fournisseur_site: "",
  fai_type: "",
  date_detection: "",
  detecte_par: "",
  detecte_par_autre: "",
  client_programme: "",
  // D2 – Description
  defauts: [{ defaut: "", ecart: "", exigence: "", moyen_detection: "", type_defaut: "" }],
  // D3 – Actions immédiates
  actions_immediates: [],
  action_immediate_autre: "",
  responsable_immediat: "",
  date_immediat: "",
  // D4 – Ishikawa
  ilot: "",
  famille_principale: "",
  cause_racine_ishikawa: "",
  causes_6m: {
    "Méthode": { selected: [], autre: "" },
    "Machine": { selected: [], autre: "" },
    "Matière": { selected: [], autre: "" },
    "Main d'œuvre": { selected: [], autre: "" },
    "Milieu": { selected: [], autre: "" },
    "Mesure": { selected: [], autre: "" },
  },
  // D5 – 5 Why apparition
  why_apparition: ["", "", "", "", ""],
  cause_racine_apparition: "",
  // D5 – 5 Why non-détection
  famille_non_detection: "",
  cause_non_detection_selected: [],
  cause_non_detection_autre: "",
  why_non_detection: ["", "", "", "", ""],
  cause_racine_non_detection: "",
  // D6 – Plan d'action
  actions: [{ description: "", responsable: "", echeance: "", type: "Corrective", statut: "À faire" }],
  // D7 – Vérification
  methode_verif: "",
  resultat_verif: "",
  date_verif: "",
  // D8 – Clôture
  responsable_qualite: "",
  date_cloture: "",
  recurrente: "",
};

// ── Sous-composants ──────────────────────────────────────────────

function StepNav({ current, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20 }}>
      {STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={s.id === current ? "btn btnDark" : "btn"}
          style={{ padding: "6px 10px", fontSize: 12 }}
        >
          D{s.id} – {s.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div className="label">
        {label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function CauseCheckboxGroup({ famille, options, selected, autre, onChange, onAutre }) {
  const toggle = (v) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    onChange(next);
  };
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <div style={{ background: "var(--surfaceAlt)", padding: "7px 12px", fontWeight: 800, fontSize: 11, color: "var(--inkMid)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {famille}
      </div>
      <div style={{ padding: "8px 12px", display: "grid", gap: 6 }}>
        {options.map((opt) => (
          <label key={opt} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 12 }}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 4 }}>
          <span style={{ color: "var(--inkLight)", fontWeight: 600 }}>Autre :</span>
          <input
            className="input"
            style={{ flex: 1, minWidth: 0, padding: "4px 8px", fontSize: 12 }}
            value={autre}
            onChange={(e) => onAutre(e.target.value)}
            placeholder="Préciser…"
          />
        </label>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function Analyse8DModal({ open, initialValue, fe, onCancel, onSave }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    const parsed = safeParse(initialValue);
    setData(parsed && typeof parsed === "object" ? { ...EMPTY, ...parsed } : { ...EMPTY });
    setStep(1);
  }, [open, initialValue]);

  if (!open) return null;

  const set = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  // Causes disponibles selon îlot sélectionné
  const causesIlot = (famille) => {
    const spec  = CAUSES_PAR_ILOT[data.ilot]?.[famille] || [];
    const gen   = CAUSES_ISHIKAWA_GENERIQUES[famille] || [];
    const merged = [...new Set([...spec, ...gen])];
    return merged;
  };

  const causesNonDetection = useMemo(() => {
    const spec = CAUSES_NON_DETECTION_PAR_ILOT[data.ilot] || [];
    const gen  = data.famille_non_detection
      ? CAUSES_NON_DETECTION_GENERIQUES[data.famille_non_detection] || []
      : Object.values(CAUSES_NON_DETECTION_GENERIQUES).flat();
    return [...new Set([...spec, ...gen])];
  }, [data.ilot, data.famille_non_detection]);

  const set6m = (famille, patch) => {
    setData((prev) => ({
      ...prev,
      causes_6m: {
        ...prev.causes_6m,
        [famille]: { ...prev.causes_6m[famille], ...patch },
      },
    }));
  };

  const setWhy = (type, idx, val) => {
    const key = type === "app" ? "why_apparition" : "why_non_detection";
    setData((prev) => {
      const arr = [...prev[key]];
      arr[idx] = val;
      return { ...prev, [key]: arr };
    });
  };

  const addDefaut = () => set("defauts", [...data.defauts, { defaut: "", ecart: "", exigence: "", moyen_detection: "", type_defaut: "" }]);
  const updateDefaut = (i, k, v) => {
    const arr = data.defauts.map((d, idx) => idx === i ? { ...d, [k]: v } : d);
    set("defauts", arr);
  };

  const addAction = () => set("actions", [...data.actions, { description: "", responsable: "", echeance: "", type: "Corrective", statut: "À faire" }]);
  const updateAction = (i, k, v) => {
    const arr = data.actions.map((a, idx) => idx === i ? { ...a, [k]: v } : a);
    set("actions", arr);
  };
  const removeAction = (i) => set("actions", data.actions.filter((_, idx) => idx !== i));

  const toggleActionImm = (v) => {
    const has = data.actions_immediates.includes(v);
    set("actions_immediates", has ? data.actions_immediates.filter((x) => x !== v) : [...data.actions_immediates, v]);
  };

  const toggleNonDetection = (v) => {
    const has = data.cause_non_detection_selected.includes(v);
    set("cause_non_detection_selected", has ? data.cause_non_detection_selected.filter((x) => x !== v) : [...data.cause_non_detection_selected, v]);
  };

  const handleSave = () => onSave(JSON.stringify(data, null, 2));

  // ── Render steps ─────────────────────────────────────────────

  return (
    <div className="modalBackdrop" onMouseDown={onCancel}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 960, width: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", padding: 0 }}
      >
        {/* Header */}
        <div style={{ padding: "14px 18px 0", borderBottom: "1px solid var(--border)", background: "var(--surfaceAlt)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div className="h1" style={{ fontSize: 15 }}>Analyse 8D — {fe?.numero_fe || "NC"}</div>
              {fe?.designation && <div className="sub">{fe.designation}</div>}
            </div>
            <button className="btn" onClick={onCancel}>✕</button>
          </div>
          <StepNav current={step} onChange={setStep} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>

          {/* ── D1 Identification ── */}
          {step === 1 && (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="grid2">
                <Field label="Type de NC" required>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TYPE_NC.map((t) => (
                      <label key={t} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                        <input type="radio" name="type_nc" value={t} checked={data.type_nc === t} onChange={() => set("type_nc", t)} />
                        {t}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Détecté par">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {DETECTE_PAR.map((d) => (
                      <label key={d} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                        <input type="radio" name="detecte_par" value={d} checked={data.detecte_par === d} onChange={() => set("detecte_par", d)} />
                        {d}
                      </label>
                    ))}
                  </div>
                  {data.detecte_par === "Autre" && (
                    <input className="input" style={{ marginTop: 6 }} value={data.detecte_par_autre} onChange={(e) => set("detecte_par_autre", e.target.value)} placeholder="Préciser…" />
                  )}
                </Field>
              </div>

              {data.type_nc === "Fournisseur" && (
                <Field label="Site fournisseur">
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {FOURNISSEUR_SITE.map((s) => (
                      <label key={s} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                        <input type="radio" name="fourn_site" value={s} checked={data.fournisseur_site === s} onChange={() => set("fournisseur_site", s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              {data.type_nc === "FAI" && (
                <Field label="Type FAI">
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {FAI_TYPE.map((s) => (
                      <label key={s} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                        <input type="radio" name="fai_type" value={s} checked={data.fai_type === s} onChange={() => set("fai_type", s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              <div className="grid2">
                <Field label="Date de détection">
                  <input type="date" className="input" style={{ width: "100%" }} value={data.date_detection} onChange={(e) => set("date_detection", e.target.value)} />
                </Field>
                <Field label="Client / Programme">
                  <input className="input" style={{ width: "100%" }} value={data.client_programme} onChange={(e) => set("client_programme", e.target.value)} placeholder="Ex: AIRBUS A320 – 56944053" />
                </Field>
              </div>
            </div>
          )}

          {/* ── D2 Description ── */}
          {step === 2 && (
            <div style={{ display: "grid", gap: 16 }}>
              {data.defauts.map((d, i) => (
                <div key={i} className="panel" style={{ padding: 14 }}>
                  <div className="panelTitle" style={{ marginBottom: 10 }}>Défaut {i + 1}</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Description du défaut">
                      <textarea className="textarea" rows={2} value={d.defaut} onChange={(e) => updateDefaut(i, "defaut", e.target.value)} placeholder="Décrire le défaut observé…" />
                    </Field>
                    <div className="grid2">
                      <Field label="Écart / Impact">
                        <input className="input" style={{ width: "100%" }} value={d.ecart} onChange={(e) => updateDefaut(i, "ecart", e.target.value)} placeholder="Ex: Chocs sur le bord" />
                      </Field>
                      <Field label="Exigence (plan ou norme)">
                        <input className="input" style={{ width: "100%" }} value={d.exigence} onChange={(e) => updateDefaut(i, "exigence", e.target.value)} placeholder="Ex: 56944053-568" />
                      </Field>
                      <Field label="Moyen de détection">
                        <input className="input" style={{ width: "100%" }} value={d.moyen_detection} onChange={(e) => updateDefaut(i, "moyen_detection", e.target.value)} placeholder="Ex: Binoculaire, MMT…" />
                      </Field>
                      <Field label="Type de défaut">
                        <select className="select" style={{ width: "100%" }} value={d.type_defaut} onChange={(e) => updateDefaut(i, "type_defaut", e.target.value)}>
                          <option value="">— Choisir —</option>
                          {TYPES_DEFAUT.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addDefaut}
                style={{ border: "1px dashed var(--border)", borderRadius: "var(--r-md)", background: "none", padding: 10, cursor: "pointer", color: "var(--inkLight)", fontWeight: 600, fontSize: 13 }}
              >
                + Ajouter un défaut
              </button>
            </div>
          )}

          {/* ── D3 Actions immédiates ── */}
          {step === 3 && (
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Actions immédiates réalisées">
                <div style={{ display: "grid", gap: 8 }}>
                  {ACTIONS_IMMEDIATES.map((a) => (
                    <label key={a} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={data.actions_immediates.includes(a)} onChange={() => toggleActionImm(a)} />
                      {a}
                    </label>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="sub">Autre :</span>
                    <input className="input" style={{ flex: 1 }} value={data.action_immediate_autre} onChange={(e) => set("action_immediate_autre", e.target.value)} placeholder="Préciser…" />
                  </div>
                </div>
              </Field>
              <div className="grid2">
                <Field label="Responsable">
                  <input className="input" style={{ width: "100%" }} value={data.responsable_immediat} onChange={(e) => set("responsable_immediat", e.target.value)} placeholder="Nom…" />
                </Field>
                <Field label="Date">
                  <input type="date" className="input" style={{ width: "100%" }} value={data.date_immediat} onChange={(e) => set("date_immediat", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── D4 Ishikawa ── */}
          {step === 4 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="grid2">
                <Field label="Îlot / Process identifié" required>
                  <select className="select" style={{ width: "100%" }} value={data.ilot} onChange={(e) => set("ilot", e.target.value)}>
                    <option value="">— Choisir l'îlot —</option>
                    {ILOTS.map((il) => <option key={il} value={il}>{il}</option>)}
                  </select>
                </Field>
                <Field label="Famille Ishikawa principale">
                  <select className="select" style={{ width: "100%" }} value={data.famille_principale} onChange={(e) => set("famille_principale", e.target.value)}>
                    <option value="">— Choisir —</option>
                    {FAMILLES_ISHIKAWA.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Cause racine retenue (factuelle et vérifiable)">
                <textarea className="textarea" rows={2} value={data.cause_racine_ishikawa} onChange={(e) => set("cause_racine_ishikawa", e.target.value)} placeholder="Décrire la cause racine identifiée…" />
              </Field>

              <div className="panelTitle" style={{ marginTop: 4 }}>Causes identifiées par famille (6M)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {FAMILLES_ISHIKAWA.map((famille) => (
                  <CauseCheckboxGroup
                    key={famille}
                    famille={famille}
                    options={causesIlot(famille)}
                    selected={data.causes_6m[famille]?.selected || []}
                    autre={data.causes_6m[famille]?.autre || ""}
                    onChange={(sel) => set6m(famille, { selected: sel })}
                    onAutre={(v) => set6m(famille, { autre: v })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── D5 5 Pourquoi ── */}
          {step === 5 && (
            <div style={{ display: "grid", gap: 20 }}>

              {/* Apparition */}
              <div className="panel">
                <div className="panelTitle">Causes d'apparition — 5 Pourquoi</div>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {data.why_apparition.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "var(--primary)", width: 30, flexShrink: 0 }}>{i + 1}.</span>
                      <input className="input" style={{ flex: 1 }} value={w} onChange={(e) => setWhy("app", i, e.target.value)} placeholder="Pourquoi ?" />
                    </div>
                  ))}
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Cause racine (apparition)</div>
                    <textarea className="textarea" rows={2} value={data.cause_racine_apparition} onChange={(e) => set("cause_racine_apparition", e.target.value)} placeholder="Conclusion — cause racine d'apparition…" />
                  </div>
                </div>
              </div>

              {/* Non-détection */}
              <div className="panel">
                <div className="panelTitle">Causes de non-détection — 5 Pourquoi</div>
                <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                  <div className="grid2">
                    <Field label="Famille (non-détection)">
                      <select className="select" style={{ width: "100%" }} value={data.famille_non_detection} onChange={(e) => set("famille_non_detection", e.target.value)}>
                        <option value="">— Toutes —</option>
                        {["Méthode", "Main d'œuvre", "Matière", "Milieu", "Machine"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Causes de non-détection identifiées">
                    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", maxHeight: 240, overflowY: "auto", display: "grid", gap: 6 }}>
                      {causesNonDetection.map((c) => (
                        <label key={c} style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", fontSize: 12 }}>
                          <input type="checkbox" checked={data.cause_non_detection_selected.includes(c)} onChange={() => toggleNonDetection(c)} style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                    <input className="input" style={{ marginTop: 8 }} value={data.cause_non_detection_autre} onChange={(e) => set("cause_non_detection_autre", e.target.value)} placeholder="Autre cause de non-détection…" />
                  </Field>

                  {data.why_non_detection.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "var(--red)", width: 30, flexShrink: 0 }}>{i + 1}.</span>
                      <input className="input" style={{ flex: 1 }} value={w} onChange={(e) => setWhy("det", i, e.target.value)} placeholder="Pourquoi non détecté ?" />
                    </div>
                  ))}
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Cause racine (non-détection)</div>
                    <textarea className="textarea" rows={2} value={data.cause_racine_non_detection} onChange={(e) => set("cause_racine_non_detection", e.target.value)} placeholder="Conclusion — cause racine de non-détection…" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── D6 Plan d'action ── */}
          {step === 6 && (
            <div style={{ display: "grid", gap: 12 }}>
              {data.actions.map((a, i) => (
                <div key={i} className="panel" style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 12, color: "var(--inkLight)" }}>Action {i + 1}</span>
                    <button className="btn btnDanger" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => removeAction(i)}>Suppr.</button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Field label="Description">
                      <textarea className="textarea" rows={2} value={a.description} onChange={(e) => updateAction(i, "description", e.target.value)} placeholder="Action mise en place…" />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                      <Field label="Type">
                        <select className="select" style={{ width: "100%" }} value={a.type} onChange={(e) => updateAction(i, "type", e.target.value)}>
                          <option>Corrective</option>
                          <option>Préventive</option>
                          <option>Immédiate</option>
                        </select>
                      </Field>
                      <Field label="Responsable">
                        <input className="input" style={{ width: "100%" }} value={a.responsable} onChange={(e) => updateAction(i, "responsable", e.target.value)} placeholder="Nom…" />
                      </Field>
                      <Field label="Échéance">
                        <input type="date" className="input" style={{ width: "100%" }} value={a.echeance} onChange={(e) => updateAction(i, "echeance", e.target.value)} />
                      </Field>
                      <Field label="Statut">
                        <select className="select" style={{ width: "100%" }} value={a.statut} onChange={(e) => updateAction(i, "statut", e.target.value)}>
                          <option>À faire</option>
                          <option>En cours</option>
                          <option>Terminé</option>
                          <option>Non réalisable</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addAction}
                style={{ border: "1px dashed var(--border)", borderRadius: "var(--r-md)", background: "none", padding: 10, cursor: "pointer", color: "var(--inkLight)", fontWeight: 600, fontSize: 13 }}
              >
                + Ajouter une action
              </button>
            </div>
          )}

          {/* ── D7 Vérification d'efficacité ── */}
          {step === 7 && (
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Méthode de vérification">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {VERIF_EFFICACITE.map((m) => (
                    <label key={m} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" name="verif" value={m} checked={data.methode_verif === m} onChange={() => set("methode_verif", m)} />
                      {m}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Résultat">
                <div style={{ display: "flex", gap: 12 }}>
                  {RESULTAT_VERIF.map((r) => (
                    <label key={r} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" name="resultat" value={r} checked={data.resultat_verif === r} onChange={() => set("resultat_verif", r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Date de vérification">
                <input type="date" className="input" value={data.date_verif} onChange={(e) => set("date_verif", e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── D8 Clôture ── */}
          {step === 8 && (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="grid2">
                <Field label="Responsable Qualité">
                  <input className="input" style={{ width: "100%" }} value={data.responsable_qualite} onChange={(e) => set("responsable_qualite", e.target.value)} placeholder="Nom…" />
                </Field>
                <Field label="Date de clôture">
                  <input type="date" className="input" style={{ width: "100%" }} value={data.date_cloture} onChange={(e) => set("date_cloture", e.target.value)} />
                </Field>
              </div>
              <Field label="NC récurrente ?">
                <div style={{ display: "flex", gap: 16 }}>
                  {["Oui", "Non"].map((v) => (
                    <label key={v} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" name="recurrente" value={v} checked={data.recurrente === v} onChange={() => set("recurrente", v)} />
                      {v}
                    </label>
                  ))}
                </div>
              </Field>

              {/* Récap */}
              <div className="panel" style={{ background: "var(--surfaceAlt)" }}>
                <div className="panelTitle">Récapitulatif</div>
                <div className="kv" style={{ marginTop: 8 }}>
                  {[
                    ["Type NC",         data.type_nc],
                    ["Îlot",            data.ilot],
                    ["Famille princip.",data.famille_principale],
                    ["Cause racine",    data.cause_racine_ishikawa],
                    ["Actions D6",      `${data.actions.length} action(s)`],
                    ["Vérification",    data.resultat_verif],
                  ].map(([k, v]) => (
                    <div key={k} className="kvRow">
                      <div className="kvKey">{k}</div>
                      <div className="kvVal">{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--surfaceAlt)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 && <button className="btn" onClick={() => setStep((s) => s - 1)}>← Précédent</button>}
            {step < 8 && <button className="btn btnPrimary" onClick={() => setStep((s) => s + 1)}>Suivant →</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onCancel}>Annuler</button>
            <button className="btn btnDark" onClick={handleSave}>💾 Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}