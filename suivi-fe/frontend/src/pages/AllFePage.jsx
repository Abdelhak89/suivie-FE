// src/pages/AllFePage.jsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllFE } from "../services/feApi.js";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import Badge8D        from "../components/Badge8D.jsx";
import DelaiSecuBadge from "../components/DelaiSecuBadge.jsx";
import { getSiteFromJWT } from "../utils/auth.js";
import { useAnalyses8D }  from "../hooks/useAnalyses8D.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import axios from "axios";
import FEBadge from "../components/FEBadge";
import DemandeSuppressionModal from "../components/DemandeSuppressionModal.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SITE_COLORS = {
  SOUCY: { bg: "#e8f0fe", color: "#1a56a0" },
  SENS:  { bg: "#f3e8ff", color: "#6b21a8" },
  LAXOU: { bg: "#fff8ed", color: "#b45309" },
  KMTM:  { bg: "#e8fdf0", color: "#1a7a3f" },
};

function SourceBadge({ source, site }) {
  if (source === "app") {
    const s = SITE_COLORS[site?.toUpperCase()] || { bg: "#f5f5f7", color: "#6e6e73" };
    return <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:s.bg, color:s.color }}>{site?.toUpperCase() || "APP"}</span>;
  }
  return <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:"rgba(0,0,0,0.06)", color:"#6e6e73" }}>SILOG</span>;
}

const statutBadge = s => {
  if (!s) return "ap-badge-gray";
  const sl = s.toLowerCase();
  if (sl.includes("traité") || sl.includes("clôt") || sl.includes("clos")) return "ap-badge-green";
  if (sl.includes("cours")) return "ap-badge-orange";
  return "ap-badge-gray";
};

// ── Bouton contestation ───────────────────────────────────────
function ContesterBtn({ fe, onContested }) {
  const [loading,       setLoading]       = useState(false);
  const [showMotif,     setShowMotif]     = useState(false);
  const [motif,         setMotif]         = useState("");
  const token = localStorage.getItem("kep_token");

  const handleContester = async () => {
    if (!fe?.id || !fe?.site) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/nc-fe/${fe.site.toLowerCase()}/contester`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ id: fe.id, motif }),
      });
      const json = await res.json();
      if (json.success) {
        onContested({ ...fe, contestee: json.contestee, motif_contestation: json.motif_contestation });
        setShowMotif(false);
        setMotif("");
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  if (fe?.contestee) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:10, fontSize:11, fontWeight:700, background:"#fff8ed", color:"#d46b08", border:"1px solid #ffd591" }}>
          ⚡ Contestée
        </span>
        <button
          onClick={() => { setMotif(""); handleContester(); }}
          style={{ fontSize:10, color:"#888", background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div>
      {showMotif ? (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <input
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Motif (optionnel)…"
            style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #d9d9d9", fontSize:12, width:160 }}
            autoFocus
          />
          <div style={{ display:"flex", gap:4 }}>
            <button
              onClick={handleContester}
              disabled={loading}
              style={{ padding:"3px 10px", borderRadius:6, border:"none", background:"#d46b08", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}
            >
              {loading ? "…" : "Confirmer"}
            </button>
            <button
              onClick={() => setShowMotif(false)}
              style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #d9d9d9", background:"#fff", fontSize:11, cursor:"pointer" }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowMotif(true)}
          style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #ffd591", background:"#fff8ed", color:"#d46b08", fontSize:11, fontWeight:600, cursor:"pointer" }}
        >
          Contester
        </button>
      )}
    </div>
  );
}

export default function AllFePage() {
  const [sp]  = useSearchParams();
  const annee = sp.get("annee") ?? "2026";

  const [silog,      setSilog]      = useState([]);
  const [appFE,      setAppFE]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal8D,    setModal8D]    = useState({ open: false, fe: null, value: "" });
  const { map: analyses8D, update: updateAnalyses8D } = useAnalyses8D();
  const [filtre,     setFiltre]     = useState("tous");
  const [q,          setQ]          = useState("");
  const [feCountMap,   setFeCountMap]   = useState({});
  const [demandeModal, setDemandeModal] = useState(null); // fe

  const token = localStorage.getItem("kep_token");
  const site  = getSiteFromJWT();

  useEffect(() => { injectGlobalCSS(); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    Promise.allSettled([
      getAllFE({ annee: annee || null, limit: 200 })
        .then(r => setSilog((r.items || []).map(fe => ({ ...fe, source: "silog" })))),

      axios.get(`${API}/api/nc-fe/all`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setAppFE((r.data.items || []).map(fe => ({ ...fe, source: "app" })))),

    ]).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [annee]);

  useEffect(() => {
    const siteKey = site?.toLowerCase() || "soucy";
    fetch(`${API}/api/fe/par-article?site=${siteKey}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) return;
        const map = {};
        for (const row of json.data) {
          map[row.code_article] = { total: row.total, en_cours: row.en_cours };
        }
        setFeCountMap(map);
      })
      .catch(() => {});
  }, [site]);

  // Mise à jour locale après contestation
  const handleContested = (updatedFe) => {
    setAppFE(prev => prev.map(fe =>
      fe.id === updatedFe.id ? { ...fe, contestee: updatedFe.contestee, motif_contestation: updatedFe.motif_contestation } : fe
    ));
  };

  // Mise à jour locale après calcul délai
  const handleDelaiCalculated = (feId, delai) => {
    setAppFE(prev => prev.map(fe => fe.id === feId ? { ...fe, delai_securisation: delai } : fe));
  };

  const allItems = useMemo(() => {
    let list = filtre === "silog" ? silog : filtre === "app" ? appFE : [...silog, ...appFE];
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(fe => [fe.numero_fe, fe.code_article, fe.designation, fe.statut, fe.site].some(f => (f||"").toLowerCase().includes(ql)));
    }
    return list.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [silog, appFE, filtre, q]);

  const open8D = (fe) => setModal8D({
    open: true, fe,
    value: analyses8D[fe.numero_fe] || fe.analyse_8d || "",
  });

  const handleSave8D = (v) => {
    if (modal8D.fe?.numero_fe) updateAnalyses8D(modal8D.fe.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>

      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Toutes les FE</div>
          <div className="ap-sub">
            Année : <b>{annee || "toutes"}</b> — {loading ? "Chargement…" : `${allItems.length} FE`}
            {!loading && <span style={{ marginLeft:8, fontSize:12, color:T.textLight }}>({silog.length} SILOG · {appFE.length} app)</span>}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher N° FE, article…"
          style={{ flex:1, minWidth:200, padding:"9px 13px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:13, fontFamily:T.font, background:T.surface, outline:"none" }} />
        <div style={{ display:"flex", gap:6 }}>
          {[
            { key:"tous",  label:`Tous (${silog.length + appFE.length})` },
            { key:"silog", label:`SILOG (${silog.length})` },
            { key:"app",   label:`App (${appFE.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltre(key)} style={{
              padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:T.font, transition:"all .12s",
              border:`1.5px solid ${filtre===key?T.accent:T.border}`,
              background:filtre===key?T.accent:"transparent",
              color:filtre===key?"#fff":T.muted,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        {loading ? (
          <div style={{ padding:32, textAlign:"center", color:T.textLight }}>Chargement…</div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th className="ap-th">N° FE</th>
                <th className="ap-th">Source</th>
                <th className="ap-th">Article</th>
                <th className="ap-th">Statut</th>
                <th className="ap-th">Qté NC</th>
                <th className="ap-th">Date</th>
                <th className="ap-th">Délai sécu</th>
                <th className="ap-th">Avancement 8D</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((fe, i) => {
                const feEnrichi = { ...fe, analyse_8d: analyses8D[fe.numero_fe] || fe.analyse_8d };
                const counts    = feCountMap[fe.code_article];
                const isApp     = fe.source === "app";
                return (
                  <tr key={`${fe.source}-${fe.numero_fe}-${i}`} className="ap-tr-hover"
                    style={{ opacity: fe.contestee ? 0.6 : 1 }}>

                    <td className="ap-td">
                      <button onClick={() => open8D(feEnrichi)} style={{ background:"none", border:"none", cursor:"pointer", fontWeight:700, color:T.accent, fontSize:13, padding:0, fontFamily:T.font }}>
                        {fe.numero_fe || "—"}
                      </button>
                      {fe.contestee && (
                        <div style={{ fontSize:10, color:"#d46b08", fontWeight:600, marginTop:2 }}>
                          ⚡ Contestée{fe.motif_contestation ? ` — ${fe.motif_contestation}` : ""}
                        </div>
                      )}
                    </td>

                    <td className="ap-td"><SourceBadge source={fe.source} site={fe.site} /></td>

                    <td className="ap-td">
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"monospace", fontSize:11, color:T.textSecond }}>
                          {fe.code_article || "—"}
                        </span>
                        {counts && (
                          <FEBadge
                            codeArticle={fe.code_article}
                            count={counts.total}
                            enCours={counts.en_cours}
                            site={site?.toLowerCase() || "soucy"}
                            designation={fe.designation_article || fe.designation || ""}
                          />
                        )}
                      </div>
                    </td>

                    <td className="ap-td">
                      <span className={`ap-badge ${statutBadge(fe.statut)}`}>{fe.statut || "—"}</span>
                    </td>

                    <td className="ap-td" style={{ fontWeight:600 }}>
                      {fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : fe.quantite || "—"}
                    </td>

                    <td className="ap-td" style={{ color:T.textSecond, fontSize:12 }}>
                      {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : "—"}
                    </td>

                    {/* ── Délai sécurisation — FE App uniquement ── */}
                    <td className="ap-td">
                      {isApp ? (
                        <DelaiSecuBadge
                          fe={fe}
                          site={fe.site?.toLowerCase()}
                          onCalculate={(delai) => handleDelaiCalculated(fe.id, delai)}
                        />
                      ) : <span style={{ fontSize:11, color:T.textLight }}>—</span>}
                    </td>

                    <td className="ap-td">
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <Badge8D fe={feEnrichi} />
                        {fe.source === "silog" && (
                          <button className="ap-btn" style={{ padding:"3px 9px", fontSize:11 }} onClick={() => open8D(feEnrichi)}>
                            8D
                          </button>
                        )}
                        {/* Contestation — FE App uniquement */}
                        {isApp && (
                          <ContesterBtn fe={fe} onContested={handleContested} />
                        )}
                        {/* Demande suppression — FE App uniquement */}
                        {isApp && (
                          <button
                            onClick={() => setDemandeModal(fe)}
                            title="Demander la suppression"
                            style={{ padding:"3px 8px", borderRadius:6, border:"1.5px solid rgba(255,59,48,0.3)", background:"#fff0ef", color:"#ff3b30", fontSize:11, cursor:"pointer", fontWeight:600 }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
              {!allItems.length && (
                <tr><td className="ap-td" colSpan={8} style={{ textAlign:"center", color:T.textLight, padding:40 }}>Aucune FE trouvée</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        site={site}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={handleSave8D}
      />

      {demandeModal && (
        <DemandeSuppressionModal
          fe={demandeModal}
          onClose={() => setDemandeModal(null)}
          onSent={() => {
            // Marque localement la FE comme "demande en attente"
            setAppFE(prev => prev.map(f => f.id === demandeModal.id ? { ...f, _demande_suppression: true } : f));
            setDemandeModal(null);
          }}
        />
      )}
    </div>
  );
}