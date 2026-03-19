// src/components/Analyse8DModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ILOTS, FAMILLES_ISHIKAWA, CAUSES_ISHIKAWA_GENERIQUES, CAUSES_PAR_ILOT,
  CAUSES_NON_DETECTION_GENERIQUES, CAUSES_NON_DETECTION_PAR_ILOT,
  ACTIONS_IMMEDIATES, VERIF_EFFICACITE,
} from "../data/ncData.js";
import CausalTreeModal from "./CausalTreeModal";
import { use8D } from "../hooks/use8D.js";
import { compute8DProgress } from "../utils/compute8DProgress.js";

const T = {
  bg:"#f5f5f7", surface:"#ffffff", surfaceAlt:"#f5f5f7", border:"rgba(0,0,0,0.08)",
  borderFocus:"#0071e3", accent:"#0071e3", accentHover:"#0077ed",
  green:"#30d158", orange:"#ff9f0a", red:"#ff3b30",
  textPrimary:"#1d1d1f", textSecond:"#6e6e73", textLight:"#aeaeb2",
  font:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  fontDisplay:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
  r:"12px", rSm:"8px",
  shadow:"0 2px 8px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.06)",
  shadowHover:"0 4px 16px rgba(0,0,0,0.10),0 0 0 1px rgba(0,0,0,0.08)",
  shadowModal:"0 32px 80px rgba(0,0,0,0.28),0 0 0 1px rgba(0,0,0,0.06)",
};

const GLOBAL_CSS = `
.a8d-input,.a8d-select,.a8d-textarea{font-family:${T.font};font-size:13px;color:${T.textPrimary};background:${T.surfaceAlt};border:1.5px solid ${T.border};border-radius:${T.rSm};padding:8px 11px;width:100%;box-sizing:border-box;outline:none;transition:border-color .15s,box-shadow .15s,background .15s;-webkit-appearance:none;appearance:none;}
.a8d-input:focus,.a8d-select:focus,.a8d-textarea:focus{border-color:${T.borderFocus};background:#fff;box-shadow:0 0 0 3px rgba(0,113,227,.12);}
.a8d-input::placeholder,.a8d-textarea::placeholder{color:${T.textLight};}
.a8d-textarea{resize:vertical;line-height:1.5;}
.a8d-select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aeaeb2' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer;}
.a8d-card{background:${T.surface};border-radius:${T.r};border:1.5px solid ${T.border};padding:16px 18px;box-shadow:${T.shadow};}
.a8d-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid ${T.border};background:${T.surfaceAlt};color:${T.textSecond};transition:all .15s;user-select:none;}
.a8d-chip:hover{border-color:${T.accent};color:${T.accent};}
.a8d-chip.active{background:${T.accent};border-color:${T.accent};color:#fff;}
.a8d-rpill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid ${T.border};background:${T.surfaceAlt};color:${T.textSecond};transition:all .15s;user-select:none;}
.a8d-rpill input{display:none;}
.a8d-rpill.c-blue{background:${T.accent};border-color:${T.accent};color:#fff;}
.a8d-rpill.c-green{background:#e8fdf0;border-color:${T.green};color:#1a7a3f;}
.a8d-rpill.c-red{background:#fff0ef;border-color:${T.red};color:${T.red};}
.a8d-rpill.c-orange{background:#fff8ed;border-color:${T.orange};color:#b45309;}
.a8d-btn{font-family:${T.font};font-size:13px;font-weight:500;padding:8px 16px;border-radius:${T.rSm};border:1.5px solid ${T.border};background:${T.surface};color:${T.textPrimary};cursor:pointer;transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}
.a8d-btn:hover{background:${T.surfaceAlt};border-color:rgba(0,0,0,.14);}
.a8d-btn-primary{background:${T.accent};border-color:${T.accent};color:#fff;}
.a8d-btn-primary:hover{background:${T.accentHover};}
.a8d-btn-danger{background:#fff0ef;border-color:${T.red};color:${T.red};}
.a8d-btn-danger:hover{background:#ffe5e3;}
.a8d-btn-cloture{background:#1d1d1f;border-color:#1d1d1f;color:#fff;}
.a8d-btn-cloture:hover{background:#2d2d2f;}
.a8d-nav-btn{font-family:${T.font};display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding:8px 12px;min-width:130px;border-radius:${T.r};border:1.5px solid ${T.border};background:${T.surface};cursor:pointer;transition:all .18s;}
.a8d-nav-btn:hover{border-color:${T.accent};box-shadow:0 2px 12px rgba(0,113,227,.1);}
.a8d-nav-btn.done{border-color:${T.green};background:#f0fdf4;}
.a8d-nav-btn.partial{border-color:${T.orange};background:#fffbf0;}
.a8d-action-card{background:${T.surface};border:1.5px solid ${T.border};border-radius:${T.r};padding:16px;transition:box-shadow .15s;}
.a8d-action-card:hover{box-shadow:${T.shadowHover};}
.a8d-add-btn{width:100%;padding:11px;border:1.5px dashed ${T.border};border-radius:${T.r};background:transparent;color:${T.textLight};font-family:${T.font};font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;}
.a8d-add-btn:hover{border-color:${T.accent};color:${T.accent};background:rgba(0,113,227,.03);}
.a8d-6m-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.a8d-scroll::-webkit-scrollbar{width:6px;}
.a8d-scroll::-webkit-scrollbar-track{background:transparent;}
.a8d-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:3px;}
.a8d-scroll::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.22);}
.a8d-photos-grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}
.a8d-photo-thumb{position:relative;width:84px;height:84px;border-radius:8px;overflow:hidden;border:1.5px solid ${T.border};cursor:pointer;transition:box-shadow .15s;}
.a8d-photo-thumb:hover{box-shadow:0 4px 12px rgba(0,0,0,.15);}
.a8d-photo-thumb img{width:100%;height:100%;object-fit:cover;}
.a8d-photo-del{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:rgba(255,59,48,.85);border:none;color:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;font-weight:700;}
.a8d-photo-add-btn{width:84px;height:84px;border-radius:8px;border:1.5px dashed ${T.border};background:${T.surfaceAlt};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .15s;font-family:${T.font};font-size:10px;color:${T.textLight};}
.a8d-photo-add-btn:hover{border-color:${T.accent};color:${T.accent};background:rgba(0,113,227,.04);}
@media(max-width:680px){.a8d-6m-grid{grid-template-columns:1fr;}.a8d-nav-btn{min-width:100px;}}
`;

function injectCSS() {
  if (document.getElementById("a8d-styles")) return;
  const s = document.createElement("style"); s.id="a8d-styles"; s.textContent=GLOBAL_CSS;
  document.head.appendChild(s);
}

const SECTIONS = [
  { id:3, label:"Actions immédiates", icon:"⚡" },
  { id:4, label:"Ishikawa (6M)",      icon:"🔍" },
  { id:5, label:"5 Pourquoi",         icon:"❓" },
  { id:6, label:"Plan d'action",      icon:"📋" },
  { id:7, label:"Vérification",       icon:"✅" },
  { id:8, label:"Clôture",            icon:"🔒" },
];

const RESPONSABLES = [
  { nom:"— Choisir —", email:"" },
  { nom:"Resp. Qualité",         email:"qualite@site.fr" },
  { nom:"Chef d'îlot",           email:"chef.ilot@site.fr" },
  { nom:"Technicien méthodes",   email:"methodes@site.fr" },
  { nom:"Responsable prod.",     email:"production@site.fr" },
  { nom:"Ingénieur qualité",     email:"ingenieur.qualite@site.fr" },
  { nom:"Responsable HAE",       email:"hae@site.fr" },
];

const FAMILLES_COLORS = {
  "Méthode":       { bg:"#e8f0fe", ac:"#1a73e8" },
  "Machine":       { bg:"#fff3e0", ac:"#f57c00" },
  "Matière":       { bg:"#fce4ec", ac:"#c62828" },
  "Main d'œuvre":  { bg:"#e8f5e9", ac:"#2e7d32" },
  "Milieu":        { bg:"#f3e5f5", ac:"#7b1fa2" },
  "Mesure":        { bg:"#e0f7fa", ac:"#00838f" },
};

const EMPTY = {
  description_defaut:"", photos:[], problemes:[],
  actions_immediates:[], action_immediate_autre:"",
  responsable_immediat:"", responsable_immediat_email:"", date_immediat:"", ilot:"",
  causes_6m:{ Méthode:{selected:[],autre:""}, Machine:{selected:[],autre:""}, Matière:{selected:[],autre:""}, "Main d'œuvre":{selected:[],autre:""}, Milieu:{selected:[],autre:""}, Mesure:{selected:[],autre:""} },
  why_apparition:["","","","",""], cause_racine_apparition:"",
  famille_non_detection:"", cause_non_detection_selected:[], cause_non_detection_autre:"",
  why_non_detection:["","","","",""],
  actions:[{ description:"", responsable:"", responsable_email:"", echeance:"", type:"Corrective", statut:"À faire" }],
  methode_verif:"", resultat_verif:"", date_verif:"",
  responsable_qualite:"", responsable_qualite_email:"", date_cloture:"", recurrente:"",
};

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(String(v)); } catch { return null; }
}

function computeProgress(d) {
  const p = arr => Math.round((arr.filter(Boolean).length / arr.length) * 100);
  const actionsRemplies = (d.actions||[]).filter(a => a.description?.trim());
  return {
    3: p([d.actions_immediates?.length>0, !!d.responsable_immediat, !!d.date_immediat]),
    4: p([!!d.ilot, Object.values(d.causes_6m||{}).some(f => f.selected?.length>0||f.autre)]),
    5: p([
      (d.why_apparition||[]).some(w => w?.trim()),
      (d.why_non_detection||[]).some(w => w?.trim()),
    ]),
    6: actionsRemplies.length === 0
      ? 0
      : p([
          actionsRemplies.length > 0,
          actionsRemplies.every(a => a.responsable?.trim()),
        ]),
    7: p([!!d.methode_verif, !!d.resultat_verif, !!d.date_verif]),
    8: p([!!d.responsable_qualite, !!d.date_cloture, !!d.recurrente]),
  };
}

function buildRecapEmail(data, fe) {
  const fe_num = fe?.numero_fe||"N/A", fe_des = fe?.designation||"";
  const actions6 = (data.actions||[]).map((a,i)=>`  ${i+1}. ${a.description||"—"} — ${a.responsable||"—"} — ${a.echeance||"—"} — ${a.statut}`).join("\n");
  const causes6m = Object.entries(data.causes_6m||{}).map(([f,v])=>{ const items=[...(v.selected||[]),v.autre?`Autre: ${v.autre}`:null].filter(Boolean); return items.length?`  ${f}: ${items.join(", ")}`:null; }).filter(Boolean).join("\n");
  return {
    subject:`[8D] Analyse NC — FE ${fe_num}`,
    body:`Bonjour,\n\nRécapitulatif analyse 8D — ${fe_num}${fe_des?` — ${fe_des}`:""}\n\n────── CONTEXTE ──────\n${data.description_defaut||"—"}\n\n────── D3 ACTIONS IMMÉDIATES ──────\nActions : ${(data.actions_immediates||[]).join(", ")||"—"}\nResponsable : ${data.responsable_immediat||"—"}\nDate : ${data.date_immediat||"—"}\n\n────── D4 ISHIKAWA ──────\nÎlot : ${data.ilot||"—"}\n${causes6m||"  Aucune cause"}\n\n────── D5 5 POURQUOI ──────\nApparition :\n${(data.why_apparition||[]).map((w,i)=>w?`  ${i+1}. ${w}`:null).filter(Boolean).join("\n")||"  —"}\nCause racine : ${data.cause_racine_apparition||"—"}\n\nNon-détection :\n${(data.why_non_detection||[]).map((w,i)=>w?`  ${i+1}. ${w}`:null).filter(Boolean).join("\n")||"  —"}\n\n────── D6 PLAN D'ACTION ──────\n${actions6||"  Aucune action"}\n\n────── D7 VÉRIFICATION ──────\nMéthode : ${data.methode_verif||"—"}\nRésultat : ${data.resultat_verif||"—"}\nDate : ${data.date_verif||"—"}\n\n────── D8 CLÔTURE ──────\nResponsable : ${data.responsable_qualite||"—"}\nDate clôture : ${data.date_cloture||"—"}\nNC récurrente : ${data.recurrente||"—"}\n\n---\nEnvoyé depuis Suivi FE`,
  };
}

function Label({ children, required }) {
  return <div style={{ fontFamily:T.font, fontSize:11, fontWeight:600, color:T.textSecond, marginBottom:6, letterSpacing:".3px", textTransform:"uppercase" }}>{children}{required&&<span style={{ color:T.red, marginLeft:3 }}>*</span>}</div>;
}
function Field({ label, required, children, style }) {
  return <div style={{ display:"flex", flexDirection:"column", ...style }}><Label required={required}>{label}</Label>{children}</div>;
}
function RPill({ name, value, checked, onChange, colorClass, children }) {
  return <label className={`a8d-rpill ${checked?colorClass||"c-blue":""}`}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} />{children||value}</label>;
}
function Chip({ label, checked, onChange }) {
  return <label className={`a8d-chip ${checked?"active":""}`}><input type="checkbox" style={{ display:"none" }} checked={checked} onChange={onChange} />{checked&&<span style={{ fontSize:10, lineHeight:1 }}>✓</span>}{label}</label>;
}
function RespSelect({ value, emailValue, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      <select className="a8d-select" style={{ flex:"1 1 160px" }} value={value} onChange={e=>{ const r=RESPONSABLES.find(x=>x.nom===e.target.value); onChange(e.target.value,r?.email||""); }}>
        {RESPONSABLES.map(r=><option key={r.nom} value={r.nom}>{r.nom}</option>)}
      </select>
      <input className="a8d-input" style={{ flex:"1 1 160px" }} value={emailValue} onChange={e=>onChange(value,e.target.value)} placeholder="Email…" type="email" />
    </div>
  );
}
function ProgressRing({ pct, size=28 }) {
  const r=(size-4)/2, circ=2*Math.PI*r, dash=(pct/100)*circ;
  const color=pct===100?T.green:pct>0?T.orange:T.textLight;
  return <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={3}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition:"stroke-dasharray .4s ease" }}/></svg>;
}
function SectionTitle({ id, label, icon, pct }) {
  const color=pct===100?T.green:pct>0?T.orange:T.textLight;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
      <div style={{ width:42, height:42, borderRadius:12, background:pct===100?"#e8fdf0":pct>0?"#fff8ed":T.surfaceAlt, border:`1.5px solid ${pct===100?T.green:pct>0?T.orange:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:T.font, fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".6px" }}>D{id}</div>
        <div style={{ fontFamily:T.fontDisplay, fontSize:17, fontWeight:700, color:T.textPrimary, lineHeight:1.2 }}>{label}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontFamily:T.font, fontSize:12, fontWeight:700, color }}>{pct}%</span>
        <ProgressRing pct={pct}/>
      </div>
    </div>
  );
}
function CauseBlock({ famille, options, selected, autre, onChange, onAutre }) {
  const toggle = v => onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  const { bg, ac } = FAMILLES_COLORS[famille]||{ bg:T.surfaceAlt, ac:T.accent };
  return (
    <div style={{ background:T.surface, borderRadius:T.r, border:`1.5px solid ${T.border}`, overflow:"hidden" }}>
      <div style={{ background:bg, padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:ac, flexShrink:0 }}/>
        <span style={{ fontFamily:T.font, fontSize:11, fontWeight:700, color:ac, textTransform:"uppercase", letterSpacing:".5px" }}>{famille}</span>
        {selected.length>0&&<span style={{ marginLeft:"auto", background:ac, color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 7px" }}>{selected.length}</span>}
      </div>
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
        {options.map(opt=>(
          <label key={opt} style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, marginTop:1, border:`1.5px solid ${selected.includes(opt)?ac:T.border}`, background:selected.includes(opt)?ac:T.surface, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .12s" }}>
              {selected.includes(opt)&&<span style={{ color:"#fff", fontSize:10, lineHeight:1 }}>✓</span>}
            </div>
            <input type="checkbox" style={{ display:"none" }} checked={selected.includes(opt)} onChange={()=>toggle(opt)}/>
            <span style={{ fontFamily:T.font, fontSize:12.5, color:T.textPrimary, lineHeight:1.4 }}>{opt}</span>
          </label>
        ))}
        <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:T.font, fontSize:11, color:T.textLight, fontWeight:600, whiteSpace:"nowrap" }}>Autre</span>
          <input className="a8d-input" style={{ fontSize:12 }} value={autre} onChange={e=>onAutre(e.target.value)} placeholder="Préciser…"/>
        </div>
      </div>
    </div>
  );
}
function StatutPill({ value, checked, onSelect }) {
  const styles = { "À faire":{bg:T.surfaceAlt,color:T.textSecond,border:T.border}, "En cours":{bg:"#fff8ed",color:"#b45309",border:T.orange}, "Terminé":{bg:"#e8fdf0",color:"#1a7a3f",border:T.green}, "Non réalisable":{bg:"#fff0ef",color:T.red,border:T.red} };
  const sc = styles[value]||styles["À faire"];
  return <label style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:12.5, fontWeight:500, border:`1.5px solid ${checked?sc.border:T.border}`, background:checked?sc.bg:T.surface, color:checked?sc.color:T.textSecond, transition:"all .12s" }}><input type="radio" style={{ display:"none" }} checked={checked} onChange={onSelect}/>{checked&&<span style={{ fontSize:9 }}>●</span>}{value}</label>;
}
function PhotosSection({ photos, onAdd, onRemove, onLightbox }) {
  return (
    <div className="a8d-photos-grid">
      {(photos||[]).map((src,i)=>(
        <div key={i} className="a8d-photo-thumb" onClick={()=>onLightbox&&onLightbox(src)}>
          <img src={src} alt={`photo-${i}`}/>
          {onRemove&&<button className="a8d-photo-del" onClick={e=>{e.stopPropagation();onRemove(i);}}>×</button>}
        </div>
      ))}
      <label className="a8d-photo-add-btn"><span style={{ fontSize:22 }}>📷</span><span>Ajouter</span><input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={onAdd}/></label>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
// Props :
//   open, fe, initialValue, onCancel, onSave
//   site (optionnel) — si fourni, sauvegarde le 8D dans KEP_NC_{site}
export default function Analyse8DModal({ open, initialValue, fe, onCancel, onSave, site }) {
  const [data, setData]             = useState(EMPTY);
  const [showCausalTree, setShowCausalTree] = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const [saveMsg,  setSaveMsg]      = useState(null); // "saving" | "ok" | "error"
  const sectionRefs = useRef({});
  const scrollRef   = useRef(null);

  // ── Hook DB ────────────────────────────────────────────────
  const db8D = use8D(fe?.numero_fe, site);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (!open) return;

    // Priorité : BDD KEP_NC > initialValue (SILOG) > EMPTY
    const fromDB      = safeParse(db8D.data?.data_json);
    const fromInitial = safeParse(initialValue);
    const base        = fromDB || fromInitial || {};
    let merged = { ...EMPTY, ...base };

    // Pré-remplir depuis la FE si rien en BDD ni dans SILOG
    if (!fromDB && !fromInitial && fe) {
      const defauts = Array.isArray(fe.defauts) ? fe.defauts : [];
      if (defauts.length > 0) {
        merged.description_defaut = defauts.map(d=>d.defaut).filter(Boolean).join("\n— ");
        merged.photos = defauts.flatMap(d => d.photo ? [d.photo] : []);
        merged.problemes = defauts.map((d,i) => ({ id:`prob_${i}_${Date.now()}`, description:d.defaut||`Défaut ${i+1}`, why_apparition:["","","","",""], why_non_detection:["","","","",""], cause_racine:"" }));
      }
    }
    setData(merged);
  }, [open, db8D.data, initialValue]);

  const set    = (k,v)  => setData(p=>({...p,[k]:v}));
  const set6m  = (f,pt) => setData(p=>({...p,causes_6m:{...p.causes_6m,[f]:{...p.causes_6m[f],...pt}}}));

  const handleAddPhoto = e => {
    Array.from(e.target.files).forEach(f=>{ const r=new FileReader(); r.onload=ev=>setData(p=>({...p,photos:[...(p.photos||[]),ev.target.result]})); r.readAsDataURL(f); });
    e.target.value="";
  };
  const handleRemovePhoto = i => setData(p=>({...p,photos:p.photos.filter((_,j)=>j!==i)}));

  const causesIlot = famille => {
    const spec = CAUSES_PAR_ILOT[data.ilot]?.[famille]||[];
    const gen  = CAUSES_ISHIKAWA_GENERIQUES[famille]||[];
    return [...new Set([...spec,...gen])];
  };

  const causesNonDetection = useMemo(()=>{
    if(!open) return [];
    const spec = CAUSES_NON_DETECTION_PAR_ILOT[data.ilot]||[];
    const gen  = data.famille_non_detection ? CAUSES_NON_DETECTION_GENERIQUES[data.famille_non_detection]||[] : Object.values(CAUSES_NON_DETECTION_GENERIQUES).flat();
    return [...new Set([...spec,...gen])];
  },[open,data.ilot,data.famille_non_detection]);

  const progress = useMemo(()=>computeProgress(data), [
    data.actions_immediates, data.responsable_immediat, data.date_immediat,
    data.ilot, data.causes_6m,
    data.why_apparition, data.why_non_detection,
    data.actions,
    data.methode_verif, data.resultat_verif, data.date_verif,
    data.responsable_qualite, data.date_cloture, data.recurrente,
  ]);
  const totalPct = Math.round(Object.values(progress).reduce((a,b)=>a+b,0)/Object.keys(progress).length);
  const d8Complete = progress[8]===100;

  const toggleAct = v => set("actions_immediates", data.actions_immediates.includes(v)?data.actions_immediates.filter(x=>x!==v):[...data.actions_immediates,v]);
  const addAction    = ()      => setData(p=>({...p, actions:[...p.actions, {description:"",responsable:"",responsable_email:"",echeance:"",type:"Corrective",statut:"À faire"}]}));
  const updateAction = (i,k,v) => setData(p=>({...p, actions:p.actions.map((a,idx)=>idx===i?{...a,[k]:v}:a)}));
  const removeAction = i       => setData(p=>({...p, actions:p.actions.filter((_,idx)=>idx!==i)}));

  const scrollTo = id => {
    const el=sectionRefs.current[id];
    if(el&&scrollRef.current) scrollRef.current.scrollTo({top:el.offsetTop-16,behavior:"smooth"});
  };

  const handleEmail = () => {
    const { subject, body } = buildRecapEmail(data, fe);
    const emails = [data.responsable_immediat_email, data.responsable_qualite_email, ...(data.actions||[]).map(a=>a.responsable_email)].filter(Boolean).join(",");
    window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,"_blank");
  };

  // ── Enregistrement — BDD + callback parent ────────────────
  const handleSave = async () => {
    const jsonStr = JSON.stringify(data, null, 2);
    setSaveMsg("saving");
    try {
      // 1. Sauvegarde en BDD KEP_NC_{site}
      const source = fe?.source || "SILOG";
      const statut = d8Complete ? "traite" : "en_cours";
      await db8D.save(data, source, statut);

      // 2. Callback parent (pour mettre à jour l'UI locale)
      onSave(jsonStr);
      setSaveMsg("ok");
      setTimeout(()=>setSaveMsg(null), 2000);
    } catch {
      setSaveMsg("error");
      setTimeout(()=>setSaveMsg(null), 3000);
      // Sauvegarde locale quand même
      onSave(jsonStr);
    }
  };

  // ── Clôture locale ───────────────────────────────────────
  const [cloture, setCloture] = useState(false);

  const handleCloture = async () => {
    if (!d8Complete) return;
    // Sauvegarde avec statut clos
    await db8D.save(data, fe?.source || "SILOG", "traite");
    setCloture(true);
  };

  if (!open) return null;

  const saveLabel = saveMsg==="saving" ? "Enregistrement…" : saveMsg==="ok" ? "✓ Enregistré" : saveMsg==="error" ? "⚠ Enregistré localement" : "💾 Enregistrer";
  const saveBg    = saveMsg==="ok" ? T.green : saveMsg==="error" ? T.orange : T.accent;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.42)", backdropFilter:"blur(10px) saturate(180%)", WebkitBackdropFilter:"blur(10px) saturate(180%)", display:"flex", alignItems:"center", justifyContent:"center" }} onMouseDown={onCancel}>
      <div style={{ width:"90vw", maxWidth:1100, height:"88vh", maxHeight:"88vh", minWidth:500, resize:"both", overflow:"hidden", borderRadius:20, background:T.bg, boxShadow:T.shadowModal, display:"flex", flexDirection:"column", fontFamily:T.font }} onMouseDown={e=>e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div style={{ padding:"14px 20px 0", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:T.fontDisplay, fontWeight:700, fontSize:15, color:T.textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                Analyse 8D — {fe?.numero_fe||"NC"}
                {/* Badge statut BDD */}
                {(db8D.statut === "traite" || cloture) && (
                  <span style={{ marginLeft:10, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, background:"#e8fdf0", color:"#1a7a3f" }}>
                    ✓ Traité — à clôturer dans Silogue
                  </span>
                )}
                {db8D.statut === "en_cours" && !cloture && (
                  <span style={{ marginLeft:10, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, background:"#eef4ff", color:T.accent }}>
                    En cours
                  </span>
                )}
              </div>
              {fe?.designation&&<div style={{ fontSize:11.5, color:T.textSecond, marginTop:1 }}>{fe.designation}</div>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:600, color:T.textSecond }}>Avancement global</span>
              <div style={{ width:90, height:4, borderRadius:2, background:T.border, overflow:"hidden" }}>
                <div style={{ width:`${totalPct}%`, height:"100%", background:totalPct===100?T.green:T.accent, borderRadius:2, transition:"width .4s" }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:totalPct===100?T.green:T.accent, minWidth:28 }}>{totalPct}%</span>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button className="a8d-btn" onClick={handleEmail}>✉️ Envoyer récap</button>
              {/* Bouton clôture — visible uniquement si D8 complet */}
              {d8Complete && !cloture && (
                <button className="a8d-btn a8d-btn-cloture" onClick={handleCloture}>
                  🔒 Clôturer le 8D
                </button>
              )}
              {cloture && (
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"#e8fdf0", border:"1.5px solid #30d158", fontSize:12, fontWeight:700, color:"#1a7a3f" }}>
                  ✓ Clôturé — à marquer dans Silogue
                </div>
              )}
              <button className="a8d-btn a8d-btn-primary" style={{ background:saveBg, borderColor:saveBg }} onClick={handleSave} disabled={saveMsg==="saving"}>
                {saveLabel}
              </button>
              <button onClick={onCancel} style={{ width:30, height:30, borderRadius:"50%", background:"rgba(0,0,0,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:T.textSecond }}>✕</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, paddingBottom:14, overflowX:"auto" }}>
            {SECTIONS.map(s=>{
              const pct=progress[s.id]??0;
              return (
                <button key={s.id} className={`a8d-nav-btn ${pct===100?"done":pct>0?"partial":""}`} onClick={()=>scrollTo(s.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontSize:14 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".4px" }}>D{s.id}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, lineHeight:1.2, whiteSpace:"nowrap" }}>{s.label}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5, width:"100%" }}>
                    <div style={{ flex:1, height:3, borderRadius:2, background:T.border, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:pct===100?T.green:pct>0?T.orange:T.border, transition:"width .3s" }}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:pct===100?T.green:pct>0?T.orange:T.textLight, minWidth:24 }}>{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BODY ── */}
        <div ref={scrollRef} className="a8d-scroll" style={{ flex:1, overflowY:"auto", padding:"28px 28px 60px", display:"flex", flexDirection:"column", gap:52 }}>

          {/* CTX */}
          <section ref={el=>(sectionRefs.current["ctx"]=el)}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"#eef4ff", border:"1.5px solid rgba(0,113,227,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📌</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.font, fontSize:10, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".6px" }}>D1 – D2</div>
                <div style={{ fontFamily:T.fontDisplay, fontSize:17, fontWeight:700, color:T.textPrimary, lineHeight:1.2 }}>Contexte &amp; défaut(s)</div>
              </div>
              {fe&&<div style={{ padding:"4px 12px", borderRadius:20, background:"#eef4ff", border:"1.5px solid rgba(0,113,227,.2)", fontSize:12, fontWeight:600, color:T.accent }}>📋 {fe.numero_fe}</div>}
            </div>
            <div className="a8d-card" style={{ display:"grid", gap:18 }}>
              <Field label="Description du défaut"><textarea className="a8d-textarea" rows={3} value={data.description_defaut} onChange={e=>set("description_defaut",e.target.value)} placeholder="Description de la non-conformité déclarée…"/></Field>
              <div>
                <Label>Photos de la NC</Label>
                {!(data.photos||[]).length&&<p style={{ fontSize:12, color:T.textLight, fontStyle:"italic", margin:"4px 0 8px" }}>Aucune photo — importées depuis la FE si disponibles.</p>}
                <PhotosSection photos={data.photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} onLightbox={setLightbox}/>
              </div>
              {fe?.defauts&&fe.defauts.length>1&&(
                <div>
                  <Label>Défauts déclarés dans la FE</Label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:4 }}>
                    {fe.defauts.map((d,i)=>(
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 12px", background:T.surfaceAlt, borderRadius:T.rSm, border:`1.5px solid ${T.border}` }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:T.accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                        <span style={{ fontSize:12.5, color:T.textPrimary, lineHeight:1.4 }}>{d.defaut||"—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* D3 */}
          <section ref={el=>(sectionRefs.current[3]=el)}>
            <SectionTitle id={3} label="Actions immédiates" icon="⚡" pct={progress[3]}/>
            <div style={{ display:"grid", gap:16 }}>
              <div className="a8d-card">
                <Label>Actions réalisées</Label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                  {ACTIONS_IMMEDIATES.map(a=><Chip key={a} label={a} checked={data.actions_immediates.includes(a)} onChange={()=>toggleAct(a)}/>)}
                </div>
                <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, color:T.textSecond, fontWeight:600, whiteSpace:"nowrap" }}>Autre :</span>
                  <input className="a8d-input" value={data.action_immediate_autre} onChange={e=>set("action_immediate_autre",e.target.value)} placeholder="Préciser…"/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="Responsable"><RespSelect value={data.responsable_immediat} emailValue={data.responsable_immediat_email} onChange={(nom,email)=>setData(p=>({...p,responsable_immediat:nom,responsable_immediat_email:email}))}/></Field>
                <Field label="Date de réalisation"><input type="date" className="a8d-input" value={data.date_immediat} onChange={e=>set("date_immediat",e.target.value)}/></Field>
              </div>
            </div>
          </section>

          {/* D4 */}
          <section ref={el=>(sectionRefs.current[4]=el)}>
            <SectionTitle id={4} label="Analyse Ishikawa (6M)" icon="🔍" pct={progress[4]}/>
            <div style={{ display:"grid", gap:16 }}>
              <div className="a8d-card" style={{ maxWidth:380 }}>
                <Field label="Îlot / Process identifié" required>
                  <select className="a8d-select" value={data.ilot} onChange={e=>set("ilot",e.target.value)}>
                    <option value="">— Choisir l'îlot —</option>
                    {ILOTS.map(il=><option key={il} value={il}>{il}</option>)}
                  </select>
                </Field>
              </div>
              <div>
                <Label>Causes identifiées par famille (6M)</Label>
                <div className="a8d-6m-grid" style={{ marginTop:8 }}>
                  {FAMILLES_ISHIKAWA.map(famille=>(
                    <CauseBlock key={famille} famille={famille} options={causesIlot(famille)}
                      selected={data.causes_6m[famille]?.selected||[]} autre={data.causes_6m[famille]?.autre||""}
                      onChange={sel=>set6m(famille,{selected:sel})} onAutre={v=>set6m(famille,{autre:v})}/>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* D5 */}
          <section ref={el=>(sectionRefs.current[5]=el)}>
            <SectionTitle id={5} label="5 Pourquoi" icon="❓" pct={progress[5]}/>
            <div className="a8d-card" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:"#fff5f5", borderRadius:10, border:"1.5px solid rgba(255,59,48,.2)", padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff3b30" }}/>
                    <span style={{ fontFamily:T.fontDisplay, fontWeight:700, fontSize:13, color:T.textPrimary }}>Causes d'apparition</span>
                    {data.why_apparition.filter(Boolean).length>0&&<span style={{ marginLeft:"auto", background:"#ff3b30", color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 7px" }}>{data.why_apparition.filter(Boolean).length} entrée(s)</span>}
                  </div>
                  {data.why_apparition.filter(Boolean).length>0 ? data.why_apparition.filter(Boolean).map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
                      <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:"rgba(255,59,48,.12)", border:"1.5px solid rgba(255,59,48,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#ff3b30" }}>{i+1}</div>
                      <span style={{ fontSize:12.5, color:T.textPrimary, lineHeight:1.4 }}>{w}</span>
                    </div>
                  )) : <span style={{ fontSize:12, color:T.textLight, fontStyle:"italic" }}>Aucune cause saisie</span>}
                  {data.cause_racine_apparition&&<div style={{ marginTop:10, padding:"7px 10px", background:"#e8fdf0", borderRadius:7, border:"1.5px solid #30d158", fontSize:12, color:"#1a7a3f" }}><strong>Cause racine :</strong> {data.cause_racine_apparition}</div>}
                </div>
                <div style={{ background:"#fffbf0", borderRadius:10, border:"1.5px solid rgba(255,159,10,.2)", padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff9f0a" }}/>
                    <span style={{ fontFamily:T.fontDisplay, fontWeight:700, fontSize:13, color:T.textPrimary }}>Causes de non-détection</span>
                    {data.why_non_detection.filter(Boolean).length>0&&<span style={{ marginLeft:"auto", background:"#ff9f0a", color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 7px" }}>{data.why_non_detection.filter(Boolean).length} entrée(s)</span>}
                  </div>
                  {data.why_non_detection.filter(Boolean).length>0 ? data.why_non_detection.filter(Boolean).map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
                      <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:"rgba(255,159,10,.12)", border:"1.5px solid rgba(255,159,10,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#ff9f0a" }}>{i+1}</div>
                      <span style={{ fontSize:12.5, color:T.textPrimary, lineHeight:1.4 }}>{w}</span>
                    </div>
                  )) : <span style={{ fontSize:12, color:T.textLight, fontStyle:"italic" }}>Aucune cause saisie</span>}
                </div>
              </div>
              {data.problemes?.length>0&&<div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:T.rSm, background:"#eef4ff", border:"1.5px solid rgba(0,113,227,.2)" }}><span style={{ fontSize:14 }}>🔢</span><span style={{ fontSize:12.5, color:T.accent, fontWeight:600 }}>{data.problemes.length} problème{data.problemes.length>1?"s":""} à analyser — importés depuis la FE</span></div>}
              <button onClick={()=>setShowCausalTree(true)} style={{ fontFamily:T.font, fontSize:13.5, fontWeight:600, padding:"12px 20px", borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#ff3b30,#ff9f0a)", color:"#fff", boxShadow:"0 3px 12px rgba(255,100,10,0.30)", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .18s" }}>
                🌳 Ouvrir l'arbre de causalité
                {data.problemes?.length>0&&<span style={{ background:"rgba(255,255,255,.25)", borderRadius:10, padding:"1px 8px", fontSize:12 }}>{data.problemes.length} pb</span>}
              </button>
            </div>
            <CausalTreeModal open={showCausalTree} whyApparition={data.why_apparition} whyNonDetection={data.why_non_detection} causeRacine={data.cause_racine_apparition} problemes={data.problemes} fe={fe} onCancel={()=>setShowCausalTree(false)}
              onSave={({why_apparition,why_non_detection,cause_racine_apparition,problemes})=>{ setData(p=>({...p,why_apparition:[...why_apparition],why_non_detection:[...why_non_detection],cause_racine_apparition,...(problemes!==undefined?{problemes:[...problemes]}:{})})); setShowCausalTree(false); }}/>
          </section>

          {/* D6 */}
          <section ref={el=>(sectionRefs.current[6]=el)}>
            <SectionTitle id={6} label="Plan d'action" icon="📋" pct={progress[6]}/>
            <div style={{ display:"grid", gap:12 }}>
              {data.actions.map((a,i)=>(
                <div key={i} className="a8d-action-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:9, background:T.surfaceAlt, border:`1.5px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.fontDisplay, fontWeight:800, fontSize:13, color:T.textSecond }}>{i+1}</div>
                      <span style={{ fontSize:12, fontWeight:600, color:T.textSecond }}>Action {i+1}</span>
                    </div>
                    <button className="a8d-btn a8d-btn-danger" style={{ padding:"4px 10px", fontSize:11 }} onClick={()=>removeAction(i)}>Supprimer</button>
                  </div>
                  <div style={{ display:"grid", gap:12 }}>
                    <Field label="Description"><textarea className="a8d-textarea" rows={2} value={a.description} onChange={e=>updateAction(i,"description",e.target.value)} placeholder="Décrire l'action corrective ou préventive…"/></Field>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:12 }}>
                      <Field label="Responsable"><RespSelect value={a.responsable} emailValue={a.responsable_email} onChange={(nom,email)=>{ updateAction(i,"responsable",nom); updateAction(i,"responsable_email",email); }}/></Field>
                      <Field label="Échéance"><input type="date" className="a8d-input" value={a.echeance} onChange={e=>updateAction(i,"echeance",e.target.value)}/></Field>
                      <Field label="Type"><select className="a8d-select" value={a.type} onChange={e=>updateAction(i,"type",e.target.value)}><option>Corrective</option><option>Préventive</option><option>Immédiate</option></select></Field>
                    </div>
                    <Field label="Statut"><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{["À faire","En cours","Terminé","Non réalisable"].map(s=><StatutPill key={s} value={s} checked={a.statut===s} onSelect={()=>updateAction(i,"statut",s)}/>)}</div></Field>
                  </div>
                </div>
              ))}
              <button className="a8d-add-btn" onClick={addAction}>＋ Ajouter une action</button>
            </div>
          </section>

          {/* D7 */}
          <section ref={el=>(sectionRefs.current[7]=el)}>
            <SectionTitle id={7} label="Vérification d'efficacité" icon="✅" pct={progress[7]}/>
            <div className="a8d-card" style={{ display:"grid", gap:18 }}>
              <Field label="Méthode de vérification"><div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{VERIF_EFFICACITE.map(m=><RPill key={m} name="verif" value={m} checked={data.methode_verif===m} onChange={()=>set("methode_verif",m)}>{m}</RPill>)}</div></Field>
              <Field label="Résultat"><div style={{ display:"flex", gap:8 }}><RPill name="res" value="Efficace" checked={data.resultat_verif==="Efficace"} colorClass="c-green" onChange={()=>set("resultat_verif","Efficace")}>✓ Efficace</RPill><RPill name="res" value="Non efficace" checked={data.resultat_verif==="Non efficace"} colorClass="c-red" onChange={()=>set("resultat_verif","Non efficace")}>✗ Non efficace</RPill></div></Field>
              <Field label="Date de vérification" style={{ maxWidth:220 }}><input type="date" className="a8d-input" value={data.date_verif} onChange={e=>set("date_verif",e.target.value)}/></Field>
            </div>
          </section>

          {/* D8 */}
          <section ref={el=>(sectionRefs.current[8]=el)}>
            <SectionTitle id={8} label="Clôture" icon="🔒" pct={progress[8]}/>
            <div style={{ display:"grid", gap:16 }}>
              <div className="a8d-card" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Field label="Responsable Qualité"><RespSelect value={data.responsable_qualite} emailValue={data.responsable_qualite_email} onChange={(nom,email)=>setData(p=>({...p,responsable_qualite:nom,responsable_qualite_email:email}))}/></Field>
                <Field label="Date de clôture"><input type="date" className="a8d-input" value={data.date_cloture} onChange={e=>set("date_cloture",e.target.value)}/></Field>
                <Field label="NC récurrente ?" style={{ gridColumn:"1/-1" }}><div style={{ display:"flex", gap:8 }}><RPill name="rec" value="Oui" checked={data.recurrente==="Oui"} colorClass="c-red" onChange={()=>set("recurrente","Oui")}>🔄 Oui — récurrente</RPill><RPill name="rec" value="Non" checked={data.recurrente==="Non"} colorClass="c-green" onChange={()=>set("recurrente","Non")}>✓ Non — isolée</RPill></div></Field>
              </div>
              <div style={{ background:T.surface, borderRadius:T.r, border:`1.5px solid ${T.border}`, overflow:"hidden", boxShadow:T.shadow }}>
                <div style={{ background:"linear-gradient(135deg,#0071e3 0%,#34aadc 100%)", padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>📊</span>
                  <span style={{ fontFamily:T.fontDisplay, fontWeight:700, fontSize:15, color:"#fff" }}>Récapitulatif 8D</span>
                  <span style={{ marginLeft:"auto", background:"rgba(255,255,255,.2)", borderRadius:12, padding:"3px 10px", fontSize:12, fontWeight:700, color:"#fff" }}>{totalPct}% complété</span>
                </div>
                <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 28px" }}>
                  {[["Îlot",data.ilot],["D3 — Actions immédiates",data.actions_immediates.length>0?`${data.actions_immediates.length} action(s)`:null],["D6 — Plan d'action",`${data.actions.length} action(s)`],["D7 — Résultat vérif.",data.resultat_verif],["Responsable Qualité",data.responsable_qualite],["NC récurrente",data.recurrente]].map(([k,v])=>(
                    <div key={k} style={{ paddingBottom:8, borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:10, fontWeight:600, color:T.textLight, textTransform:"uppercase", letterSpacing:".3px", marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:v?T.textPrimary:T.textLight }}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingBottom:8 }}>
                <button className="a8d-btn" onClick={handleEmail}>✉️ Envoyer récap</button>
                {d8Complete && !cloture && (
                  <button className="a8d-btn a8d-btn-cloture" onClick={handleCloture}>🔒 Clôturer le 8D</button>
                )}
                {cloture && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"#e8fdf0", border:"1.5px solid #30d158", fontSize:12, fontWeight:700, color:"#1a7a3f" }}>
                    ✓ Clôturé — à marquer dans Silogue
                  </div>
                )}
                <button className="a8d-btn a8d-btn-primary" style={{ background:saveBg, borderColor:saveBg }} onClick={handleSave} disabled={saveMsg==="saving"}>{saveLabel}</button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {lightbox&&(
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }} onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="zoom" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:12, boxShadow:"0 20px 60px rgba(0,0,0,.5)" }}/>
        </div>
      )}
    </div>
  );
}