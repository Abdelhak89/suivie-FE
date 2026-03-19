// src/pages/DerogationPage.jsx
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import { useAppFE } from "../hooks/useAppFE.js";
import SourceToggle from "../components/SourceToggle.jsx";
import "../styles/DerogationPage.css";
import { getSiteFromJWT } from "../utils/auth.js";

/* ── Helpers ── */
function toIsoShort(v) {
  if (!v) return "";
  const s = String(v).trim().slice(0,10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  return isNaN(d) ? s : d.toISOString().slice(0,10);
}
function fmtDate(v) {
  const s = toIsoShort(v); if (!s) return "";
  const [y,m,d] = s.split("-"); return `${d}/${m}/${y}`;
}
function today() { return new Date().toISOString().slice(0,10); }
function pick(obj, ...keys) { for (const k of keys) if (obj?.[k]) return obj[k]; return ""; }

function buildFicheFromFe(fe) {
  const d = fe?.data || {};
  return {
    numero:        fe.numero_fe      || "",
    of:            fe.code_lancement || pick(d,"N° OF","OF","no_of") || "",
    date:          toIsoShort(fe.date_creation) || today(),
    client:        pick(d,"Client","client") || "",
    commande:      pick(d,"Commande","N° commande","commande") || "",
    ref:           fe.code_article   || "",
    designation:   fe.designation    || "",
    qte_nc:        pick(d,"Quantité Non-Conforme","Qté NC","quantite_nc") || fe.quantite || "",
    qte_cmd:       pick(d,"Quantité Commandée","Qté commandée","quantite_cmd") || "",
    description:   pick(d,"Description du défaut","Details de l'anomalie","Détails de l'anomalie") || fe.description || "",
    causes:        pick(d,"Analyse des causes","Cause probable","Cause") || "",
    action:        pick(d,"Action envisagée","Action immédiate","Actions correctives") || "",
    decision:      pick(d,"Décision","Decision","decision") || "",
    conditions:    pick(d,"Conditions","conditions") || "",
    emetteur_nom:  pick(d,"Emetteur","Nom émetteur") || fe.declarant_nom || "",
    emetteur_fn:   pick(d,"Fonction émetteur") || "",
    emetteur_date: pick(d,"Date émetteur") || today(),
    client_nom:    pick(d,"Nom client","Décideur client") || "",
    client_fn:     pick(d,"Fonction client") || "",
    client_date:   pick(d,"Date client") || "",
  };
}

function emptyForm() {
  return {
    numero:`DER-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}${String(new Date().getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900+100)}`,
    of:"", date:today(), client:"", commande:"", ref:"", designation:"",
    qte_nc:"", qte_cmd:"", description:"", causes:"", action:"",
    decision:"", conditions:"",
    emetteur_nom:"", emetteur_fn:"", emetteur_date:today(),
    client_nom:"", client_fn:"", client_date:"",
  };
}

const DECISIONS = [
  { key:"acceptee",       label:"Acceptée" },
  { key:"refusee",        label:"Refusée" },
  { key:"conditionnelle", label:"Conditionnelle" },
];

const FE_TYPES = [
  { key:"interne",     label:"Interne" },
  { key:"externe",     label:"Externe" },
  { key:"fournisseur", label:"Fournisseur" },
  { key:"fai",         label:"FAI" },
];

/* ── EditField ── */
function EditField({ value, onChange, editing, rows=1, type="text", className="" }) {
  if (!editing) return <div className={`fiche-val ${!value?"empty":""} ${className}`} style={rows>1?{whiteSpace:"pre-wrap",minHeight:rows*22}:{}}>{value||"—"}</div>;
  if (rows > 1) return <textarea className="fiche-val-edit" rows={rows} value={value} onChange={e => onChange(e.target.value)} />;
  return <input className="fiche-val-edit" type={type} value={value} onChange={e => onChange(e.target.value)} />;
}

/* ── FicheDerogation ── */
function FicheDerogation({ data, onChange }) {
  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const set = k => v => onChange({ ...data, [k]: v });
  const handleSave = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const decision = data.decision || "";

  return (
    <div className="fiche-wrap">
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10, gap:8 }}>
        {editing ? (
          <>
            <button className="fiche-edit-badge cancel" onClick={() => setEditing(false)}>Annuler</button>
            <button className={`fiche-edit-badge${saved?" saving":""}`} onClick={handleSave}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {saved ? "Enregistré ✓" : "Valider"}
            </button>
          </>
        ) : (
          <button className="fiche-edit-badge" onClick={() => setEditing(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier la fiche
          </button>
        )}
      </div>

      <div className="fiche">
        <div className="fiche-header">
          <div><div className="fiche-company">KEP METAL</div><div className="fiche-title-tag">Qualité — Non-Conformité</div></div>
          <div className="fiche-header-right">
            <div className="fiche-doc-type">Demande de Dérogation</div>
            <div className="fiche-num">N° OF : {editing ? <input className="fiche-val-edit" style={{ width:120, display:"inline-block" }} value={data.of} onChange={e => set("of")(e.target.value)} /> : (data.of||"—")}</div>
          </div>
        </div>

        <div className="fiche-body">
          <div className="fiche-section">
            <div className="fiche-section-title">① Identification</div>
            <div className="fiche-grid cols3">
              <div className="fiche-field"><div className="fiche-label">Date</div><EditField value={fmtDate(data.date)||data.date} onChange={set("date")} editing={editing} type="date" /></div>
              <div className="fiche-field"><div className="fiche-label">Client</div><EditField value={data.client} onChange={set("client")} editing={editing} /></div>
              <div className="fiche-field"><div className="fiche-label">N° Commande</div><EditField value={data.commande} onChange={set("commande")} editing={editing} /></div>
            </div>
            <div className="fiche-grid">
              <div className="fiche-field"><div className="fiche-label">Référence article</div><EditField value={data.ref} onChange={set("ref")} editing={editing} /></div>
              <div className="fiche-field"><div className="fiche-label">Désignation</div><EditField value={data.designation} onChange={set("designation")} editing={editing} /></div>
            </div>
            <div className="fiche-grid">
              <div className="fiche-field"><div className="fiche-label">Quantité Non-Conforme</div><EditField value={data.qte_nc} onChange={set("qte_nc")} editing={editing} type="number" /></div>
              <div className="fiche-field"><div className="fiche-label">Quantité Commandée</div><EditField value={data.qte_cmd} onChange={set("qte_cmd")} editing={editing} type="number" /></div>
            </div>
          </div>

          <div className="fiche-section">
            <div className="fiche-section-title">② Description du défaut</div>
            <div className="fiche-grid"><div className="fiche-field span2"><EditField value={data.description} onChange={set("description")} editing={editing} rows={5} className="xl" /></div></div>
          </div>

          <div className="fiche-section">
            <div className="fiche-section-title">③ Analyse des causes</div>
            <div className="fiche-grid"><div className="fiche-field span2"><EditField value={data.causes} onChange={set("causes")} editing={editing} rows={4} className="big" /></div></div>
          </div>

          <div className="fiche-section">
            <div className="fiche-section-title">④ Action envisagée</div>
            <div className="fiche-grid"><div className="fiche-field span2"><EditField value={data.action} onChange={set("action")} editing={editing} rows={4} className="big" /></div></div>
          </div>

          <div className="fiche-section">
            <div className="fiche-section-title">⑤ Décision du client</div>
            <div className="fiche-decision">
              {DECISIONS.map(({ key, label }) => (
                <div key={key} className={`fiche-decision-item ${key} ${decision===key?"on":""}`} style={editing?{cursor:"pointer"}:{}} onClick={() => editing && set("decision")(decision===key?"":key)}>
                  {decision===key && <span className="fiche-decision-dot" />}
                  {label}
                  {editing && decision!==key && <span style={{ fontSize:9, opacity:.4 }}>▶</span>}
                </div>
              ))}
            </div>
            {(decision==="conditionnelle"||data.conditions) && (
              <div style={{ padding:"0 24px 0" }}>
                <div className="fiche-label" style={{ marginTop:10, marginBottom:4 }}>Conditions / Restrictions</div>
                {editing ? <textarea className="fiche-val-edit" rows={3} value={data.conditions} onChange={e => set("conditions")(e.target.value)} /> : <div className="fiche-conditions-box">{data.conditions||"—"}</div>}
              </div>
            )}
            <div className="fiche-sign-grid" style={{ gridTemplateColumns:"1fr" }}>
              <div className="fiche-sign-block">
                <div className="fiche-sign-title">Représentant client</div>
                <div className="fiche-sign-row">
                  {[["client_nom","Nom"],["client_fn","Fonction"],["client_date","Date"]].map(([k,l]) => (
                    <div key={k} className="fiche-sign-field">
                      <div className="fiche-sign-label">{l}</div>
                      {editing ? <input className="fiche-val-edit" type={k==="client_date"?"date":"text"} value={data[k]} onChange={e => set(k)(e.target.value)} /> : <div className="fiche-sign-line" style={{ fontSize:13, paddingTop:4 }}>{k==="client_date"?fmtDate(data[k]):data[k]||""}</div>}
                    </div>
                  ))}
                  <div className="fiche-sign-field"><div className="fiche-sign-label">Visa</div><div className="fiche-sign-line" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="fiche-section">
            <div className="fiche-section-title">⑥ Émetteur KEP METAL</div>
            <div className="fiche-sign-grid" style={{ gridTemplateColumns:"1fr" }}>
              <div className="fiche-sign-block">
                <div className="fiche-sign-row" style={{ gridTemplateColumns:"1fr 1fr 1fr 1fr" }}>
                  {[["emetteur_nom","Nom"],["emetteur_fn","Fonction"],["emetteur_date","Date"]].map(([k,l]) => (
                    <div key={k} className="fiche-sign-field">
                      <div className="fiche-sign-label">{l}</div>
                      {editing ? <input className="fiche-val-edit" type={k==="emetteur_date"?"date":"text"} value={data[k]} onChange={e => set(k)(e.target.value)} /> : <div className="fiche-sign-line" style={{ fontSize:13, paddingTop:4 }}>{k==="emetteur_date"?fmtDate(data[k]):data[k]||""}</div>}
                    </div>
                  ))}
                  <div className="fiche-sign-field"><div className="fiche-sign-label">Visa</div><div className="fiche-sign-line" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fiche-footer">
          <span className="fiche-footer-ref">KEP METAL — Doc. Qualité · REF : KM-DER-001 · Rev.02</span>
          <span className="fiche-footer-ref">{data.numero||""}</span>
        </div>
      </div>
    </div>
  );
}

/* ── FormulaireCreation ── */
function FormulaireCreation({ onPreview }) {
  const [form, setForm] = useState(emptyForm());
  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const reset = () => setForm(emptyForm());

  return (
    <div className="form-wrap">
      <div className="form-card">
        <div className="form-head">
          <div><div className="form-head-title">Nouvelle Demande de Dérogation</div><div className="form-head-sub">{form.numero}</div></div>
          <button className="dero-btn" style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff" }} onClick={reset}>Réinitialiser</button>
        </div>
        <div className="form-body">
          <div>
            <div className="form-section-label">① Identification</div>
            <div className="form-row cols3">
              <div className="form-field"><label className="form-flabel">Date</label><input type="date" className="form-input" value={form.date} onChange={set("date")} /></div>
              <div className="form-field"><label className="form-flabel">N° OF / Lancement</label><input className="form-input" placeholder="L2026-XXXX" value={form.of} onChange={set("of")} /></div>
              <div className="form-field"><label className="form-flabel">N° Commande</label><input className="form-input" placeholder="CMD-XXX" value={form.commande} onChange={set("commande")} /></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label className="form-flabel">Client</label><input className="form-input" placeholder="Nom du client" value={form.client} onChange={set("client")} /></div>
              <div className="form-field span2"><label className="form-flabel">Référence article</label><input className="form-input" placeholder="ex. 123456A" value={form.ref} onChange={set("ref")} /></div>
            </div>
            <div className="form-row full"><div className="form-field"><label className="form-flabel">Désignation</label><input className="form-input" placeholder="Description de la pièce" value={form.designation} onChange={set("designation")} /></div></div>
            <div className="form-row">
              <div className="form-field"><label className="form-flabel">Quantité Non-Conforme</label><input type="number" className="form-input" min="0" placeholder="0" value={form.qte_nc} onChange={set("qte_nc")} /></div>
              <div className="form-field"><label className="form-flabel">Quantité Commandée</label><input type="number" className="form-input" min="0" placeholder="0" value={form.qte_cmd} onChange={set("qte_cmd")} /></div>
            </div>
          </div>
          <div><div className="form-section-label">② Description du défaut</div><div className="form-row full"><div className="form-field"><textarea className="form-textarea" rows={5} placeholder="Décrivez précisément le défaut constaté…" value={form.description} onChange={set("description")} /></div></div></div>
          <div><div className="form-section-label">③ Analyse des causes</div><div className="form-row full"><div className="form-field"><textarea className="form-textarea" rows={4} placeholder="Cause(s) identifiée(s)…" value={form.causes} onChange={set("causes")} /></div></div></div>
          <div><div className="form-section-label">④ Action envisagée</div><div className="form-row full"><div className="form-field"><textarea className="form-textarea" rows={4} placeholder="Action corrective / curative proposée…" value={form.action} onChange={set("action")} /></div></div></div>
          <div>
            <div className="form-section-label">⑤ Décision du client</div>
            <div className="form-decision">
              {DECISIONS.map(({ key, label }) => (
                <button key={key} className={`form-decision-btn ${key} ${form.decision===key?"on":""}`} onClick={() => setForm(p => ({ ...p, decision:p.decision===key?"":key }))}>{label}</button>
              ))}
            </div>
            {form.decision==="conditionnelle" && <div className="form-field" style={{ marginTop:10 }}><label className="form-flabel">Conditions / Restrictions</label><textarea className="form-textarea" rows={3} placeholder="Décrire les conditions d'acceptation…" value={form.conditions} onChange={set("conditions")} /></div>}
          </div>
          <div>
            <div className="form-section-label">⑥ Émetteur KEP METAL</div>
            <div className="form-row cols3">
              <div className="form-field"><label className="form-flabel">Nom</label><input className="form-input" placeholder="Nom prénom" value={form.emetteur_nom} onChange={set("emetteur_nom")} /></div>
              <div className="form-field"><label className="form-flabel">Fonction</label><input className="form-input" placeholder="Responsable qualité…" value={form.emetteur_fn} onChange={set("emetteur_fn")} /></div>
              <div className="form-field"><label className="form-flabel">Date</label><input type="date" className="form-input" value={form.emetteur_date} onChange={set("emetteur_date")} /></div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button className="dero-btn blue" style={{ padding:"10px 24px" }} onClick={() => onPreview(form)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Prévisualiser la fiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MailModal ── */
function MailModal({ data, onClose }) {
  const [to,  setTo]  = useState("qualite@kep-metal.fr");
  const [cc,  setCc]  = useState("");
  const [msg, setMsg] = useState(`Bonjour,\n\nVeuillez trouver ci-joint la demande de dérogation ${data?.numero||""} concernant la référence ${data?.ref||""} (${data?.designation||""}).\n\nCordialement,\n${data?.emetteur_nom||"Service Qualité"} — KEP METAL`);
  const [sent, setSent] = useState(false);

  const send = () => {
    const subject = encodeURIComponent(`Demande de dérogation ${data?.numero||""} — Réf. ${data?.ref||""}`);
    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${encodeURIComponent(msg)}`;
    setSent(true); setTimeout(onClose, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">📧 Envoyer la dérogation par mail</div>
        <div className="modal-field"><label className="modal-label">Destinataire</label><input className="modal-input" value={to} onChange={e => setTo(e.target.value)} /></div>
        <div className="modal-field"><label className="modal-label">CC</label><input className="modal-input" value={cc} onChange={e => setCc(e.target.value)} /></div>
        <div className="modal-field"><label className="modal-label">Message</label><textarea className="modal-textarea" rows={6} value={msg} onChange={e => setMsg(e.target.value)} /></div>
        <div style={{ fontSize:11, color:"var(--inkLight)" }}>* Ouvre votre client mail. Joignez le PDF si nécessaire.</div>
        <div className="modal-footer">
          <button className="dero-btn" onClick={onClose}>Annuler</button>
          <button className="dero-btn blue" onClick={send}>{sent ? "✅ Ouverture…" : "Ouvrir dans le mail"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function DerogationPage() {
  const [annee,      setAnnee]      = useState("2026");
  const [feType,     setFeType]     = useState("");
  const [q,          setQ]          = useState("");
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [source,     setSource]     = useState("diapason");
  const [mode,       setMode]       = useState("fe");
  const [view,       setView]       = useState("form");
  const [selectedNum,setSelectedNum]= useState("");
  const [feData,     setFeData]     = useState(null);
  const [ficheData,  setFicheData]  = useState(null);
  const [mailOpen,   setMailOpen]   = useState(false);

  // Source SILOG
  useEffect(() => {
    if (!feType) { setItems([]); return; }
    const ctrl = new AbortController();
    setLoading(true); setSelectedNum(""); setFicheData(null);
    getAllFE({ annee: annee||null, type:feType, limit:500 })
      .then(r => { if (!ctrl.signal.aborted) setItems(r.items||[]); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee, feType]);

  // Source App — type mapping
  const appTypeMap = { interne:"interne", fai:"interne-fai", fournisseur:"fournisseur", externe:"client" };
  const appFE = useAppFE(feType ? (appTypeMap[feType] || "interne") : "interne", { annee });

  // Items actifs selon source
  const activeItems = source === "app" ? appFE.items : items;
  const activeLoading = source === "app" ? appFE.loading : loading;

  const filtered = useMemo(() => {
    if (!q.trim()) return activeItems;
    const s = q.toLowerCase();
    return activeItems.filter(fe => [fe.numero_fe, fe.code_article, fe.designation, fe.code_lancement, fe.numero_of].some(v => v?.toLowerCase().includes(s)));
  }, [activeItems, q]);

  const selectFe = async num => {
    if (!num) return;
    setSelectedNum(num); setMode("fe"); setView("fiche");
    if (source === "app") {
      // FE app — données déjà dans appFE.items
      const fe = appFE.items.find(f => f.numero_fe === num);
      if (fe) { setFeData(fe); setFicheData(buildFicheFromFe(fe)); }
    } else {
      setFeData({ loading:true });
      try { const fe = await getFEByNumero(num); setFeData(fe); setFicheData(buildFicheFromFe(fe)); }
      catch { setFeData({ error:true }); }
    }
  };

  const handlePrint = () => window.print();
  const switchMode = m => { setMode(m); setView(m==="fe"?"fiche":"form"); if (m==="new") { setSelectedNum(""); setFeData(null); setFicheData(null); } };

  const topbarTitle = mode==="new" ? (view==="fiche"?"Aperçu Dérogation":"Nouvelle Dérogation") : (selectedNum ? `Dérogation — ${selectedNum}` : "Demande de Dérogation");

  return (
    <div className="dero">
      {/* ── Sidebar ── */}
      <div className="dero-side">
        <div className="dero-side-top">

          {/* Source toggle */}
          <div>
            <div className="dero-step-label">Source</div>
            <SourceToggle source={source} onChange={s => { setSource(s); setSelectedNum(""); setFicheData(null); }}
              diapasonCount={items.length} appCount={appFE.total} />
          </div>

          <div className="dero-divider" />

          <div>
            <div className="dero-step-label">① Année</div>
            <select className="dero-sel" value={annee} onChange={e => { setAnnee(e.target.value); setFeType(""); }}>
              <option value="2026">2026</option><option value="2025">2025</option>
              <option value="2024">2024</option><option value="">Toutes</option>
            </select>
          </div>

          <div>
            <div className="dero-step-label">② Type de FE</div>
            <div className="dero-type-pills">
              {FE_TYPES.map(({ key, label }) => (
                <button key={key} className={`dero-type-pill ${feType===key?"on":""}`} onClick={() => setFeType(p => p===key?"":key)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="dero-divider" />

          <div>
            <div className="dero-step-label">③ Sélectionner</div>
            <input className="dero-search" placeholder="Rechercher N° / REF / désignation…" value={q} onChange={e => setQ(e.target.value)} disabled={!feType} />
          </div>

          {feType && (
            <div>
              <select className="dero-fe-select" value={selectedNum} onChange={e => selectFe(e.target.value)} disabled={activeLoading||!feType}>
                <option value="">{activeLoading ? "Chargement…" : filtered.length===0 ? "Aucune FE" : `— Choisir (${filtered.length}) —`}</option>
                {filtered.map(fe => (
                  <option key={fe.numero_fe} value={fe.numero_fe}>
                    {fe.numero_fe}{fe.designation?` · ${fe.designation.slice(0,28)}`:""}{fe.code_article?` [${fe.code_article}]`:""}
                  </option>
                ))}
              </select>
              {!activeLoading && filtered.length>0 && <div className="dero-fe-count">{filtered.length} FE{filtered.length>1?"s":""} · {source==="app"?"App":"SILOG"}</div>}
            </div>
          )}

          {!feType && <div style={{ fontSize:12, color:"var(--inkFaint)", textAlign:"center", padding:"8px 0" }}>Choisissez un type pour accéder aux FEs</div>}

          <div className="dero-divider" />
          <button className="dero-new-btn" onClick={() => switchMode("new")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Nouvelle dérogation vierge
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="dero-main">
        <div className="dero-topbar">
          {mode==="new" && (
            <div className="dero-tabs">
              <button className={`dero-tab ${view==="form"?"on":""}`} onClick={() => setView("form")}>Formulaire</button>
              <button className={`dero-tab ${view==="fiche"?"on":""}`} onClick={() => setView("fiche")} disabled={!ficheData}>Aperçu fiche</button>
            </div>
          )}
          <div className="dero-topbar-title">{topbarTitle}</div>
          {ficheData && view==="fiche" && (
            <>
              <button className="dero-btn blue" onClick={() => setMailOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Envoyer par mail
              </button>
              <button className="dero-btn" onClick={handlePrint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Imprimer / PDF
              </button>
            </>
          )}
          {ficheData && <span className="dero-topbar-sub">{ficheData.numero}</span>}
        </div>

        <div className="dero-scroll">
          {mode==="fe" && !selectedNum && (
            <div className="dero-placeholder">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <p>Sélectionne une FE ou crée une nouvelle dérogation.</p>
            </div>
          )}
          {mode==="fe" && selectedNum && feData?.loading && <div className="dero-placeholder"><p>Chargement de la FE…</p></div>}
          {mode==="fe" && selectedNum && feData?.error && <div className="dero-placeholder" style={{ color:"var(--red)" }}><p>Impossible de charger cette FE.</p></div>}
          {mode==="fe" && ficheData && !feData?.loading && !feData?.error && <FicheDerogation data={ficheData} onChange={setFicheData} />}
          {mode==="new" && view==="form" && <FormulaireCreation onPreview={d => { setFicheData(d); setView("fiche"); }} />}
          {mode==="new" && view==="fiche" && ficheData && <FicheDerogation data={ficheData} onChange={setFicheData} />}
          {mode==="new" && view==="fiche" && !ficheData && <div className="dero-placeholder"><p>Remplis le formulaire d'abord.</p></div>}
        </div>
      </div>

      {mailOpen && ficheData && <MailModal data={ficheData} onClose={() => setMailOpen(false)} />}
    </div>
  );
}