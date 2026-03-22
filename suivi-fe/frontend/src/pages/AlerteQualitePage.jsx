// src/pages/AlerteQualitePage.jsx
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import { useAppFE } from "../hooks/useAppFE.js";
import "../styles/AlerteQualitePage.css";
import { useContestees } from "../hooks/useContestees.js";

const PRINT_CSS = `
@media print {
  .aq-side, .aq-topbar, .fiche-wrap > div:first-child,
  .fiche-photo-add, .fiche-photo-del-btn,
  .fiche-photo-resize, .fiche-edit-badge,
  .aq-btn, .modal-overlay { display: none !important; }
  .aq { display: block !important; }
  .aq-main { overflow: visible !important; }
  .aq-scroll { overflow: visible !important; height: auto !important; }
  .fiche-wrap { padding: 0 !important; }
  .fiche { box-shadow: none !important; border: none !important; }
  .fiche-photos-print-grid {
    display: flex !important; flex-wrap: wrap !important;
    justify-content: center !important; gap: 10px !important; padding: 8px 0 !important;
  }
  .fiche-photos-print-grid .fiche-photo-item { break-inside: avoid !important; page-break-inside: avoid !important; }
}
`;

function injectPrintCSS() {
  if (document.getElementById("aq-print-css")) return;
  const s = document.createElement("style"); s.id = "aq-print-css"; s.textContent = PRINT_CSS;
  document.head.appendChild(s);
}

function toIsoShort(v) {
  if (!v) return "";
  const s = String(v).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  return isNaN(d) ? s : d.toISOString().slice(0, 10);
}
function fmtDate(v) {
  const s = toIsoShort(v); if (!s) return "";
  const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`;
}
function today() { return new Date().toISOString().slice(0, 10); }
function pick(obj, ...keys) { for (const k of keys) if (obj?.[k]) return obj[k]; return ""; }
function getDesc(fe)    { return pick(fe?.data, "Details de l'anomalie", "Détails de l'anomalie", "Detail de l'anomalie"); }
function getCause(fe)   { return pick(fe?.data, "Cause probable", "Cause"); }
function getAction(fe)  { return pick(fe?.data, "Action immédiate", "Action immediate", "Actions correctives"); }
function getGravite(fe) { return pick(fe?.data, "Gravité", "Gravite", "gravite"); }
function getIlot(fe)    { return pick(fe?.data, "Ilot", "Îlot", "ilot") || fe?.code_ilot || ""; }
function getPhotos(fe) {
  const raw = pick(fe?.data, "photos", "Photos", "photo");
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw).split(",").map(s => s.trim()).filter(Boolean);
}
const ILOT_MAIL = {
  DECOUPE: "decoupe@kep-metal.fr", PLIAGE: "pliage@kep-metal.fr",
  SOUDURE: "soudure@kep-metal.fr", ASSEMBLAGE: "assemblage@kep-metal.fr",
  PEINTURE: "peinture@kep-metal.fr", QUALITE: "qualite@kep-metal.fr",
};
function mailForIlot(ilot) {
  if (!ilot) return "qualite@kep-metal.fr";
  const k = ilot.toUpperCase().replace(/[ÎÔÊÂÛÉÈÀÙËÏÜÇî]/g, c => ({ Î:"I",î:"I",É:"E",È:"E",À:"A",Ù:"U",Ê:"E",Â:"A",Û:"U",Ë:"E",Ï:"I",Ü:"U",Ç:"C" }[c]||c)).replace(/[^A-Z]/g, "");
  return ILOT_MAIL[k] || "qualite@kep-metal.fr";
}
function genNumero() {
  const d = new Date();
  return `AQ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900+100)}`;
}

const GRAVITE_LEVELS = ["Mineure", "Majeure", "Critique"];
const ILOTS_LIST = ["Découpe", "Pliage", "Soudure", "Assemblage", "Peinture", "Contrôle qualité", "Expédition"];
const LIEUX_LIST  = ["Contrôle réception", "En-cours fabrication", "Contrôle final", "Retour client", "Stock"];
const DEFAULT_W = 160, DEFAULT_H = 120;

function photoSrc(p)  { return typeof p === "string" ? p : p?.src || ""; }
function photoW(p)    { return typeof p === "string" ? DEFAULT_W : (p?.w || DEFAULT_W); }
function photoH(p)    { return typeof p === "string" ? DEFAULT_H : (p?.h || DEFAULT_H); }
function toPhotoObj(p){ return typeof p === "string" ? { src: p, w: DEFAULT_W, h: DEFAULT_H } : p; }

function EditField({ value, onChange, editing, tag = "text", options = null, className = "", rows = 1 }) {
  if (!editing) return <div className={`fiche-val ${!value ? "empty" : ""} ${className}`} style={rows > 1 ? { whiteSpace:"pre-wrap", minHeight: rows*22 } : {}}>{value || "—"}</div>;
  if (options) return <select className="fiche-val-edit" value={value} onChange={e => onChange(e.target.value)}><option value="">—</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
  if (rows > 1) return <textarea className="fiche-val-edit" rows={rows} value={value} onChange={e => onChange(e.target.value)} />;
  return <input className="fiche-val-edit" type={tag} value={value} onChange={e => onChange(e.target.value)} />;
}

function PhotoItem({ photo, editing, onDel, onResize, onLightbox }) {
  const [showResize, setShowResize] = useState(false);
  const src = photoSrc(photo), w = photoW(photo), h = photoH(photo);
  return (
    <div style={{ position:"relative", display:"inline-flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ width:w, height:h, borderRadius:8, overflow:"hidden", border:"1.5px solid rgba(0,0,0,0.10)", cursor:editing?"default":"zoom-in", flexShrink:0, background:"#f0f0f0" }} onClick={() => !editing && onLightbox(src)}>
        <img src={src} alt="photo" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }} onError={e => { e.target.style.display="none"; }} />
      </div>
      {editing && (
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <button className="fiche-photo-resize" onClick={() => setShowResize(v => !v)} style={{ fontSize:12, padding:"2px 7px", borderRadius:5, border:"1px solid rgba(0,0,0,0.12)", background:showResize?"#0071e3":"#f5f5f7", color:showResize?"#fff":"#6e6e73", cursor:"pointer" }}>⤢</button>
          <button className="fiche-photo-del-btn" onClick={onDel} style={{ fontSize:12, padding:"2px 7px", borderRadius:5, border:"1px solid rgba(255,59,48,0.3)", background:"#fff0ef", color:"#ff3b30", cursor:"pointer" }}>×</button>
        </div>
      )}
      {editing && showResize && (
        <div style={{ position:"absolute", top:"100%", left:0, zIndex:20, background:"#fff", border:"1.5px solid rgba(0,0,0,0.12)", borderRadius:8, padding:"10px 12px", boxShadow:"0 4px 16px rgba(0,0,0,0.12)", width:200, marginTop:6 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#aeaeb2", textTransform:"uppercase", letterSpacing:".4px", marginBottom:8 }}>Taille de la photo</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6e6e73", marginBottom:3 }}><span>Largeur</span><span style={{ fontWeight:700 }}>{w} px</span></div>
            <input type="range" min={80} max={400} step={10} value={w} onChange={e => onResize(Number(e.target.value), h)} style={{ width:"100%", accentColor:"#0071e3" }} />
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6e6e73", marginBottom:3 }}><span>Hauteur</span><span style={{ fontWeight:700 }}>{h} px</span></div>
            <input type="range" min={60} max={320} step={10} value={h} onChange={e => onResize(w, Number(e.target.value))} style={{ width:"100%", accentColor:"#0071e3" }} />
          </div>
          <button onClick={() => onResize(DEFAULT_W, DEFAULT_H)} style={{ marginTop:8, width:"100%", padding:"4px", fontSize:11, borderRadius:5, border:"1px solid rgba(0,0,0,0.10)", background:"#f5f5f7", color:"#6e6e73", cursor:"pointer" }}>Réinitialiser</button>
        </div>
      )}
    </div>
  );
}

function PhotoZone({ label, icon, borderColor, headerBg, bodyBg, textColor, emptyColor, photos, editing, onAdd, onDel, onResize, onLightbox }) {
  return (
    <div style={{ border:`2px solid ${borderColor}`, borderRadius:10, overflow:"visible", display:"flex", flexDirection:"column" }}>
      <div style={{ background:headerBg, padding:"9px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:`1.5px solid ${borderColor}`, borderRadius:"8px 8px 0 0" }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:13, color:textColor }}>{label}</span>
        <span style={{ marginLeft:"auto", fontSize:11, color:textColor, opacity:.65 }}>{photos.length} photo{photos.length!==1?"s":""}</span>
      </div>
      <div style={{ padding:12, background:bodyBg, flex:1, minHeight:100 }}>
        <div className="fiche-photos-print-grid" style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", alignItems:"flex-start", gap:10, marginBottom:photos.length>0?10:0 }}>
          {photos.map((photo, i) => <PhotoItem key={i} photo={photo} editing={editing} onDel={() => onDel(i)} onResize={(w,h) => onResize(i,w,h)} onLightbox={onLightbox} />)}
        </div>
        {editing && (
          <label className="fiche-photo-add" style={{ borderColor, color:textColor, display:"flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Ajouter une photo</span>
            <input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={onAdd} />
          </label>
        )}
        {photos.length===0 && <div style={{ color:emptyColor, fontStyle:"italic", fontSize:11, textAlign:"center", padding:"12px 0" }}>{label.includes("OK")?"Aucune photo conforme ajoutée":"Aucune photo de défaut ajoutée"}</div>}
      </div>
    </div>
  );
}

function FicheDocument({ data, onChange, onAddPhotoOk, onAddPhotoNok, onDelPhotoOk, onDelPhotoNok, onResizePhotoOk, onResizePhotoNok }) {
  const [lightbox, setLightbox] = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const set = k => v => onChange({ ...data, [k]: v });
  const photos_ok = data.photos_ok || [], photos_nok = data.photos_nok || [];
  const gravite   = data.gravite || "";
  const handleSave = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  
  return (
    <div className="fiche-wrap">
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10, gap:8 }}>
        {editing ? (
          <>
            <button className="fiche-edit-badge" style={{ background:"rgba(220,38,38,.1)", borderColor:"#fca5a5", color:"#dc2626" }} onClick={() => setEditing(false)}>Annuler</button>
            <button className="fiche-edit-badge saving" onClick={handleSave}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{saved?"Enregistré ✓":"Valider les modifications"}</button>
          </>
        ) : (
          <button className="fiche-edit-badge" onClick={() => setEditing(true)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Modifier la fiche</button>
        )}
      </div>
      <div className="fiche">
        <div className="fiche-header">
          <div className="fiche-header-left"><div className="fiche-company">KEP METAL</div><div className="fiche-title-tag">Alerte Qualité — Fiche Non-Conformité</div></div>
          <div className="fiche-header-right"><div className="fiche-num">{data.numero||"—"}</div><div className="fiche-date-label">Émise le {fmtDate(data.date)||fmtDate(today())}</div></div>
        </div>
        <div className="fiche-gravite">
          {GRAVITE_LEVELS.map(g => (
            <div key={g} className={`fiche-grav-item ${g.toLowerCase()} ${gravite===g?"on":""}`} style={editing?{cursor:"pointer"}:{}} onClick={() => editing && set("gravite")(gravite===g?"":g)}>
              {gravite===g && <span className="fiche-grav-dot" />}{g}{editing&&gravite!==g&&<span style={{ fontSize:9, opacity:.5, marginLeft:2 }}>▶</span>}
            </div>
          ))}
        </div>
        <div className="fiche-body">
          <div className="fiche-section">
            <div className="fiche-section-title">① Identification</div>
            <div className="fiche-grid cols3">
              <div className="fiche-field"><div className="fiche-label">Îlot / Zone</div><EditField value={data.ilot} onChange={set("ilot")} editing={editing} options={ILOTS_LIST} /></div>
              <div className="fiche-field"><div className="fiche-label">Référence article</div><EditField value={data.ref} onChange={set("ref")} editing={editing} /></div>
              <div className="fiche-field"><div className="fiche-label">N° Lancement</div><EditField value={data.lancement} onChange={set("lancement")} editing={editing} /></div>
            </div>
            <div className="fiche-grid">
              <div className="fiche-field"><div className="fiche-label">Désignation article</div><EditField value={data.designation} onChange={set("designation")} editing={editing} /></div>
              <div className="fiche-field"><div className="fiche-label">Lieu de détection</div><EditField value={data.lieu} onChange={set("lieu")} editing={editing} options={LIEUX_LIST} /></div>
            </div>
            <div className="fiche-grid">
              <div className="fiche-field"><div className="fiche-label">Quantité concernée</div><EditField value={data.quantite} onChange={set("quantite")} editing={editing} tag="number" /></div>
              <div className="fiche-field"><div className="fiche-label">Opérateur / Détecteur</div><EditField value={data.operateur} onChange={set("operateur")} editing={editing} /></div>
            </div>
          </div>
          <div className="fiche-section">
            <div className="fiche-section-title">② Description de l'anomalie</div>
            <div className="fiche-grid"><div className="fiche-field span2"><div className="fiche-label">Détails de l'anomalie</div><EditField value={data.description} onChange={set("description")} editing={editing} rows={4} className="big" /></div></div>
          </div>
          <div className="fiche-section">
            <div className="fiche-section-title">③ Photos comparatives{(photos_ok.length+photos_nok.length)>0&&<span style={{ marginLeft:10, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:8, background:"#f0f0f0", color:"#6e6e73" }}>{photos_ok.length+photos_nok.length} au total</span>}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <PhotoZone label="Pièce conforme — OK" icon="✅" borderColor="#30d158" headerBg="#d1fae5" bodyBg="#f0fdf4" textColor="#065f46" emptyColor="#6ee7b7" photos={photos_ok} editing={editing} onAdd={onAddPhotoOk} onDel={onDelPhotoOk} onResize={onResizePhotoOk} onLightbox={setLightbox} />
              <PhotoZone label="Pièce non conforme — NOK" icon="❌" borderColor="#ff3b30" headerBg="#fee2e2" bodyBg="#fff5f5" textColor="#7f1d1d" emptyColor="#fca5a5" photos={photos_nok} editing={editing} onAdd={onAddPhotoNok} onDel={onDelPhotoNok} onResize={onResizePhotoNok} onLightbox={setLightbox} />
            </div>
          </div>
          <div className="fiche-section">
            <div className="fiche-section-title">④ Visas</div>
            <div className="fiche-sign">{["Émis par","Validé par (Qualité)","Responsable îlot"].map(l => <div className="fiche-sign-box" key={l}><div className="fiche-sign-label">{l}</div><div className="fiche-sign-line" /></div>)}</div>
          </div>
        </div>
        <div className="fiche-footer"><span className="fiche-footer-ref">KEP METAL — Doc. Qualité · REF : KM-AQ-001 · Rev.04</span><span className="fiche-footer-ref">{data.numero||""}</span></div>
      </div>
      {lightbox && <div className="fiche-lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="zoom" /></div>}
    </div>
  );
}

function emptyForm() {
  return { numero:genNumero(), date:today(), gravite:"", ilot:"", ref:"", lancement:"", designation:"", lieu:"", quantite:"", operateur:"", description:"", cause:"", action:"", photos_ok:[], photos_nok:[] };
}

function FormulaireCreation({ onPreview }) {
  const [form, setForm] = useState(emptyForm());
  const [lightbox, setLightbox] = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const addPhotos = (e, type) => { const key = type==="ok"?"photos_ok":"photos_nok"; Array.from(e.target.files).forEach(f => { const r=new FileReader(); r.onload=ev=>setForm(p=>({...p,[key]:[...(p[key]||[]),toPhotoObj(ev.target.result)]})); r.readAsDataURL(f); }); e.target.value=""; };
  const delPhoto  = (i, type) => { const key=type==="ok"?"photos_ok":"photos_nok"; setForm(p=>({...p,[key]:(p[key]||[]).filter((_,j)=>j!==i)})); };
  const resizePhoto = (i, type, w, h) => { const key=type==="ok"?"photos_ok":"photos_nok"; setForm(p=>({...p,[key]:(p[key]||[]).map((ph,j)=>j===i?{...toPhotoObj(ph),w,h}:ph)})); };
  const reset = () => setForm(emptyForm());
  const photosOk=form.photos_ok||[], photosNok=form.photos_nok||[];
  return (
    <div className="form-wrap">
      <div className="form-card">
        <div className="form-head"><div><div className="form-head-title">Nouvelle Alerte Qualité</div><div className="form-head-sub">{form.numero}</div></div><button className="aq-btn" style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff" }} onClick={reset}>Réinitialiser</button></div>
        <div className="form-body">
          <div><div className="form-section-label">Gravité</div><div className="form-grav">{GRAVITE_LEVELS.map(g=><button key={g} className={`form-grav-btn ${g.toLowerCase()} ${form.gravite===g?"on":""}`} onClick={()=>setForm(p=>({...p,gravite:p.gravite===g?"":g}))}>{g}</button>)}</div></div>
          <div>
            <div className="form-section-label">① Identification</div>
            <div className="form-row cols3">
              <div className="form-field"><label className="form-flabel">Date</label><input type="date" className="form-input" value={form.date} onChange={set("date")} /></div>
              <div className="form-field"><label className="form-flabel">Îlot / Zone</label><select className="form-select" value={form.ilot} onChange={set("ilot")}><option value="">— Choisir —</option>{ILOTS_LIST.map(il=><option key={il}>{il}</option>)}</select></div>
              <div className="form-field"><label className="form-flabel">Lieu de détection</label><select className="form-select" value={form.lieu} onChange={set("lieu")}><option value="">— Choisir —</option>{LIEUX_LIST.map(l=><option key={l}>{l}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label className="form-flabel">Référence article</label><input className="form-input" placeholder="ex. 123456A" value={form.ref} onChange={set("ref")} /></div>
              <div className="form-field"><label className="form-flabel">N° Lancement</label><input className="form-input" placeholder="ex. L2024-0089" value={form.lancement} onChange={set("lancement")} /></div>
            </div>
            <div className="form-row"><div className="form-field span2"><label className="form-flabel">Désignation article</label><input className="form-input" value={form.designation} onChange={set("designation")} /></div></div>
            <div className="form-row">
              <div className="form-field"><label className="form-flabel">Quantité concernée</label><input className="form-input" type="number" min="1" value={form.quantite} onChange={set("quantite")} /></div>
              <div className="form-field"><label className="form-flabel">Opérateur / Détecteur</label><input className="form-input" value={form.operateur} onChange={set("operateur")} /></div>
            </div>
          </div>
          <div><div className="form-section-label">② Description de l'anomalie</div><div className="form-row full"><div className="form-field"><label className="form-flabel">Détails</label><textarea className="form-textarea" rows={4} value={form.description} onChange={set("description")} /></div></div></div>
          <div>
            <div className="form-section-label">③ Analyse &amp; Actions</div>
            <div className="form-row">
              <div className="form-field"><label className="form-flabel">Cause probable</label><textarea className="form-textarea" rows={3} value={form.cause} onChange={set("cause")} /></div>
              <div className="form-field"><label className="form-flabel">Action immédiate</label><textarea className="form-textarea" rows={3} value={form.action} onChange={set("action")} /></div>
            </div>
          </div>
          <div>
            <div className="form-section-label">④ Photos comparatives OK / NOK</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ border:"2px solid #30d158", borderRadius:10, overflow:"visible" }}>
                <div style={{ background:"#d1fae5", padding:"9px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"1.5px solid #30d158", borderRadius:"8px 8px 0 0" }}><span>✅</span><span style={{ fontWeight:700, fontSize:13, color:"#065f46" }}>Pièce conforme — OK</span></div>
                <div style={{ padding:12, background:"#f0fdf4" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10, marginBottom:photosOk.length?10:0 }}>{photosOk.map((ph,i)=><PhotoItem key={i} photo={ph} editing onDel={()=>delPhoto(i,"ok")} onResize={(w,h)=>resizePhoto(i,"ok",w,h)} onLightbox={setLightbox} />)}</div>
                  <label className="form-upload-zone" style={{ borderColor:"#30d158" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style={{ color:"#065f46" }}>Ajouter photo OK</span><input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>addPhotos(e,"ok")} /></label>
                  {photosOk.length===0&&<div style={{ fontSize:11, color:"#6ee7b7", fontStyle:"italic", marginTop:6 }}>Photo de référence conforme</div>}
                </div>
              </div>
              <div style={{ border:"2px solid #ff3b30", borderRadius:10, overflow:"visible" }}>
                <div style={{ background:"#fee2e2", padding:"9px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"1.5px solid #ff3b30", borderRadius:"8px 8px 0 0" }}><span>❌</span><span style={{ fontWeight:700, fontSize:13, color:"#7f1d1d" }}>Pièce non conforme — NOK</span></div>
                <div style={{ padding:12, background:"#fff5f5" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10, marginBottom:photosNok.length?10:0 }}>{photosNok.map((ph,i)=><PhotoItem key={i} photo={ph} editing onDel={()=>delPhoto(i,"nok")} onResize={(w,h)=>resizePhoto(i,"nok",w,h)} onLightbox={setLightbox} />)}</div>
                  <label className="form-upload-zone" style={{ borderColor:"#ff3b30" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style={{ color:"#7f1d1d" }}>Ajouter photo NOK</span><input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>addPhotos(e,"nok")} /></label>
                  {photosNok.length===0&&<div style={{ fontSize:11, color:"#fca5a5", fontStyle:"italic", marginTop:6 }}>Photo du défaut constaté</div>}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button className="aq-btn primary" style={{ padding:"10px 24px" }} onClick={() => onPreview(form)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Prévisualiser la fiche
            </button>
          </div>
        </div>
      </div>
      {lightbox && <div className="fiche-lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="zoom" /></div>}
    </div>
  );
}

function MailModal({ data, onClose }) {
  const [to,  setTo]  = useState(mailForIlot(data?.ilot));
  const [cc,  setCc]  = useState("qualite@kep-metal.fr");
  const [msg, setMsg] = useState(`Bonjour,\n\nVeuillez trouver ci-joint l'alerte qualité ${data?.numero||""}.\n\nCordialement,\nService Qualité KEP METAL`);
  const [sent, setSent] = useState(false);
  const send = () => { window.location.href=`mailto:${to}?cc=${cc}&subject=${encodeURIComponent(`Alerte Qualité ${data?.numero||""} — ${data?.ilot||""}`)}&body=${encodeURIComponent(msg)}`; setSent(true); setTimeout(onClose, 1200); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">📧 Envoyer la fiche par mail</div>
        <div className="modal-field"><label className="modal-label">Destinataire</label><input className="modal-input" value={to} onChange={e=>setTo(e.target.value)} /></div>
        <div className="modal-field"><label className="modal-label">CC</label><input className="modal-input" value={cc} onChange={e=>setCc(e.target.value)} /></div>
        <div className="modal-field"><label className="modal-label">Message</label><textarea className="modal-textarea" rows={5} value={msg} onChange={e=>setMsg(e.target.value)} /></div>
        <div style={{ fontSize:11, color:"var(--sub)", marginTop:-6 }}>* Ouvre votre client mail avec les champs pré-remplis.</div>
        <div className="modal-footer"><button className="aq-btn" onClick={onClose}>Annuler</button><button className="aq-btn blue" onClick={send}>{sent?"✅ Ouverture…":"Ouvrir dans le mail"}</button></div>
      </div>
    </div>
  );
}

const FE_TYPES = [
  { key:"interne",     label:"Interne"     },
  { key:"externe",     label:"Externe"     },
  { key:"fournisseur", label:"Fournisseur" },
  { key:"fai",         label:"FAI"         },
];

const TYPE_MAP_APP = {
  interne:     "nc_interne",
  fournisseur: "nc_fournisseur",
  fai:         "nc_interne",
  externe:     "nc_client",
};

export default function AlerteQualitePage() {
  const [annee,      setAnnee]      = useState("2026");
  const [feType,     setFeType]     = useState("");
  const [q,          setQ]          = useState("");
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [mode,       setMode]       = useState("fe");
  const [view,       setView]       = useState("form");
  const [selectedNum, setSelectedNum] = useState("");
  const [feData,      setFeData]      = useState(null);
  const [ficheData,   setFicheData]   = useState(null);
  const [mailOpen,    setMailOpen]    = useState(false);
  const { excludeContestees } = useContestees();

  // ── Source toggle ─────────────────────────────────────────
  const [feSource, setFeSource] = useState("SILOG");

  const appFE = useAppFE(TYPE_MAP_APP[feType] || feType, { q, annee });

  useEffect(() => { injectPrintCSS(); }, []);

  useEffect(() => {
    if (!feType) { setItems([]); return; }
    const ctrl = new AbortController();
    setLoading(true); setSelectedNum(""); setFicheData(null);
    getAllFE({ annee: annee||null, type: feType, limit: 500 })
      .then(r => { if (!ctrl.signal.aborted) setItems(r.items||[]); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee, feType]);

  const filtered = useMemo(() => {
    const base = excludeContestees(items);
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(fe => [fe.numero_fe, fe.code_article, fe.designation, fe.code_lancement].some(v => v?.toLowerCase().includes(s)));
  }, [items, q]);

  // Liste active selon source
  const activeItems = feSource === "app"
    ? excludeContestees(appFE.items).map(fe => ({
        numero_fe:      fe.numero_fe,
        code_article:   fe.code_article,
        designation:    fe.description || fe.designation,
        code_lancement: fe.numero_of,
      }))
    : filtered;

  const selectFe = async (num) => {
    if (!num) return;

    // ── Source App — court-circuit getFEByNumero ──────────────
    if (feSource === "app") {
      const appItem = appFE.items.find(fe => fe.numero_fe === num);
      if (!appItem) return;
      setSelectedNum(num); setFeData(appItem); setMode("fe"); setView("fiche");
      setFicheData({
        numero:      appItem.numero_fe,
        date:        toIsoShort(appItem.date_creation),
        gravite:     appItem.gravite || "",
        ilot:        appItem.ilot || "",
        ref:         appItem.code_article || "",
        lancement:   appItem.numero_of || "",
        designation: appItem.designation || appItem.description || "",
        lieu:        "",
        quantite:    appItem.quantite || "",
        operateur:   appItem.declarant_nom || "",
        description: appItem.description || "",
        cause:       "",
        action:      "",
        photos_ok:   [],
        photos_nok:  [],
      });
      return;
    }

    // ── Source SILOG ───────────────────────────────────────
    setSelectedNum(num); setFeData({ loading: true }); setMode("fe"); setView("fiche");
    try {
      const fe = await getFEByNumero(num);
      setFeData(fe);
      setFicheData({
        numero: fe.numero_fe, date: toIsoShort(fe.date_creation),
        gravite: getGravite(fe), ilot: getIlot(fe),
        ref: fe.code_article, lancement: fe.code_lancement,
        designation: fe.designation, lieu: fe.lieu_detection || "",
        quantite: fe.quantite || "", operateur: fe.operateur || "",
        description: getDesc(fe), cause: getCause(fe), action: getAction(fe),
        photos_ok: [], photos_nok: getPhotos(fe).map(toPhotoObj),
      });
    } catch { setFeData({ error: true }); }
  };

  const addPhoto    = (e, type)    => { const key=type==="ok"?"photos_ok":"photos_nok"; Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setFicheData(p=>({...p,[key]:[...(p[key]||[]),toPhotoObj(ev.target.result)]}));r.readAsDataURL(f);}); e.target.value=""; };
  const delPhoto    = (i, type)    => { const key=type==="ok"?"photos_ok":"photos_nok"; setFicheData(p=>({...p,[key]:(p[key]||[]).filter((_,j)=>j!==i)})); };
  const resizePhoto = (i, type, w, h) => { const key=type==="ok"?"photos_ok":"photos_nok"; setFicheData(p=>({...p,[key]:(p[key]||[]).map((ph,j)=>j===i?{...toPhotoObj(ph),w,h}:ph)})); };

  const handlePrint = () => window.print();
  const switchMode  = m  => { setMode(m); setView(m==="fe"?"fiche":"form"); if(m==="new"){ setSelectedNum(""); setFeData(null); setFicheData(null); } };

  const topbarTitle = mode==="new" ? (view==="fiche"?"Aperçu Fiche Alerte":"Nouvelle Alerte Qualité") : (selectedNum?`Fiche ${selectedNum}`:"Alerte Qualité");

  const ficheProps = ficheData ? {
    data: ficheData, onChange: setFicheData,
    onAddPhotoOk:     e     => addPhoto(e, "ok"),
    onAddPhotoNok:    e     => addPhoto(e, "nok"),
    onDelPhotoOk:     i     => delPhoto(i, "ok"),
    onDelPhotoNok:    i     => delPhoto(i, "nok"),
    onResizePhotoOk:  (i,w,h) => resizePhoto(i,"ok",w,h),
    onResizePhotoNok: (i,w,h) => resizePhoto(i,"nok",w,h),
  } : null;

  return (
    <div className="aq">
      {/* ── SIDEBAR ── */}
      <div className="aq-side">
        <div className="aq-side-top">
          <div>
            <div className="aq-step-label">① Année</div>
            <select className="aq-sel" value={annee} onChange={e => { setAnnee(e.target.value); setFeType(""); }}>
              <option value="2026">2026</option><option value="2025">2025</option>
              <option value="2024">2024</option><option value="">Toutes</option>
            </select>
          </div>
          <div>
            <div className="aq-step-label">② Type de FE</div>
            <div className="aq-type-pills">
              {FE_TYPES.map(({ key, label }) => (
                <button key={key} className={`aq-type-pill ${feType===key?"on":""}`} onClick={() => setFeType(p => p===key?"":key)}>{label}</button>
              ))}
            </div>
          </div>

          {/* ── Toggle source ── */}
          {feType && (
            <div>
              <div className="aq-step-label">③ Source</div>
              <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:"1.5px solid rgba(0,0,0,0.08)", marginBottom:8 }}>
                {[{ key:"SILOG", label:"SILOG" }, { key:"app", label:"App KEP" }].map(({ key, label }) => (
                  <button key={key} onClick={() => { setFeSource(key); setSelectedNum(""); setFicheData(null); }}
                    style={{ flex:1, padding:"7px 0", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .12s",
                      background: feSource===key?"#0071e3":"transparent",
                      color:      feSource===key?"#fff":"#6e6e73" }}>
                    {label}{feSource===key&&feType ? ` (${feSource==="app"?appFE.total:filtered.length})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="aq-divider" />
          <div>
            <div className="aq-step-label">{feType ? "④" : "③"} Sélectionner</div>
            <input className="aq-search" placeholder="Rechercher N° / REF / désignation…" value={q} onChange={e => setQ(e.target.value)} disabled={!feType} />
          </div>

          {feType && (
            <div>
              <select className="aq-fe-select" value={selectedNum} onChange={e => selectFe(e.target.value)} disabled={(feSource==="SILOG"?loading:appFE.loading) || !feType}>
                <option value="">{(feSource==="SILOG"?loading:appFE.loading) ? "Chargement…" : activeItems.length===0 ? "Aucune FE" : `— Choisir une FE (${activeItems.length}) —`}</option>
                {activeItems.map(fe => (
                  <option key={fe.numero_fe} value={fe.numero_fe}>
                    {fe.numero_fe}{fe.designation ? ` · ${String(fe.designation).slice(0,30)}` : ""}{fe.code_article ? ` [${fe.code_article}]` : ""}
                  </option>
                ))}
              </select>
              {!loading && activeItems.length>0 && <div className="aq-fe-count">{activeItems.length} FE{activeItems.length>1?"s":""}</div>}
            </div>
          )}
          {!feType && <div style={{ fontSize:12, color:"var(--sub)", textAlign:"center", padding:"8px 0" }}>Choisissez un type pour accéder aux FEs</div>}
          <div className="aq-divider" />
          <button className="aq-new-btn" onClick={() => switchMode("new")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Nouvelle fiche vierge
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="aq-main">
        <div className="aq-topbar">
          {mode==="new" && (
            <div className="aq-tabs">
              <button className={`aq-tab ${view==="form"?"on":""}`} onClick={() => setView("form")}>Formulaire</button>
              <button className={`aq-tab ${view==="fiche"?"on":""}`} onClick={() => setView("fiche")} disabled={!ficheData}>Aperçu fiche</button>
            </div>
          )}
          <div className="aq-topbar-title">{topbarTitle}</div>
          {ficheData && view==="fiche" && (
            <>
              <button className="aq-btn blue" onClick={() => setMailOpen(true)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Envoyer par mail</button>
              <button className="aq-btn" onClick={handlePrint}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Imprimer / PDF</button>
            </>
          )}
          {ficheData && <span className="aq-topbar-sub">{ficheData.numero}</span>}
        </div>
        <div className="aq-scroll">
          {mode==="fe" && !selectedNum && <div className="aq-placeholder"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><p>Sélectionne une FE dans la liste ou crée une nouvelle fiche.</p></div>}
          {mode==="fe" && selectedNum && feData?.loading && <div className="aq-placeholder"><p>Chargement…</p></div>}
          {mode==="fe" && selectedNum && feData?.error  && <div className="aq-placeholder" style={{ color:"var(--accent)" }}><p>Impossible de charger cette FE.</p></div>}
          {mode==="fe" && ficheData && !feData?.loading && !feData?.error && <FicheDocument {...ficheProps} />}
          {mode==="new" && view==="form"  && <FormulaireCreation onPreview={d => { setFicheData(d); setView("fiche"); }} />}
          {mode==="new" && view==="fiche" && ficheData  && <FicheDocument {...ficheProps} />}
          {mode==="new" && view==="fiche" && !ficheData && <div className="aq-placeholder"><p>Remplis le formulaire d'abord.</p></div>}
        </div>
      </div>
      {mailOpen && ficheData && <MailModal data={ficheData} onClose={() => setMailOpen(false)} />}
    </div>
  );
}