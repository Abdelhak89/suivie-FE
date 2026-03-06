// src/pages/DeclarationFEPage.jsx
// Déclaration nouvelle Fiche Événement — D1 Identification + D2 Description
// Style Apple

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import {
  TYPE_NC,
  DETECTE_PAR,
  FAI_TYPE,
  FOURNISSEUR_SITE,
  TYPES_DEFAUT,
} from "../data/ncData.js";

// ── Données ─────────────────────────────────────────────────────────────────

const STEP_CSS = `
.decl-step-nav {
  display: flex;
  gap: 0;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: ${T.shadow};
}
.decl-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: ${T.font};
  border-right: 1.5px solid ${T.border};
  transition: background .15s;
  text-align: left;
}
.decl-step:last-child { border-right: none; }
.decl-step:hover { background: rgba(0,113,227,.04); }
.decl-step.active { background: rgba(0,113,227,.07); }
.decl-step-num {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
  transition: all .15s;
}
.decl-step.active .decl-step-num {
  background: ${T.accent};
  color: #fff;
}
.decl-step:not(.active) .decl-step-num {
  background: ${T.surfaceAlt};
  border: 1.5px solid ${T.border};
  color: ${T.textSecond};
}
.decl-step.done .decl-step-num {
  background: ${T.greenLight};
  border-color: ${T.green};
  color: ${T.greenText};
}

.decl-type-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: ${T.r};
  border: 1.5px solid ${T.border};
  background: ${T.surface};
  cursor: pointer;
  font-family: ${T.font};
  font-size: 13px;
  font-weight: 500;
  color: ${T.textSecond};
  transition: all .15s;
  text-align: left;
}
.decl-type-btn:hover { border-color: ${T.accent}; color: ${T.accent}; background: rgba(0,113,227,.04); }
.decl-type-btn.active {
  border-color: ${T.accent};
  background: rgba(0,113,227,.08);
  color: ${T.accent};
}

.decl-defaut-card {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 16px;
  box-shadow: ${T.shadow};
  transition: box-shadow .15s;
}
.decl-defaut-card:hover { box-shadow: ${T.shadowMd}; }
`;

const EMPTY_DEFAUT = { defaut: "", ecart: "", exigence: "", moyen_detection: "", type_defaut: "" };

const EMPTY = {
  // D1
  type_nc: "",
  fournisseur_site: "",
  fai_type: "",
  date_detection: new Date().toISOString().slice(0, 10),
  detecte_par: "",
  detecte_par_autre: "",
  client_programme: "",
  numero_of: "",
  code_article: "",
  designation: "",
  code_lancement: "",
  qte_totale: "",
  qte_nc: "",
  // D2
  defauts: [{ ...EMPTY_DEFAUT }],
};

// ── Sous-composants ──────────────────────────────────────────────────────────

function Field({ label, required, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      <label className="ap-label">{label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function TypeBtn({ value, current, icon, onChange, children }) {
  return (
    <button className={`decl-type-btn ${current === value ? "active" : ""}`} onClick={() => onChange(value)}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{value}</div>
        {children && <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>{children}</div>}
      </div>
      {current === value && <span style={{ marginLeft: "auto", color: T.accent, fontSize: 16 }}>✓</span>}
    </button>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="ap-section-divider" style={{ marginTop: 8 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: T.blueLight, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, color: T.textPrimary }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.textSecond, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function DeclarationFEPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    injectGlobalCSS();
    if (document.getElementById("decl-styles")) return;
    const s = document.createElement("style");
    s.id = "decl-styles";
    s.textContent = STEP_CSS;
    document.head.appendChild(s);
  }, []);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const updateDefaut = (i, k, v) => setData(p => ({ ...p, defauts: p.defauts.map((d, idx) => idx === i ? { ...d, [k]: v } : d) }));
  const addDefaut    = () => setData(p => ({ ...p, defauts: [...p.defauts, { ...EMPTY_DEFAUT }] }));
  const removeDefaut = i => setData(p => ({ ...p, defauts: p.defauts.filter((_, idx) => idx !== i) }));

  const d1Complete = data.type_nc && data.date_detection && data.code_article && data.qte_nc;
  const d2Complete = data.defauts.some(d => d.defaut);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: appel API de création FE
      // await createFE(data);
      console.log("Nouvelle FE :", data);
      alert(`FE créée — ${data.type_nc} — ${data.code_article}`);
      navigate(-1);
    } catch (e) {
      alert("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const TYPE_ICONS = {
    "Interne Série": "🔧",
    "FAI":           "📋",
    "Client":        "👥",
    "Fournisseur":   "📦",
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", padding: "24px" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="ap-page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)} style={{ padding: "6px 10px" }}>← Retour</button>
            <div>
              <div className="ap-h1">Déclarer une nouvelle FE</div>
              <div className="ap-sub">Identification D1 + Description du défaut D2</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
          <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving || !d1Complete}>
            {saving ? "Création…" : "✓ Créer la FE"}
          </button>
        </div>
      </div>

      {/* ── Step nav ───────────────────────────────────────────── */}
      <div className="decl-step-nav">
        {[
          { id: 1, label: "Identification",    icon: "🏷️",  done: !!d1Complete },
          { id: 2, label: "Description défaut", icon: "🔎", done: !!d2Complete },
        ].map(s => (
          <button key={s.id} className={`decl-step ${step === s.id ? "active" : ""} ${s.done && step !== s.id ? "done" : ""}`} onClick={() => setStep(s.id)}>
            <div className="decl-step-num">
              {s.done && step !== s.id ? "✓" : s.id}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".4px" }}>
                D{s.id}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          D1 — Identification
      ════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: "grid", gap: 20 }}>

          {/* Type de NC */}
          <div className="ap-card">
            <SectionTitle icon="🏷️" title="Type de non-conformité" subtitle="Sélectionner le type de FE à créer" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {TYPE_NC.map(t => (
                <TypeBtn key={t} value={t} current={data.type_nc} icon={TYPE_ICONS[t]} onChange={v => set("type_nc", v)} />
              ))}
            </div>

            {/* Sous-champs conditionnels */}
            {data.type_nc === "Fournisseur" && (
              <div style={{ marginTop: 14 }}>
                <Field label="Site fournisseur">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {FOURNISSEUR_SITE.map(s => (
                      <label key={s} className={`ap-rpill ${data.fournisseur_site === s ? "active" : ""}`}>
                        <input type="radio" name="fourn_site" style={{ display: "none" }} value={s} checked={data.fournisseur_site === s} onChange={() => set("fournisseur_site", s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            )}
            {data.type_nc === "FAI" && (
              <div style={{ marginTop: 14 }}>
                <Field label="Type FAI">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {FAI_TYPE.map(s => (
                      <label key={s} className={`ap-rpill ${data.fai_type === s ? "active" : ""}`}>
                        <input type="radio" name="fai_type" style={{ display: "none" }} value={s} checked={data.fai_type === s} onChange={() => set("fai_type", s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Détection */}
          <div className="ap-card">
            <SectionTitle icon="📅" title="Détection" subtitle="Quand et par qui a été détectée la NC ?" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field label="Date de détection" required>
                <input type="date" className="ap-input" value={data.date_detection} onChange={e => set("date_detection", e.target.value)} />
              </Field>
              <Field label="Client / Programme">
                <input className="ap-input" value={data.client_programme} onChange={e => set("client_programme", e.target.value)} placeholder="Ex: AIRBUS A320 – 56944053" />
              </Field>
            </div>
            <div style={{ marginTop: 14 }}>
              <Field label="Détecté par">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {DETECTE_PAR.map(d => (
                    <label key={d} className={`ap-rpill ${data.detecte_par === d ? "active" : ""}`}>
                      <input type="radio" name="detecte_par" style={{ display: "none" }} value={d} checked={data.detecte_par === d} onChange={() => set("detecte_par", d)} />
                      {d}
                    </label>
                  ))}
                </div>
              </Field>
              {data.detecte_par === "Autre" && (
                <input className="ap-input" style={{ marginTop: 8, maxWidth: 360 }} value={data.detecte_par_autre} onChange={e => set("detecte_par_autre", e.target.value)} placeholder="Préciser…" />
              )}
            </div>
          </div>

          {/* Article / OF */}
          <div className="ap-card">
            <SectionTitle icon="📦" title="Article & Ordre de fabrication" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field label="N° OF">
                <input className="ap-input" value={data.numero_of} onChange={e => set("numero_of", e.target.value)} placeholder="N° ordre de fabrication" />
              </Field>
              <Field label="Code article / REF" required>
                <input className="ap-input" value={data.code_article} onChange={e => set("code_article", e.target.value)} placeholder="Ex: 141-56944053-568" />
              </Field>
              <Field label="Désignation">
                <input className="ap-input" value={data.designation} onChange={e => set("designation", e.target.value)} placeholder="Désignation de la pièce…" />
              </Field>              
              
            </div>
          </div>

          {/* Quantités */}
          <div className="ap-card">
            <SectionTitle icon="🔢" title="Quantités" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Field label="Quantité totale">
                <input type="number" className="ap-input" value={data.qte_totale} onChange={e => set("qte_totale", e.target.value)} placeholder="0" min="0" />
              </Field>
              <Field label="Quantité NC" required>
                <input type="number" className="ap-input" value={data.qte_nc} onChange={e => set("qte_nc", e.target.value)} placeholder="0" min="0"
                  style={{ borderColor: data.qte_nc ? T.border : T.orange }} />
              </Field>
            </div>
            {data.qte_totale && data.qte_nc && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: T.orangeLight, borderRadius: T.rSm, fontSize: 12, color: T.orangeText, fontWeight: 600 }}>
                Taux NC : {Math.round((Number(data.qte_nc) / Number(data.qte_totale)) * 100)}%
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="ap-btn ap-btn-primary" onClick={() => setStep(2)} disabled={!d1Complete}>
              D2 Description →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          D2 — Description des défauts
      ════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: "grid", gap: 16 }}>

          {/* Récap D1 compact */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 16px", background: T.blueLight, borderRadius: T.r, border: `1.5px solid ${T.border}`, alignItems: "center" }}>
            <span className="ap-badge ap-badge-blue">{data.type_nc}</span>
            {data.code_article && <span style={{ fontSize: 13, fontWeight: 600 }}>{data.code_article}</span>}
            {data.designation && <span style={{ fontSize: 12, color: T.textSecond }}>— {data.designation}</span>}
            {data.qte_nc && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: T.orangeText }}>Qté NC : {data.qte_nc}</span>}
          </div>

          <SectionTitle icon="🔎" title="Description du/des défaut(s)" subtitle="Décrire chaque non-conformité observée" />

          {data.defauts.map((d, i) => (
            <div key={i} className="decl-defaut-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: T.surfaceAlt, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: T.textSecond }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecond }}>Défaut {i + 1}</span>
                </div>
                {data.defauts.length > 1 && (
                  <button className="ap-btn ap-btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removeDefaut(i)}>Supprimer</button>
                )}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Description du défaut observé" required>
                  <textarea className="ap-textarea" rows={3} value={d.defaut} onChange={e => updateDefaut(i, "defaut", e.target.value)} placeholder="Décrire précisément le défaut constaté…" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                 
                  
                  <Field label="Moyen de détection">
                    <input className="ap-input" value={d.moyen_detection} onChange={e => updateDefaut(i, "moyen_detection", e.target.value)} placeholder="Ex: Binoculaire, MMT…" />
                  </Field>
                  <Field label="Type de défaut">
                    <select className="ap-select" value={d.type_defaut} onChange={e => updateDefaut(i, "type_defaut", e.target.value)}>
                      <option value="">— Choisir —</option>
                      {TYPES_DEFAUT.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          ))}

          <button
            style={{ width: "100%", padding: 12, border: `1.5px dashed ${T.border}`, borderRadius: T.r, background: "transparent", color: T.textLight, fontFamily: T.font, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}
            onClick={addDefaut}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textLight; }}
          >
            ＋ Ajouter un défaut
          </button>

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 40 }}>
            <button className="ap-btn" onClick={() => setStep(1)}>← Retour D1</button>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
              <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving || !d1Complete}>
                {saving ? "Création…" : "✓ Créer la FE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}