// src/pages/DeclarationFEPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import { getSiteFromJWT } from "../utils/auth.js";
import { TYPE_NC, DETECTE_PAR, FAI_TYPE, TYPES_DEFAUT } from "../data/ncData.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const KEP_SITES = [
  { code:"SOUCY", label:"KEP Soucy" },
  { code:"SENS",  label:"KEP Sens"  },
  { code:"LAXOU", label:"KEP Laxou" },
  { code:"KMTM",  label:"KEP KMTM"  },
];
const KEP_SITES_CODES = KEP_SITES.map(s => s.code);
const isKepSite = code => code && code !== "__AUTRE__" && KEP_SITES_CODES.some(k => code.toUpperCase().includes(k));

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
`;

const EMPTY_DEFAUT = { defaut:"", ecart:"", exigence:"", moyen_detection:"", type_defaut:"" };
const EMPTY = {
  type_nc:"", fournisseur_site:"", fournisseur_code:"", fournisseur_autre:"", is_groupe:false,
  fai_type:"", date_detection:new Date().toISOString().slice(0,10),
  detecte_par:"", detecte_par_autre:"", client_programme:"",
  numero_of:"", code_article:"", designation:"",
  qte_totale:0, qte_nc:"", defauts:[{ ...EMPTY_DEFAUT }],
};

function Field({ label, required, children, style }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", ...style }}>
      <label className="ap-label">{label}{required && <span style={{ color:T.red, marginLeft:3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function TypeBtn({ value, current, icon, onChange, children }) {
  return (
    <button className={`decl-type-btn ${current===value?"active":""}`} onClick={() => onChange(value)}>
      {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      <div>
        <div style={{ fontWeight:700, fontSize:13 }}>{value}</div>
        {children && <div style={{ fontSize:11, color:T.textLight, marginTop:2 }}>{children}</div>}
      </div>
      {current===value && <span style={{ marginLeft:"auto", color:T.accent, fontSize:16 }}>✓</span>}
    </button>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="ap-section-divider" style={{ marginTop:8 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:"#eef4ff", border:`1.5px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:T.fontDisplay, fontSize:15, fontWeight:700, color:T.textPrimary }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:T.textSecond, marginTop:1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function GroupeBanner({ fournisseurCode }) {
  return (
    <div className="groupe-banner">
      <div style={{ fontSize:22 }}>🔗</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:T.fontDisplay, fontSize:14, fontWeight:700, color:"#1a7a3f" }}>Classifiée Groupe</div>
        <div style={{ fontSize:12, color:"#1a7a3f", opacity:.8, marginTop:2 }}>
          Le fournisseur <strong>{fournisseurCode}</strong> est un site KEP — cette FE sera visible dans l'espace Groupe.
        </div>
      </div>
      <span className="ap-badge ap-badge-green" style={{ flexShrink:0 }}>Groupe</span>
    </div>
  );
}

function FournisseurSelector({ value, autreValue, externes, loadingExt, onChange, onAutreChange }) {
  const isAutre = value === "__AUTRE__";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <select className="ap-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Sélectionner un fournisseur —</option>
        <optgroup label="Sites KEP">
          {KEP_SITES.map(f => <option key={f.code} value={f.code}>🏭 {f.label}</option>)}
        </optgroup>
        <optgroup label="Fournisseurs externes">
          {loadingExt
            ? <option disabled>Chargement...</option>
            : externes.map(f => <option key={f.code} value={f.code}>📦 {f.label}</option>)}
        </optgroup>
        <option value="__AUTRE__">✏️ Autre (saisie libre)</option>
      </select>
      {isAutre && (
        <input className="ap-input" placeholder="Nom du fournisseur..." value={autreValue}
          onChange={e => onAutreChange(e.target.value)} autoFocus style={{ borderColor:T.accent }}/>
      )}
    </div>
  );
}

export default function DeclarationFEPage() {
  const navigate = useNavigate();
  const { site: siteParam } = useParams();

  const [step,       setStep]       = useState(1);
  const [data,       setData]       = useState({ ...EMPTY });
  const [saving,     setSaving]     = useState(false);
  const [loadingOF,  setLoadingOF]  = useState(false);
  const [listeOFs,   setListeOFs]   = useState([]);
  const [multiLS,    setMultiLS]    = useState(false);
  const [externes,   setExternes]   = useState([]);
  const [loadingExt, setLoadingExt] = useState(false);

  // Site : URL param > JWT
  const siteJWT = getSiteFromJWT();
  const [siteChoisi, setSiteChoisi] = useState(siteParam || siteJWT || "");

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("decl-styles")) {
      const s = document.createElement("style"); s.id="decl-styles"; s.textContent=STEP_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (data.type_nc !== "Fournisseur") return;
    if (externes.length > 0) return;
    setLoadingExt(true);
    axios.get(`${API}/api/fournisseurs`)
      .then(r => setExternes(r.data.data || []))
      .catch(() => setExternes([]))
      .finally(() => setLoadingExt(false));
  }, [data.type_nc]);

  const set          = (k, v) => setData(p => ({ ...p, [k]: v }));
  const updateDefaut = (i, k, v) => setData(p => ({ ...p, defauts: p.defauts.map((d, idx) => idx===i ? { ...d, [k]:v } : d) }));
  const addDefaut    = () => setData(p => ({ ...p, defauts: [...p.defauts, { ...EMPTY_DEFAUT }] }));
  const removeDefaut = i  => setData(p => ({ ...p, defauts: p.defauts.filter((_,idx) => idx!==i) }));

  const handleFournisseurChange = code => {
    const groupe = isKepSite(code);
    setData(p => ({ ...p, fournisseur_code:code, fournisseur_site:code, fournisseur_autre:code!=="__AUTRE__"?"":p.fournisseur_autre, is_groupe:groupe }));
  };

  const ajouterOF = nouveauOF => {
    if (listeOFs.find(item => item.CodeLancement===nouveauOF.CodeLancement)) { alert("Cet OF est déjà ajouté."); return; }
    if (listeOFs.length>0 && listeOFs[0].CodeArticle!==nouveauOF.CodeArticle) { alert(`Erreur : article différent (${nouveauOF.CodeArticle})`); return; }
    const nouvelleListe = [...listeOFs, nouveauOF];
    setListeOFs(nouvelleListe);
    const qteCumulee = nouvelleListe.reduce((sum, of) => sum+(of.QuantiteCalculée||of.QuantiteLancee||0), 0);
    setData(prev => ({ ...prev, numero_of:"", code_article:nouveauOF.CodeArticle, designation:nouveauOF.DesignationLct1, client_programme:nouveauOF.NomClient, qte_totale:qteCumulee }));
  };

  const supprimerOF = codeLancement => {
    const nouvelleListe = listeOFs.filter(o => o.CodeLancement!==codeLancement);
    setListeOFs(nouvelleListe);
    const qteCumulee = nouvelleListe.reduce((sum, of) => sum+(of.QuantiteCalculée||of.QuantiteLancee||0), 0);
    setData(prev => ({ ...prev, qte_totale:qteCumulee, code_article:nouvelleListe.length===0?"":prev.code_article, designation:nouvelleListe.length===0?"":prev.designation }));
  };

  const handleOFBlur = async e => {
    const value = e.target.value.trim();
    if (!value) return;
    setLoadingOF(true);
    try {
      const response = await axios.get(`${API}/api/lancements?of_search=${value}`);
      if (response.data.success && response.data.data) {
        const item = response.data.data;
        if (multiLS) { ajouterOF(item); }
        else {
          setListeOFs([item]);
          setData(prev => ({ ...prev, numero_of:item.CodeLancement, code_article:item.CodeArticle, designation:item.DesignationLct1, client_programme:item.NomClient, qte_totale:item.QuantiteCalculée||item.QuantiteLancee }));
        }
      } else { alert("OF inconnu"); }
    } catch { }
    finally { setLoadingOF(false); }
  };

  const handlePhotoChange = (idx, e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => updateDefaut(idx, "photo", reader.result); reader.readAsDataURL(file); }
  };
  const removePhoto = idx => updateDefaut(idx, "photo", null);

  const fournisseurOk = data.type_nc!=="Fournisseur" || (data.fournisseur_code && (data.fournisseur_code!=="__AUTRE__" || data.fournisseur_autre.trim()));
  const d1Complete = data.type_nc && data.date_detection && data.code_article && data.qte_nc && fournisseurOk;
  const d2Complete = data.defauts.some(d => d.defaut);

  const handleSave = async () => {
    const site = siteParam || siteChoisi;
    if (!site) { alert("Veuillez sélectionner un site."); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("kep_token");
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        code_article:     data.code_article,
        designation:      data.designation,
        numero_of:        listeOFs.map(o=>o.CodeLancement).join(", "),
        quantite:         data.qte_totale,
        type_evenement:   data.type_nc,
        description:      data.defauts.map(d=>d.defaut).filter(Boolean).join(" | "),
        gravite:          "mineur",
        declarant_nom:    data.detecte_par!=="__AUTRE__" ? data.detecte_par : data.detecte_par_autre,
        ilot:             data.client_programme,
        code_fournisseur: data.fournisseur_code!=="__AUTRE__" ? data.fournisseur_code : null,
        nom_fournisseur:  data.fournisseur_code==="__AUTRE__" ? data.fournisseur_autre : null,
      };
      const res = await axios.post(`${API}/api/nc-fe/${site.toLowerCase()}`, payload, { headers });
      if (!res.data.success) throw new Error(res.data.message);
      const { numero_fe } = res.data;
      if (data.is_groupe) {
        await axios.post(`${API}/api/fe/groupe`, { site_detecteur:site.toUpperCase(), fournisseur:data.fournisseur_code, code_article:data.code_article, description:data.defauts[0]?.defaut||"", priorite:"Normale" }, { headers }).catch(()=>{});
      }
      alert(`✅ FE ${numero_fe} créée avec succès !`);
      navigate(-1);
    } catch (e) { alert("Erreur : " + e.message); }
    finally { setSaving(false); }
  };

  const TYPE_ICONS = { "Interne Série":"🔧", "FAI":"📋", "Client":"👥", "Fournisseur":"📦" };
  const fournisseurLabel = data.fournisseur_code==="__AUTRE__" ? data.fournisseur_autre||"Autre" : data.fournisseur_code;

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:"100vh", padding:"24px" }}>
      <div className="ap-page-head">
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)} style={{ padding:"6px 10px" }}>← Retour</button>
            <div>
              <div className="ap-h1">
                Déclarer une nouvelle FE
                {data.is_groupe && <span className="ap-badge ap-badge-green" style={{ marginLeft:12, verticalAlign:"middle", fontSize:12 }}>🔗 Groupe</span>}
              </div>
              <div className="ap-sub">Identification D1 + Description du défaut D2</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
          <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving||!d1Complete}>
            {saving ? "Création…" : "✓ Créer la FE"}
          </button>
        </div>
      </div>

      <div className="decl-step-nav">
        {[
          { id:1, label:"Identification",     done:!!d1Complete },
          { id:2, label:"Description défaut", done:!!d2Complete },
        ].map(s => (
          <button key={s.id} className={`decl-step ${step===s.id?"active":""} ${s.done&&step!==s.id?"done":""}`} onClick={() => setStep(s.id)}>
            <div className="decl-step-num">{s.done&&step!==s.id?"✓":s.id}</div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase" }}>D{s.id}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary }}>{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ══ STEP 1 ══ */}
      {step === 1 && (
        <div style={{ display:"grid", gap:20 }}>


          <div className="ap-card">
            <SectionTitle icon="🏷️" title="Type de non-conformité" subtitle="Sélectionner le type de FE à créer" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10 }}>
              {TYPE_NC.map(t => (
                <TypeBtn key={t} value={t} current={data.type_nc} icon={TYPE_ICONS[t]}
                  onChange={v => {
                    if (v!=="Fournisseur") setData(p => ({ ...p, type_nc:v, fournisseur_code:"", fournisseur_site:"", fournisseur_autre:"", is_groupe:false }));
                    else set("type_nc", v);
                  }}/>
              ))}
            </div>
          </div>

          {data.type_nc === "Fournisseur" && (
            <div className="ap-card">
              <SectionTitle icon="🏭" title="Fournisseur" subtitle="Les sites KEP basculent automatiquement en Groupe" />
              <FournisseurSelector value={data.fournisseur_code} autreValue={data.fournisseur_autre} externes={externes} loadingExt={loadingExt} onChange={handleFournisseurChange} onAutreChange={v => set("fournisseur_autre", v)} />
              {data.is_groupe && data.fournisseur_code && <div style={{ marginTop:14 }}><GroupeBanner fournisseurCode={data.fournisseur_code}/></div>}
            </div>
          )}

          <div className="ap-card">
            <SectionTitle icon="📅" title="Détection" subtitle="Quand et par qui ?" />
            <Field label="Date de détection" required>
              <input type="date" className="ap-input" value={data.date_detection} onChange={e => set("date_detection", e.target.value)} />
            </Field>
          </div>

          <div className="ap-card">
            <SectionTitle icon="📦" title="Article & Ordre de fabrication" />
            <div style={{ display:"grid", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:14, alignItems:"flex-end" }}>
                <Field label={multiLS ? "Ajouter un N° OF" : "N° OF"}>
                  <div style={{ position:"relative" }}>
                    <input className="ap-input" value={data.numero_of} onChange={e => set("numero_of", e.target.value)} onBlur={handleOFBlur} placeholder={multiLS?"Ajouter un OF...":"Saisir l'OF..."} style={{ borderColor:multiLS?T.accent:T.border }}/>
                    {loadingOF && <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }}>⏳</div>}
                  </div>
                </Field>
                <button type="button" onClick={() => { setMultiLS(!multiLS); if(multiLS) setListeOFs([]); }}
                  style={{ height:42, padding:"0 15px", borderRadius:T.r, border:`1.5px solid ${multiLS?T.accent:T.border}`, background:multiLS?T.accent:"transparent", color:multiLS?"#fff":T.textSecond, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:8 }}>
                  {multiLS ? "✓ Mode Multi-OF" : "＋ Plusieurs lancements"}
                </button>
              </div>
              <Field label="Client / Programme">
                <input className="ap-input" value={data.client_programme} onChange={e => set("client_programme", e.target.value)} placeholder="Client automatique..."/>
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:14 }}>
                <Field label="Code article / REF" required><input className="ap-input" value={data.code_article} readOnly style={{ background:"#f5f5f7", cursor:"not-allowed" }}/></Field>
                <Field label="Désignation"><input className="ap-input" value={data.designation} readOnly style={{ background:"#f5f5f7", cursor:"not-allowed" }}/></Field>
              </div>
              {multiLS && listeOFs.length > 0 && (
                <div style={{ padding:"12px", background:"rgba(0,113,227,0.05)", borderRadius:T.r, border:`1px dashed ${T.accent}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.accent, marginBottom:8, textTransform:"uppercase" }}>Lancements cumulés :</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {listeOFs.map(of => (
                      <div key={of.CodeLancement} style={{ display:"flex", alignItems:"center", background:"#fff", border:`1px solid ${T.accent}`, padding:"4px 10px", borderRadius:6, fontSize:12 }}>
                        <strong style={{ color:T.accent }}>{of.CodeLancement}</strong>
                        <span style={{ margin:"0 8px", color:"#ccc" }}>|</span>
                        <span>{Math.round(of.QuantiteCalculée||of.QuantiteLancee)} pces</span>
                        <button onClick={() => supprimerOF(of.CodeLancement)} style={{ marginLeft:10, border:"none", background:"none", color:T.red, cursor:"pointer", fontWeight:"bold", fontSize:14 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ap-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <SectionTitle icon="🔢" title="Quantités" />
              {data.qte_totale>0 && data.qte_nc>0 && (
                <div style={{ padding:"4px 12px", background:"#fff8ed", color:"#b45309", borderRadius:20, fontSize:13, fontWeight:700, border:"1px solid #ff9f0a" }}>
                  Taux : {((data.qte_nc/data.qte_totale)*100).toFixed(1)} %
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14 }}>
              <Field label="Quantité totale (Cumul OFs)">
                <input type="number" className="ap-input" value={data.qte_totale||""} onChange={e => set("qte_totale", e.target.value)} placeholder="Total pièces..."/>
              </Field>
              <Field label="Quantité NC" required>
                <div style={{ position:"relative" }}>
                  <input type="number" className="ap-input" value={data.qte_nc||""} onChange={e => set("qte_nc", e.target.value)} placeholder="Quantité défectueuse" style={{ paddingRight:60 }}/>
                  {data.qte_totale>0 && data.qte_nc>0 && (
                    <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, color:T.textLight }}>
                      {Math.round((data.qte_nc/data.qte_totale)*100)}%
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:40 }}>
            <button className="ap-btn ap-btn-primary" onClick={() => setStep(2)} disabled={!d1Complete}>D2 Description →</button>
          </div>
        </div>
      )}

      {/* ══ STEP 2 ══ */}
      {step === 2 && (
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"flex", gap:10, padding:"10px 16px", background:"#eef4ff", borderRadius:T.r, border:`1.5px solid ${T.border}`, alignItems:"center", flexWrap:"wrap" }}>
            <span className="ap-badge ap-badge-blue">{data.type_nc}</span>
            {data.is_groupe && <span className="ap-badge ap-badge-green">🔗 Groupe — {fournisseurLabel}</span>}
            {data.fournisseur_code && !data.is_groupe && data.type_nc==="Fournisseur" && <span className="ap-badge ap-badge-orange">📦 {fournisseurLabel}</span>}
            <span style={{ fontSize:13, fontWeight:600 }}>{data.code_article}</span>
            <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:"#b45309" }}>Qté NC : {data.qte_nc}</span>
          </div>

          {data.defauts.map((d, i) => (
            <div key={i} className="decl-defaut-card" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", gap:14 }}>
                <div style={{ flex:1 }}>
                  <Field label={`Description du défaut ${i+1}`} required>
                    <textarea className="ap-textarea" rows={3} value={d.defaut} onChange={e => updateDefaut(i,"defaut",e.target.value)} placeholder="Décrire précisément..."/>
                  </Field>
                </div>
                <div style={{ width:120, flexShrink:0 }}>
                  <label className="ap-label">Photo</label>
                  <div style={{ width:"100%", height:80, border:`1.5px dashed ${T.border}`, borderRadius:T.r, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", background:T.surfaceAlt }}>
                    {d.photo ? (
                      <>
                        <img src={d.photo} alt="Défaut" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        <button onClick={() => removePhoto(i)} style={{ position:"absolute", top:2, right:2, background:"rgba(255,0,0,0.8)", color:"white", border:"none", borderRadius:"50%", width:20, height:20, cursor:"pointer", fontWeight:"bold" }}>✕</button>
                      </>
                    ) : (
                      <label style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <span style={{ fontSize:24 }}>📷</span>
                        <input type="file" accept="image/*" capture="environment" onChange={e => handlePhotoChange(i,e)} style={{ display:"none" }}/>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              {data.defauts.length > 1 && (
                <button onClick={() => removeDefaut(i)} style={{ alignSelf:"flex-end", color:T.red, fontSize:11, background:"none", border:"none", cursor:"pointer" }}>Supprimer ce défaut</button>
              )}
            </div>
          ))}

          <button className="ap-btn" onClick={addDefaut} style={{ border:"1.5px dashed #ccc", width:"100%", background:"transparent", color:T.textSecond }}>＋ Ajouter un défaut</button>

          <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:40, marginTop:20 }}>
            <button className="ap-btn" onClick={() => setStep(1)}>← Retour D1</button>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving||!d2Complete}>
              {saving ? "Création…" : "✓ Créer la FE"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}