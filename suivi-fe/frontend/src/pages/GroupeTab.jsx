// src/pages/GroupeTab.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import Badge8D        from "../components/Badge8D.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const PRIORITES = [
  { key:"Critique", label:"Critique", icon:"🔴", badge:"ap-badge-red",    color:"#ff3b30", bg:"#fff0ef", border:"rgba(255,59,48,0.35)",  order:0 },
  { key:"Haute",    label:"Haute",    icon:"🟠", badge:"ap-badge-orange", color:"#ff9f0a", bg:"#fff8ed", border:"rgba(255,159,10,0.35)", order:1 },
  { key:"Normale",  label:"Normale",  icon:"🟢", badge:"ap-badge-green",  color:"#30d158", bg:"#e8fdf0", border:"rgba(48,209,88,0.30)",  order:2 },
];
const PRIORITE_MAP = Object.fromEntries(PRIORITES.map(p => [p.key, p]));

function PrioriteBadge({ value }) {
  const p = PRIORITE_MAP[value] || PRIORITE_MAP["Normale"];
  return <span className={`ap-badge ${p.badge}`} style={{ gap:4, display:"inline-flex", alignItems:"center" }}>{p.icon} {p.label}</span>;
}

function PrioriteSelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {PRIORITES.map(p => {
        const isActive = value === p.key;
        return (
          <button key={p.key} onClick={() => onChange(p.key)} style={{
            display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:8, width:"100%",
            border:`1.5px solid ${isActive?p.color:"rgba(0,0,0,0.09)"}`,
            background:isActive?p.bg:"#f5f5f7", color:isActive?p.color:"#6e6e73",
            fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",
            fontSize:12, fontWeight:700, cursor:"pointer", transition:"all .12s", textAlign:"left",
          }}>
            <span style={{ fontSize:14 }}>{p.icon}</span>
            <span>{p.label}</span>
            {isActive && <span style={{ marginLeft:"auto", fontSize:11 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

const GROUPE_CSS = `
.grp-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:rgba(255,255,255,0.85);backdrop-filter:blur(10px);border:1.5px solid rgba(0,0,0,0.08);border-radius:12px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);}
.grp-table-wrap{overflow-x:auto;border-radius:14px;background:#fff;border:1.5px solid rgba(0,0,0,0.08);box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.grp-table{width:100%;border-collapse:collapse;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;}
.grp-th{padding:11px 14px;text-align:left;font-size:10.5px;font-weight:700;color:#6e6e73;text-transform:uppercase;letter-spacing:.5px;background:#f5f5f7;border-bottom:1.5px solid rgba(0,0,0,0.08);white-space:nowrap;position:sticky;top:0;z-index:2;}
.grp-td{padding:12px 14px;border-bottom:1px solid rgba(0,0,0,0.04);vertical-align:middle;color:#1d1d1f;}
.grp-row{transition:background .1s;cursor:pointer;}
.grp-row:hover .grp-td{background:#f5f8ff;}
.grp-row:last-child .grp-td{border-bottom:none;}
.grp-row-open .grp-td{background:#f0f6ff !important;}
.grp-row-critique .grp-td:first-child{border-left:3px solid #ff3b30;}
.grp-row-haute .grp-td:first-child{border-left:3px solid #ff9f0a;}
.grp-row-normale .grp-td:first-child{border-left:3px solid #30d158;}
.grp-detail{background:#fff;border:1.5px solid rgba(0,113,227,0.18);border-radius:14px;overflow:hidden;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,113,227,0.08);}
.grp-detail-head{display:flex;align-items:center;gap:12px;padding:14px 20px;background:#f0f6ff;border-bottom:1.5px solid rgba(0,113,227,0.12);flex-wrap:wrap;}
.grp-detail-body{display:grid;grid-template-columns:1fr 280px;gap:0;}
.grp-detail-main{padding:18px 20px;border-right:1.5px solid rgba(0,0,0,0.06);}
.grp-detail-side{padding:18px 18px;}
.grp-chat{display:flex;flex-direction:column;gap:12px;max-height:280px;overflow-y:auto;margin-bottom:14px;padding-right:4px;}
.grp-chat::-webkit-scrollbar{width:4px;}
.grp-chat::-webkit-scrollbar-thumb{background:rgba(0,0,0,.10);border-radius:2px;}
.grp-msg-row{display:flex;gap:9px;align-items:flex-start;}
.grp-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;margin-top:1px;}
.grp-msg-meta{display:flex;align-items:center;gap:7px;margin-bottom:3px;}
.grp-msg-author{font-size:12px;font-weight:700;color:#1d1d1f;}
.grp-msg-date{font-size:10.5px;color:#aeaeb2;}
.grp-msg-bubble{font-size:13px;color:#1d1d1f;line-height:1.55;background:#f5f5f7;border-radius:0 10px 10px 10px;padding:8px 12px;display:inline-block;max-width:100%;}
.grp-input-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:8px;}
.grp-send-row{display:grid;grid-template-columns:1fr auto;gap:8px;}
.grp-stat-btn{display:flex;align-items:center;gap:7px;width:100%;padding:7px 12px;border-radius:8px;border:1.5px solid rgba(0,0,0,0.08);background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;font-size:12px;font-weight:600;color:#6e6e73;cursor:pointer;transition:all .12s;text-align:left;}
.grp-stat-btn:hover{background:#eef4ff;border-color:rgba(0,113,227,.25);color:#0071e3;}
.grp-stat-btn.active{background:#0071e3;border-color:#0071e3;color:#fff;}
.grp-site-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;}
.grp-prio-filter{display:flex;gap:5px;}
.grp-prio-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid rgba(0,0,0,0.09);background:#f5f5f7;color:#6e6e73;cursor:pointer;transition:all .12s;white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;}
.grp-prio-pill:hover{border-color:rgba(0,0,0,0.18);}
.grp-prio-pill.active-critique{background:#fff0ef;border-color:#ff3b30;color:#ff3b30;}
.grp-prio-pill.active-haute{background:#fff8ed;border-color:#ff9f0a;color:#ff9f0a;}
.grp-prio-pill.active-normale{background:#e8fdf0;border-color:#30d158;color:#1a7a3f;}
`;

const SITE_STYLE = {
  SOUCY:{ bg:"#e8f0fe", color:"#1a56a0" },
  SENS: { bg:"#f3e8ff", color:"#6b21a8" },
  LAXOU:{ bg:"#fff8ed", color:"#b45309" },
  KMTM: { bg:"#e8fdf0", color:"#1a7a3f" },
};

const STATUT_MAP = {
  "Ouvert":   { cls:"ap-badge-blue",   label:"Ouvert"   },
  "En cours": { cls:"ap-badge-orange", label:"En cours" },
  "Clôturé":  { cls:"ap-badge-green",  label:"Clôturé"  },
};

function SitePill({ site }) {
  const s = SITE_STYLE[site] || { bg:"#f5f5f7", color:"#6e6e73" };
  return <span className="grp-site-pill" style={{ background:s.bg, color:s.color }}>{site}</span>;
}

function Avatar({ name, site }) {
  const s = SITE_STYLE[site] || { bg:"#f5f5f7", color:"#6e6e73" };
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div className="grp-avatar" style={{ background:s.bg, color:s.color }}>{initials}</div>;
}

function DetailPanel({ nc, onClose, onOpen8D, onAddComment, onChangeStatut, onChangePriorite }) {
  const [texte,  setTexte]  = useState("");
  const [auteur, setAuteur] = useState("");
  const [site,   setSite]   = useState("SOUCY");

  const handleSend = () => {
    if (!texte.trim() || !auteur.trim()) return;
    onAddComment(nc.id, { auteur, site, texte, date: new Date().toLocaleString("fr-FR") });
    setTexte("");
  };

  const pCfg = PRIORITE_MAP[nc.priorite || "Normale"];

  return (
    <div className="grp-detail" style={{ borderColor:pCfg.border }}>
      <div className="grp-detail-head" style={{ borderBottomColor:pCfg.border, background:pCfg.bg }}>
        <span style={{ fontFamily:"monospace", fontSize:12, color:"#6e6e73", flexShrink:0 }}>{nc.ref}</span>
        <SitePill site={nc.site_detecteur} />
        <PrioriteBadge value={nc.priorite || "Normale"} />
        <span style={{ fontSize:14, fontWeight:700, color:"#1d1d1f", flex:1 }}>{nc.description}</span>
        <span className={`ap-badge ${STATUT_MAP[nc.statut]?.cls || "ap-badge-gray"}`}>{nc.statut}</span>
        <button className="ap-btn ap-btn-ghost" onClick={onClose} style={{ padding:"4px 10px", fontSize:12, flexShrink:0 }}>Fermer ✕</button>
      </div>

      <div className="grp-detail-body">
        <div className="grp-detail-main">
          <div style={{ fontSize:10.5, fontWeight:700, color:"#6e6e73", textTransform:"uppercase", letterSpacing:".5px", marginBottom:12 }}>Suivi collaboratif</div>
          <div className="grp-chat">
            {!(nc.commentaires||[]).length
              ? <div style={{ fontSize:13, color:"#aeaeb2", textAlign:"center", padding:"24px 0" }}>Aucun message — commencez le suivi.</div>
              : (nc.commentaires||[]).map((m,i) => (
                  <div key={i} className="grp-msg-row">
                    <Avatar name={m.auteur} site={m.site} />
                    <div>
                      <div className="grp-msg-meta">
                        <span className="grp-msg-author">{m.auteur}</span>
                        <SitePill site={m.site} />
                        <span className="grp-msg-date">{m.date}</span>
                      </div>
                      <div className="grp-msg-bubble">{m.texte}</div>
                    </div>
                  </div>
                ))}
          </div>
          <div className="grp-input-row">
            <input className="ap-input" placeholder="Votre nom..." value={auteur} onChange={e=>setAuteur(e.target.value)} style={{ fontSize:12 }}/>
            <select className="ap-select" value={site} onChange={e=>setSite(e.target.value)} style={{ fontSize:12, width:90 }}>
              {["SOUCY","SENS","LAXOU","KMTM"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grp-send-row">
            <textarea className="ap-textarea" rows={2} placeholder="Ajouter un constat, une action, une décision..." value={texte} onChange={e=>setTexte(e.target.value)} style={{ fontSize:13 }}/>
            <button className="ap-btn ap-btn-primary" onClick={handleSend} disabled={!texte.trim()||!auteur.trim()} style={{ alignSelf:"flex-end" }}>Envoyer</button>
          </div>
        </div>

        <div className="grp-detail-side">
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:"#6e6e73", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>Priorité</div>
            <PrioriteSelector value={nc.priorite || "Normale"} onChange={v => onChangePriorite(nc.id, v)} />
          </div>

          <div style={{ borderTop:"1.5px solid rgba(0,0,0,0.07)", paddingTop:14, marginBottom:18 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:"#6e6e73", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>Analyse 8D</div>
            {/* Badge8D partagé — lit analyse_8d depuis KEP_NC via nc.analyse_8d */}
            <div style={{ marginBottom:10 }}><Badge8D fe={nc} /></div>
            <button className="ap-btn ap-btn-primary" onClick={() => onOpen8D(nc)} style={{ width:"100%", justifyContent:"center" }}>
              Ouvrir l'analyse 8D
            </button>
          </div>

          <div style={{ borderTop:"1.5px solid rgba(0,0,0,0.07)", paddingTop:14 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:"#6e6e73", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>Statut</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {["Ouvert","En cours","Clôturé"].map(s=>(
                <button key={s} className={`grp-stat-btn${nc.statut===s?" active":""}`} onClick={() => onChangeStatut(nc.id, s)}>
                  {nc.statut===s?"✓ ":""}{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 25;

export default function GroupeTab() {
  const [ncs,        setNcs]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [q,          setQ]          = useState("");
  const [filterSite, setFilterSite] = useState("Tous");
  const [filterSt,   setFilterSt]   = useState("Tous");
  const [filterPrio, setFilterPrio] = useState("Tous");
  const [sortPrio,   setSortPrio]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [page,       setPage]       = useState(1);
  const [modal8D,    setModal8D]    = useState({ open: false, fe: null, value: "" });

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("grp-css")) {
      const s = document.createElement("style"); s.id="grp-css"; s.textContent=GROUPE_CSS;
      document.head.appendChild(s);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kep_token");
      const res = await axios.get(`${API}/api/fe/groupe`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) setNcs(res.data.data);
    } catch { setNcs(MOCK_NCS); }
    finally { setLoading(false); }
  };

  const addComment = async (id, comment) => {
    try {
      const token = localStorage.getItem("kep_token");
      await axios.post(`${API}/api/fe/groupe/${id}/commentaire`, { auteur:comment.auteur, site:comment.site, texte:comment.texte }, { headers: { Authorization: `Bearer ${token}` } });
      await loadData();
    } catch { alert("Erreur lors de l'envoi du message."); }
  };

  const changeStatut = async (id, statut) => {
    setNcs(prev => prev.map(nc => nc.id===id ? { ...nc, statut } : nc));
    try {
      const token = localStorage.getItem("kep_token");
      await axios.patch(`${API}/api/fe/groupe/${id}`, { statut }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { await loadData(); }
  };

  const changePriorite = async (id, priorite) => {
    setNcs(prev => prev.map(nc => nc.id===id ? { ...nc, priorite } : nc));
    try {
      const token = localStorage.getItem("kep_token");
      await axios.patch(`${API}/api/fe/groupe/${id}`, { priorite }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { await loadData(); }
  };

  const open8D  = fe  => setModal8D({ open: true, fe, value: fe.analyse_8d || "" });
  const close8D = ()  => setModal8D({ open: false, fe: null, value: "" });

  // Save 8D dans KEP_NC_GROUPE via PATCH
  const save8D = async (v) => {
    if (!modal8D.fe) return;
    setNcs(prev => prev.map(nc => nc.id===modal8D.fe.id ? { ...nc, analyse_8d:v } : nc));
    close8D();
    try {
      const token = localStorage.getItem("kep_token");
      await axios.patch(`${API}/api/fe/groupe/${modal8D.fe.id}`, { analyse_8d: v }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { await loadData(); }
  };

  const filtered = useMemo(() => {
    let list = ncs.filter(nc => {
      const mQ  = !q.trim() || [nc.ref, nc.description, nc.fournisseur, nc.code_article].some(f=>(f||"").toLowerCase().includes(q.toLowerCase()));
      const mSt = filterSite==="Tous" || nc.site_detecteur===filterSite;
      const mSs = filterSt==="Tous"   || nc.statut===filterSt;
      const mPr = filterPrio==="Tous" || (nc.priorite||"Normale")===filterPrio;
      return mQ && mSt && mSs && mPr;
    });
    if (sortPrio) list = [...list].sort((a,b) => (PRIORITE_MAP[a.priorite||"Normale"]?.order??2) - (PRIORITE_MAP[b.priorite||"Normale"]?.order??2));
    return list;
  }, [ncs, q, filterSite, filterSt, filterPrio, sortPrio]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = useMemo(() => filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE), [filtered, page]);
  const expandedNC = ncs.find(n => n.id === expandedId);

  const kpisPrio = PRIORITES.map(p => ({ ...p, count: ncs.filter(n=>(n.priorite||"Normale")===p.key).length }));
  const kpis = [
    { label:"Total NC groupe", val:ncs.length,                                    badge:"ap-badge-blue"   },
    { label:"Ouvertes",        val:ncs.filter(n=>n.statut==="Ouvert").length,      badge:"ap-badge-blue"   },
    { label:"En cours",        val:ncs.filter(n=>n.statut==="En cours").length,    badge:"ap-badge-orange" },
    { label:"Clôturées",       val:ncs.filter(n=>n.statut==="Clôturé").length,     badge:"ap-badge-green"  },
  ];

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif", padding:"24px 28px", background:"#f5f5f7", minHeight:"100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">
            Espace Groupe
            <span className="ap-badge ap-badge-green" style={{ marginLeft:12, verticalAlign:"middle", fontSize:12 }}>🔗 Inter-sites</span>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
            {!loading && kpis.map(k => <span key={k.label} className={`ap-badge ${k.badge}`}>{k.val} {k.label}</span>)}
            {!loading && kpisPrio.map(p => p.count>0 && <span key={p.key} className={`ap-badge ${p.badge}`}>{p.icon} {p.count} {p.label}</span>)}
          </div>
        </div>
      </div>

      <div className="grp-toolbar">
        <input className="ap-input" style={{ flex:1, minWidth:200 }} value={q} onChange={e=>{setQ(e.target.value);setPage(1);}} placeholder="Recherche N° FE, article, fournisseur…"/>
        <select className="ap-select" style={{ minWidth:110 }} value={filterSt} onChange={e=>{setFilterSt(e.target.value);setPage(1);}}>
          {["Tous","Ouvert","En cours","Clôturé"].map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="ap-select" style={{ minWidth:100 }} value={filterSite} onChange={e=>{setFilterSite(e.target.value);setPage(1);}}>
          {["Tous","SOUCY","SENS","LAXOU","KMTM"].map(s=><option key={s}>{s}</option>)}
        </select>
        <div className="grp-prio-filter">
          <button className="grp-prio-pill" style={filterPrio==="Tous"?{background:"#1d1d1f",color:"#fff",borderColor:"#1d1d1f"}:{}} onClick={()=>{setFilterPrio("Tous");setPage(1);}}>Toutes priorités</button>
          {PRIORITES.map(p=>(
            <button key={p.key} className={`grp-prio-pill${filterPrio===p.key?` active-${p.key.toLowerCase()}`:""}`} onClick={()=>{setFilterPrio(filterPrio===p.key?"Tous":p.key);setPage(1);}}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        <button className={`ap-btn${sortPrio?" ap-btn-primary":""}`} onClick={()=>setSortPrio(v=>!v)}>
          {sortPrio?"↑ Priorité":"Trier priorité"}
        </button>
        {(q||filterSt!=="Tous"||filterSite!=="Tous"||filterPrio!=="Tous"||sortPrio) && (
          <button className="ap-btn" onClick={()=>{setQ("");setFilterSt("Tous");setFilterSite("Tous");setFilterPrio("Tous");setSortPrio(false);setPage(1);}}>Réinitialiser</button>
        )}
      </div>

      {expandedNC && (
        <DetailPanel nc={expandedNC} onClose={()=>setExpandedId(null)} onOpen8D={open8D}
          onAddComment={addComment} onChangeStatut={changeStatut} onChangePriorite={changePriorite}/>
      )}

      <div className="grp-table-wrap">
        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:"#aeaeb2" }}>Chargement…</div>
        ) : (
          <table className="grp-table">
            <thead>
              <tr>
                <th className="grp-th">N° FE</th>
                <th className="grp-th">Site</th>
                <th className="grp-th">Priorité</th>
                <th className="grp-th">Fournisseur KEP</th>
                <th className="grp-th">Article</th>
                <th className="grp-th">Description</th>
                <th className="grp-th">Avancement 8D</th>
                <th className="grp-th">Messages</th>
                <th className="grp-th">Statut</th>
                <th className="grp-th"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(nc => {
                const isOpen  = expandedId===nc.id;
                const badge   = STATUT_MAP[nc.statut]||{ cls:"ap-badge-gray", label:nc.statut };
                const nbMsg   = (nc.commentaires||[]).length;
                const prioKey = (nc.priorite||"Normale").toLowerCase();
                return (
                  <tr key={nc.id} className={`grp-row grp-row-${prioKey}${isOpen?" grp-row-open":""}`} onClick={()=>setExpandedId(isOpen?null:nc.id)}>
                    <td className="grp-td">
                      <div style={{ fontWeight:700, color:"#0071e3", fontSize:13 }}>{nc.ref}</div>
                      {nc.date_creation && <div style={{ fontSize:11, color:"#aeaeb2", marginTop:2 }}>{new Date(nc.date_creation).toLocaleDateString("fr-FR")}</div>}
                    </td>
                    <td className="grp-td"><SitePill site={nc.site_detecteur}/></td>
                    <td className="grp-td"><PrioriteBadge value={nc.priorite||"Normale"}/></td>
                    <td className="grp-td">
                      <div style={{ fontWeight:600, fontSize:13 }}>{nc.fournisseur}</div>
                      <div style={{ fontSize:10.5, color:"#30d158", fontWeight:700, marginTop:1 }}>Site KEP</div>
                    </td>
                    <td className="grp-td" style={{ fontFamily:"monospace", fontSize:12 }}>{nc.code_article||"—"}</td>
                    <td className="grp-td" style={{ maxWidth:240 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:13 }}>{nc.description}</div>
                    </td>
                    <td className="grp-td"><Badge8D fe={nc}/></td>
                    <td className="grp-td">
                      {nbMsg>0
                        ? <span className="ap-badge ap-badge-blue">{nbMsg} message{nbMsg>1?"s":""}</span>
                        : <span style={{ fontSize:12, color:"#aeaeb2" }}>—</span>}
                    </td>
                    <td className="grp-td"><span className={`ap-badge ${badge.cls}`}>{badge.label}</span></td>
                    <td className="grp-td" style={{ color:"#aeaeb2", fontSize:16, textAlign:"center" }}>{isOpen?"▲":"▼"}</td>
                  </tr>
                );
              })}
              {!paged.length && !loading && (
                <tr><td className="grp-td" colSpan={10} style={{ textAlign:"center", padding:48, color:"#aeaeb2" }}>Aucune NC groupe trouvée</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages>1 && (
        <div className="ap-pagination">
          <button className="ap-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>← Précédent</button>
          <span style={{ color:"#6e6e73", fontSize:13 }}>Page <b>{page}</b> / {totalPages}<span style={{ color:"#aeaeb2", marginLeft:8 }}>({filtered.length} NC)</span></span>
          <button className="ap-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Suivant →</button>
        </div>
      )}

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        onCancel={close8D} onSave={save8D}
      />
    </div>
  );
}

const MOCK_NCS = [
  { id:1, ref:"FEG-2025-041", site_detecteur:"SOUCY", fournisseur:"SENS", code_article:"VCI-1B-014", description:"Jeu excessif sur alésage bride VCI — détecté au montage", statut:"En cours", priorite:"Critique", commentaires:[{ auteur:"F. Martin", site:"SOUCY", texte:"Défaut constaté sur lot 2025-W10.", date:"12/03/25 08:14" }] },
  { id:2, ref:"FEG-2025-038", site_detecteur:"LAXOU", fournisseur:"SOUCY", code_article:"CR-1B-028",  description:"Marquage laser absent sur série CR 1B", statut:"Ouvert",   priorite:"Haute",    commentaires:[{ auteur:"C. Petit",  site:"LAXOU", texte:"45 pièces bloquées réception.", date:"08/03/25 11:20" }] },
  { id:3, ref:"FEG-2025-029", site_detecteur:"SENS",  fournisseur:"LAXOU", code_article:"MM04-007",   description:"Contamination lubrifiant sur pièces MM04", statut:"Clôturé",  priorite:"Normale",  commentaires:[] },
];