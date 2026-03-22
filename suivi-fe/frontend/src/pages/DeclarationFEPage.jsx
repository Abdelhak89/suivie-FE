// src/pages/DeclarationFEPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import { getSiteFromJWT } from "../utils/auth.js";
import { TYPE_NC } from "../data/ncData.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const KEP_SITES = [
  { code:"SOUCY", label:"KEP Soucy" },
  { code:"SENS",  label:"KEP Sens"  },
  { code:"LAXOU", label:"KEP Laxou" },
  { code:"KMTM",  label:"KEP KMTM"  },
];
const KEP_SITES_CODES = KEP_SITES.map(s => s.code);
const isKepSite = code => code && code !== "__AUTRE__" && KEP_SITES_CODES.some(k => code.toUpperCase().includes(k));

const MOYENS_DETECTION = [
  "Autocontrôle opérateur","Contrôle en cours de fabrication","Contrôle final",
  "Contrôle à réception","Contrôle par attribut (visuel)","Contrôle dimensionnel",
  "Contrôle tridimensionnel (MMT)","Contrôle par gabarit / jauge",
  "Contrôle étanchéité / pression","Contrôle électrique / fonctionnel",
  "Audit interne","Audit client","Retour client","Contrôle au poste suivant",
  "Système de détection automatique","Autre",
];

const DETECTE_PAR_LIST = [
  "Opérateur","Contrôleur qualité","Responsable qualité","Chef d'îlot",
  "Technicien méthodes","Client","Réception","Audit","Autre",
];

const SITE_COLORS = {
  SOUCY: { bg:"#e8f0fe", color:"#1a56a0", border:"#bad4f7" },
  SENS:  { bg:"#f3e8ff", color:"#6b21a8", border:"#d8b4fe" },
  LAXOU: { bg:"#fff8ed", color:"#b45309", border:"#fcd34d" },
  KMTM:  { bg:"#e8fdf0", color:"#1a7a3f", border:"#86efac" },
};

const STEP_CSS = `
.decl-step-nav{display:flex;gap:0;background:rgba(255,255,255,0.8);backdrop-filter:blur(10px);border:1.5px solid ${T.border};border-radius:${T.r};overflow:hidden;margin-bottom:24px;box-shadow:${T.shadow};}
.decl-step{flex:1;display:flex;align-items:center;gap:10px;padding:14px 18px;cursor:pointer;border:none;background:transparent;font-family:${T.font};border-right:1.5px solid ${T.border};transition:background .15s;text-align:left;}
.decl-step:last-child{border-right:none;}
.decl-step:hover{background:rgba(0,113,227,.04);}
.decl-step.active{background:rgba(0,113,227,.07);}
.decl-step-num{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;transition:all .15s;}
.decl-step.active .decl-step-num{background:${T.accent};color:#fff;}
.decl-step:not(.active) .decl-step-num{background:${T.surfaceAlt};border:1.5px solid ${T.border};color:${T.textSecond};}
.decl-step.done .decl-step-num{background:#e8fdf0;border-color:#30d158;color:#1a7a3f;}
.decl-type-btn{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:${T.r};border:1.5px solid ${T.border};background:${T.surface};cursor:pointer;font-family:${T.font};font-size:13px;font-weight:500;color:${T.textSecond};transition:all .15s;text-align:left;}
.decl-type-btn:hover{border-color:${T.accent};color:${T.accent};background:rgba(0,113,227,.04);}
.decl-type-btn.active{border-color:${T.accent};background:rgba(0,113,227,.08);color:${T.accent};}
.decl-defaut-card{background:${T.surface};border:1.5px solid ${T.border};border-radius:${T.r};padding:16px;box-shadow:${T.shadow};}
.groupe-banner{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:${T.r};background:#e8fdf0;border:1.5px solid rgba(48,209,88,.5);}
@keyframes modalFadeIn{from{opacity:0;transform:scale(0.95) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}
@keyframes stroke{100%{stroke-dashoffset:0;}}
.success-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
.success-card{background:white;padding:40px;border-radius:24px;text-align:center;max-width:400px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.2);animation:modalFadeIn 0.4s cubic-bezier(0.23,1,0.32,1);}
.checkmark-svg{width:80px;height:80px;stroke-width:3;stroke:#30d158;stroke-linecap:round;stroke-linejoin:round;fill:none;margin:0 auto 20px;}
.checkmark-circle{stroke-dasharray:166;stroke-dashoffset:166;animation:stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;}
.checkmark-check{stroke-dasharray:48;stroke-dashoffset:48;animation:stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.5s forwards;}
`;

function SuccessModal({ feNumber, onConfirm }) {
  useEffect(() => {
    const t = setTimeout(() => onConfirm(), 5000);
    return () => clearTimeout(t);
  }, [onConfirm]);
  return (
    <div className="success-overlay">
      <div className="success-card">
        <svg className="checkmark-svg" viewBox="0 0 52 52">
          <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
          <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
        <h2 style={{fontFamily:T.fontDisplay,fontSize:22,fontWeight:700,color:T.textPrimary,marginBottom:8}}>Fiche enregistrée !</h2>
        <p style={{color:T.textSecond,fontSize:15}}>Numéro : <strong style={{color:T.accent}}>{feNumber}</strong></p>
      </div>
    </div>
  );
}

const EMPTY_DEFAUT = { defaut:"", moyen_detection:"", photo:null };
const EMPTY = {
  type_nc:"", fournisseur_site:"", fournisseur_code:"", fournisseur_autre:"", is_groupe:false,
  date_detection:new Date().toISOString().slice(0,10),
  detecte_par:"", detecte_par_autre:"",
  declarant_prenom:"", declarant_nom_libre:"",
  client_programme:"", numero_of:"", code_article:"", designation:"",
  qte_totale:0, qte_nc:"", defauts:[{...EMPTY_DEFAUT}],
};

function Field({ label, required, children, style }) {
  return (
    <div style={{display:"flex",flexDirection:"column",...style}}>
      <label className="ap-label">{label}{required&&<span style={{color:T.red,marginLeft:3}}>*</span>}</label>
      {children}
    </div>
  );
}
function TypeBtn({ value, current, icon, onChange, children }) {
  return (
    <button className={`decl-type-btn ${current===value?"active":""}`} onClick={()=>onChange(value)}>
      {icon&&<span style={{fontSize:18}}>{icon}</span>}
      <div><div style={{fontWeight:700,fontSize:13}}>{value}</div>{children&&<div style={{fontSize:11,color:T.textLight,marginTop:2}}>{children}</div>}</div>
      {current===value&&<span style={{marginLeft:"auto",color:T.accent,fontSize:16}}>✓</span>}
    </button>
  );
}
function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="ap-section-divider" style={{marginTop:8}}>
      <div style={{width:38,height:38,borderRadius:10,background:"#eef4ff",border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontFamily:T.fontDisplay,fontSize:15,fontWeight:700,color:T.textPrimary}}>{title}</div>
        {subtitle&&<div style={{fontSize:12,color:T.textSecond,marginTop:1}}>{subtitle}</div>}
      </div>
    </div>
  );
}
function GroupeBanner({ fournisseurCode }) {
  return (
    <div className="groupe-banner">
      <div style={{fontSize:22}}>🔗</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:T.fontDisplay,fontSize:14,fontWeight:700,color:"#1a7a3f"}}>Classifiée Groupe</div>
        <div style={{fontSize:12,color:"#1a7a3f",opacity:.8,marginTop:2}}>Le fournisseur <strong>{fournisseurCode}</strong> est un site KEP.</div>
      </div>
      <span className="ap-badge ap-badge-green" style={{flexShrink:0}}>Groupe</span>
    </div>
  );
}
function FournisseurSelector({ value, autreValue, externes, loadingExt, onChange, onAutreChange }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <select className="ap-select" value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">— Sélectionner un fournisseur —</option>
        <optgroup label="Sites KEP">{KEP_SITES.map(f=><option key={f.code} value={f.code}>🏭 {f.label}</option>)}</optgroup>
        <optgroup label="Fournisseurs externes">
          {loadingExt?<option disabled>Chargement...</option>:externes.map(f=><option key={f.code} value={f.code}>📦 {f.label}</option>)}
        </optgroup>
        <option value="__AUTRE__">✏️ Autre (saisie libre)</option>
      </select>
      {value==="__AUTRE__"&&<input className="ap-input" placeholder="Nom du fournisseur..." value={autreValue} onChange={e=>onAutreChange(e.target.value)} autoFocus style={{borderColor:T.accent}}/>}
    </div>
  );
}

// ── Quantité d'un OF ─────────────────────────────────────────
function getQteOF(of) { return Number(of?.QuantiteCalculée ?? of?.QuantiteLancee ?? 0) || 0; }

export default function DeclarationFEPage() {
  const navigate = useNavigate();
  const { site: siteParam } = useParams();

  const [step,       setStep]       = useState(1);
  const [data,       setData]       = useState({...EMPTY});
  const [saving,     setSaving]     = useState(false);
  const [loadingOF,  setLoadingOF]  = useState(false);
  const [listeOFs,   setListeOFs]   = useState([]);
  const [multiLS,    setMultiLS]    = useState(false);
  const [externes,   setExternes]   = useState([]);
  const [loadingExt, setLoadingExt] = useState(false);
  const [createdFe,  setCreatedFe]  = useState(null);

  // Site depuis URL (:site) ou JWT — pas de sélection manuelle
  const siteJWT    = getSiteFromJWT();
  const siteChoisi = (siteParam || siteJWT || "").toUpperCase();

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("decl-styles")) {
      const s = document.createElement("style"); s.id="decl-styles"; s.textContent=STEP_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (data.type_nc !== "Fournisseur" || externes.length > 0) return;
    setLoadingExt(true);
    axios.get(`${API}/api/fournisseurs`).then(r=>setExternes(r.data.data||[])).catch(()=>setExternes([])).finally(()=>setLoadingExt(false));
  }, [data.type_nc]);

  const set          = (k,v)   => setData(p=>({...p,[k]:v}));
  const updateDefaut = (i,k,v) => setData(p=>({...p,defauts:p.defauts.map((d,idx)=>idx===i?{...d,[k]:v}:d)}));
  const addDefaut    = ()      => setData(p=>({...p,defauts:[...p.defauts,{...EMPTY_DEFAUT}]}));
  const removeDefaut = i       => setData(p=>({...p,defauts:p.defauts.filter((_,idx)=>idx!==i)}));

  const handleFournisseurChange = code => {
    const groupe = isKepSite(code);
    setData(p=>({...p,fournisseur_code:code,fournisseur_site:code,fournisseur_autre:code!=="__AUTRE__"?"":p.fournisseur_autre,is_groupe:groupe}));
  };

  // ── Toggle Multi-OF : reset complet à chaque bascule ─────
  const toggleMultiLS = () => {
    const next = !multiLS;
    setMultiLS(next);
    setListeOFs([]);
    setData(p=>({...p,numero_of:"",code_article:"",designation:"",client_programme:"",qte_totale:0}));
  };

  const recalcQte = (liste) => liste.reduce((s,of)=>s+getQteOF(of),0);

  const updateOFQte = (codeLancement, field, val) => {
    const liste = listeOFs.map(o => o.CodeLancement===codeLancement ? {...o,[field]:val} : o);
    setListeOFs(liste);
    // Recalcul automatique : qte_totale = somme qte_realisee (ou lancée si vide), qte_nc = somme qte_rebut
    const totalRealise = liste.reduce((s,o) => s + (Number(o._qte_realisee) || getQteOF(o)), 0);
    const totalRebut   = liste.reduce((s,o) => s + (Number(o._qte_rebut)    || 0), 0);
    setData(p => ({
      ...p,
      qte_totale: totalRealise,
      qte_nc:     totalRebut > 0 ? totalRebut : p.qte_nc,
    }));
  };

  const ajouterOF = of => {
    if (listeOFs.find(o=>o.CodeLancement===of.CodeLancement)){alert("Cet OF est déjà ajouté.");return;}
    if (listeOFs.length>0 && listeOFs[0].CodeArticle!==of.CodeArticle){alert(`Article différent (${of.CodeArticle})`);return;}
    const ofAvecQte = { ...of, _qte_realisee:"", _qte_rebut:"" };
    const liste = [...listeOFs, ofAvecQte];
    setListeOFs(liste);
    setData(p=>({...p,numero_of:"",code_article:of.CodeArticle,designation:of.DesignationLct1,client_programme:of.NomClient||p.client_programme,qte_totale:recalcQte(liste)}));
  };

  const supprimerOF = code => {
    const liste = listeOFs.filter(o=>o.CodeLancement!==code);
    setListeOFs(liste);
    setData(p=>({...p,qte_totale:recalcQte(liste),code_article:liste.length===0?"":p.code_article,designation:liste.length===0?"":p.designation,client_programme:liste.length===0?"":p.client_programme}));
  };

  const handleOFBlur = async e => {
    const val = e.target.value.trim(); if (!val) return;
    setLoadingOF(true);
    try {
      const r = await axios.get(`${API}/api/lancements?of_search=${val}`);
      if (r.data.success && r.data.data) {
        const item = r.data.data;
        if (multiLS) { ajouterOF(item); set("numero_of",""); }
        else { setListeOFs([item]); setData(p=>({...p,numero_of:item.CodeLancement,code_article:item.CodeArticle,designation:item.DesignationLct1,client_programme:item.NomClient||p.client_programme,qte_totale:getQteOF(item)})); }
      } else { alert("OF inconnu"); }
    } catch {} finally { setLoadingOF(false); }
  };

  const handlePhotoChange = (idx,e) => {
    const f = e.target.files[0];
    if(f){const r=new FileReader();r.onloadend=()=>updateDefaut(idx,"photo",r.result);r.readAsDataURL(f);}
  };

  const fournisseurOk = data.type_nc!=="Fournisseur"||(data.fournisseur_code&&(data.fournisseur_code!=="__AUTRE__"||data.fournisseur_autre.trim()));
  const declarantOk   = (data.declarant_prenom.trim() && data.declarant_nom_libre.trim());
  const d1Complete    = !!siteChoisi && data.type_nc && data.date_detection && data.code_article && data.qte_nc && fournisseurOk && declarantOk;
  const d2Complete    = data.defauts.some(d=>d.defaut);

  const handleSave = async () => {
    if (!siteChoisi) { alert("Site non déterminé."); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("kep_token");
      const declarantNom = `${data.declarant_prenom} ${data.declarant_nom_libre}`.trim();
      const payload = {
        code_article:     data.code_article,
        designation:      data.designation,
        numero_of:        listeOFs.length>0 ? listeOFs.map(o=>o.CodeLancement).join(", ") : data.numero_of,
        quantite:         data.qte_totale,
        qte_non_conforme: data.qte_nc,
        type_evenement:   data.type_nc,
        description:      data.defauts.map(d=>d.defaut).filter(Boolean).join(" | "),
        moyen_detection:  data.defauts.map(d=>d.moyen_detection).filter(Boolean).join(", ")||null,
        gravite:          "mineur",
        declarant_nom:    declarantNom,
        ilot:             data.client_programme,
        code_fournisseur: data.fournisseur_code!=="__AUTRE__"?data.fournisseur_code:null,
        nom_fournisseur:  data.fournisseur_code==="__AUTRE__"?data.fournisseur_autre:null,
      };
      const res = await axios.post(`${API}/api/nc-fe/${siteChoisi.toLowerCase()}`, payload, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.data.success) setCreatedFe(res.data.numero_fe);
    } catch(e) { alert("Erreur : "+e.message); } finally { setSaving(false); }
  };

  const TYPE_ICONS = { "Interne Série":"🔧","FAI":"📋","Client":"👥","Fournisseur":"📦" };
  const fournisseurLabel = data.fournisseur_code==="__AUTRE__"?data.fournisseur_autre||"Autre":data.fournisseur_code;
  const siteBadge = siteChoisi&&SITE_COLORS[siteChoisi]
    ? {background:SITE_COLORS[siteChoisi].bg,color:SITE_COLORS[siteChoisi].color,border:`1px solid ${SITE_COLORS[siteChoisi].border}`}
    : {background:"#f5f5f7",color:"#555"};

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:"100vh",padding:"24px"}}>
      <div className="ap-page-head">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="ap-btn ap-btn-primary" onClick={()=>navigate(-1)} style={{padding:"6px 10px"}}>← Retour</button>
          <div>
            <div className="ap-h1" style={{display:"flex",alignItems:"center",gap:10}}>
              Déclarer une FE
              {siteChoisi&&<span style={{padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:700,...siteBadge}}>{siteChoisi}</span>}
              {data.is_groupe&&<span className="ap-badge ap-badge-green" style={{fontSize:12}}>🔗 Groupe</span>}
            </div>
            <div className="ap-sub">Identification D1 + Description du défaut D2</div>
          </div>
        </div>
        <button className="ap-btn ap-btn-primary" onClick={()=>navigate(-1)}>Annuler</button>
      </div>

      <div className="decl-step-nav">
        {[{id:1,label:"Identification",done:!!d1Complete},{id:2,label:"Description défaut",done:!!d2Complete}].map(s=>(
          <button key={s.id} className={`decl-step ${step===s.id?"active":""} ${s.done&&step!==s.id?"done":""}`} onClick={()=>setStep(s.id)}>
            <div className="decl-step-num">{s.done&&step!==s.id?"✓":s.id}</div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:T.textLight,textTransform:"uppercase"}}>D{s.id}</div>
              <div style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {step===1&&(
        <div style={{display:"grid",gap:20}}>

          {/* Type NC */}
          <div className="ap-card">
            <SectionTitle icon="🏷️" title="Type de non-conformité"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
              {TYPE_NC.map(t=>(
                <TypeBtn key={t} value={t} current={data.type_nc} icon={TYPE_ICONS[t]}
                  onChange={v=>{if(v!=="Fournisseur")setData(p=>({...p,type_nc:v,fournisseur_code:"",fournisseur_site:"",fournisseur_autre:"",is_groupe:false}));else set("type_nc",v);}}/>
              ))}
            </div>
          </div>

          {data.type_nc==="Fournisseur"&&(
            <div className="ap-card">
              <SectionTitle icon="🏭" title="Fournisseur" subtitle="Les sites KEP basculent automatiquement en Groupe"/>
              <FournisseurSelector value={data.fournisseur_code} autreValue={data.fournisseur_autre} externes={externes} loadingExt={loadingExt} onChange={handleFournisseurChange} onAutreChange={v=>set("fournisseur_autre",v)}/>
              {data.is_groupe&&data.fournisseur_code&&<div style={{marginTop:14}}><GroupeBanner fournisseurCode={data.fournisseur_code}/></div>}
            </div>
          )}

          {/* Détection + Déclarant */}
          <div className="ap-card">
            <SectionTitle icon="📅" title="Détection" subtitle="Quand et par qui ?"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
              <Field label="Date de détection" required>
                <input type="date" className="ap-input" value={data.date_detection} onChange={e=>set("date_detection",e.target.value)}/>
              </Field>
              <Field label="Détecté par">
                <select className="ap-select" value={data.detecte_par} onChange={e=>set("detecte_par",e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {DETECTE_PAR_LIST.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            {/* Nom / Prénom déclarant */}
            <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Field label="Prénom du déclarant" required>
                <input className="ap-input" placeholder="Prénom..." value={data.declarant_prenom} onChange={e=>set("declarant_prenom",e.target.value)}/>
              </Field>
              <Field label="Nom du déclarant" required>
                <input className="ap-input" placeholder="Nom..." value={data.declarant_nom_libre} onChange={e=>set("declarant_nom_libre",e.target.value)}/>
              </Field>
            </div>
          </div>

          {/* Article & OF */}
          <div className="ap-card">
            <SectionTitle icon="📦" title="Article & Ordre de fabrication"/>
            <div style={{display:"grid",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:14,alignItems:"flex-end"}}>
                <Field label={multiLS?"Ajouter un N° OF":"N° OF"}>
                  <div style={{position:"relative"}}>
                    <input className="ap-input" value={data.numero_of} onChange={e=>set("numero_of",e.target.value)} onBlur={handleOFBlur}
                      placeholder={multiLS?"Saisir un OF et Tab…":"Saisir l'OF..."} style={{borderColor:multiLS?T.accent:T.border}}/>
                    {loadingOF&&<div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)"}}>⏳</div>}
                  </div>
                </Field>
                <button type="button" onClick={toggleMultiLS}
                  style={{height:42,padding:"0 15px",borderRadius:T.r,border:`1.5px solid ${multiLS?T.accent:T.border}`,background:multiLS?T.accent:"transparent",color:multiLS?"#fff":T.textSecond,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:8}}>
                  {multiLS?"✓ Mode Multi-OF":"＋ Plusieurs lancements"}
                </button>
              </div>
              <Field label="Client / Programme">
                <input className="ap-input" value={data.client_programme} onChange={e=>set("client_programme",e.target.value)} placeholder="Client automatique..."/>
              </Field>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14}}>
                <Field label="Code article / REF" required><input className="ap-input" value={data.code_article} readOnly style={{background:"#f5f5f7",cursor:"not-allowed"}}/></Field>
                <Field label="Désignation"><input className="ap-input" value={data.designation} readOnly style={{background:"#f5f5f7",cursor:"not-allowed"}}/></Field>
              </div>
              {multiLS&&listeOFs.length>0&&(
                <div style={{padding:"12px",background:"rgba(0,113,227,0.05)",borderRadius:T.r,border:`1px dashed ${T.accent}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.accent,marginBottom:8,textTransform:"uppercase"}}>
                    {listeOFs.length} OF cumulés — {data.qte_totale} pces total
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {listeOFs.map(of=>{
                      const qteLancee = getQteOF(of);
                      return(
                        <div key={of.CodeLancement} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1.5px solid ${T.accent}`,padding:"8px 12px",borderRadius:8,fontSize:12,flexWrap:"wrap"}}>
                          <strong style={{color:T.accent,minWidth:90}}>{of.CodeLancement}</strong>
                          <span style={{fontSize:11,color:T.textLight}}>Lancé : {qteLancee>0?qteLancee:"N/A"}</span>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <label style={{fontSize:11,color:T.textSecond,whiteSpace:"nowrap"}}>Réalisé :</label>
                            <input type="number" min="0"
                              value={of._qte_realisee||""}
                              onChange={e=>updateOFQte(of.CodeLancement,"_qte_realisee",e.target.value)}
                              placeholder={String(qteLancee||"")}
                              style={{width:70,padding:"3px 6px",borderRadius:5,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}/>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <label style={{fontSize:11,color:"#cf1322",whiteSpace:"nowrap"}}>Rebuts :</label>
                            <input type="number" min="0"
                              value={of._qte_rebut||""}
                              onChange={e=>updateOFQte(of.CodeLancement,"_qte_rebut",e.target.value)}
                              placeholder="0"
                              style={{width:70,padding:"3px 6px",borderRadius:5,border:`1px solid #ffa39e`,fontSize:12,fontFamily:T.font}}/>
                          </div>
                          <button onClick={()=>supprimerOF(of.CodeLancement)} style={{marginLeft:"auto",border:"none",background:"none",color:T.red,cursor:"pointer",fontWeight:"bold",fontSize:16}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantités */}
          <div className="ap-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <SectionTitle icon="🔢" title="Quantités"/>
              {data.qte_totale>0&&data.qte_nc>0&&(
                <div style={{padding:"4px 12px",background:"#fff8ed",color:"#b45309",borderRadius:20,fontSize:13,fontWeight:700,border:"1px solid #ff9f0a"}}>
                  Taux : {((data.qte_nc/data.qte_totale)*100).toFixed(1)} %
                </div>
              )}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
              <Field label="Quantité totale (Cumul OFs)">
                <input type="number" className="ap-input" value={data.qte_totale||""} onChange={e=>set("qte_totale",e.target.value)} placeholder="Total pièces..."/>
              </Field>
              <Field label="Quantité NC" required>
                <div style={{position:"relative"}}>
                  <input type="number" className="ap-input" value={data.qte_nc||""} onChange={e=>set("qte_nc",e.target.value)} placeholder="Quantité défectueuse" style={{paddingRight:60}}/>
                  {data.qte_totale>0&&data.qte_nc>0&&(
                    <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:700,color:T.textLight}}>
                      {Math.round((data.qte_nc/data.qte_totale)*100)}%
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:40}}>
            <button className="ap-btn ap-btn-primary" onClick={()=>setStep(2)} disabled={!d1Complete}>
              D2 Description →
            </button>
          </div>
        </div>
      )}

      {step===2&&(
        <div style={{display:"grid",gap:16}}>
          <div style={{display:"flex",gap:10,padding:"10px 16px",background:"#eef4ff",borderRadius:T.r,border:`1.5px solid ${T.border}`,alignItems:"center",flexWrap:"wrap"}}>
            {siteChoisi&&<span style={{padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,...siteBadge}}>🏭 {siteChoisi}</span>}
            <span className="ap-badge ap-badge-blue">{data.type_nc}</span>
            {data.is_groupe&&<span className="ap-badge ap-badge-green">🔗 Groupe — {fournisseurLabel}</span>}
            {data.fournisseur_code&&!data.is_groupe&&data.type_nc==="Fournisseur"&&<span className="ap-badge ap-badge-orange">📦 {fournisseurLabel}</span>}
            <span style={{fontSize:13,fontWeight:600}}>{data.code_article}</span>
            {(data.declarant_prenom||data.declarant_nom_libre)&&(
              <span style={{fontSize:12,color:T.textSecond}}>👤 {`${data.declarant_prenom} ${data.declarant_nom_libre}`.trim()}</span>
            )}
            <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:"#b45309"}}>Qté NC : {data.qte_nc}</span>
          </div>

          {data.defauts.map((d,i)=>(
            <div key={i} className="decl-defaut-card" style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:14}}>
                <div style={{flex:1}}>
                  <Field label={`Description du défaut ${i+1}`} required>
                    <textarea className="ap-textarea" rows={3} value={d.defaut} onChange={e=>updateDefaut(i,"defaut",e.target.value)} placeholder="Décrire précisément..."/>
                  </Field>
                  <Field label="Moyen de détection">
                    <select className="ap-select" value={d.moyen_detection} onChange={e=>updateDefaut(i,"moyen_detection",e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {MOYENS_DETECTION.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{width:120,flexShrink:0}}>
                  <label className="ap-label">Photo</label>
                  <div style={{width:"100%",height:80,border:`1.5px dashed ${T.border}`,borderRadius:T.r,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",background:T.surfaceAlt}}>
                    {d.photo?(
                      <><img src={d.photo} alt="Défaut" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      <button onClick={()=>updateDefaut(i,"photo",null)} style={{position:"absolute",top:2,right:2,background:"rgba(255,0,0,0.8)",color:"white",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontWeight:"bold"}}>✕</button></>
                    ):(
                      <label style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <span style={{fontSize:24}}>📷</span>
                        <input type="file" accept="image/*" onChange={e=>handlePhotoChange(i,e)} style={{display:"none"}}/>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              {data.defauts.length>1&&<button onClick={()=>removeDefaut(i)} style={{alignSelf:"flex-end",color:T.red,fontSize:11,background:"none",border:"none",cursor:"pointer"}}>Supprimer ce défaut</button>}
            </div>
          ))}

          <button className="ap-btn" onClick={addDefaut} style={{border:"1.5px dashed #ccc",width:"100%",background:"transparent",color:T.textSecond}}>＋ Ajouter un défaut</button>

          <div style={{display:"flex",justifyContent:"space-between",paddingBottom:40,marginTop:20}}>
            <button className="ap-btn" onClick={()=>setStep(1)}>← Retour D1</button>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving||!d2Complete}>
              {saving?"Création…":"✓ Créer la FE"}
            </button>
          </div>
        </div>
      )}

      {createdFe&&<SuccessModal feNumber={createdFe} onConfirm={()=>navigate(-1)}/>}
    </div>
  );
}