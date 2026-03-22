// src/pages/ClientPage.jsx
import { useEffect, useState } from "react";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import Badge8D        from "../components/Badge8D.jsx";
import DelaiSecuBadge from "../components/DelaiSecuBadge.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage }    from "../hooks/useGridPage.js";
import { useAppFE }       from "../hooks/useAppFE.js";
import { useAnalyses8D }  from "../hooks/useAnalyses8D.js";
import SourceToggle       from "../components/SourceToggle.jsx";
import { PAGES }          from "../config/fePages.js";
import { getSiteFromJWT } from "../utils/auth.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const GRAVITE_BADGE = { mineur:"ap-badge-green", majeur:"ap-badge-orange", critique:"ap-badge-red" };
const STATUT_BADGE  = { ouvert:"ap-badge-blue", en_cours:"ap-badge-orange", clos:"ap-badge-green" };

function getClientCode(fe) { return (fe.code_article || "").slice(0, 3) || "—"; }
function getClientName(fe) { return fe.client_fourn || fe.client_programme || getClientCode(fe); }
function getNcClient(fe)   { return fe.no_commande || fe.numero_nc_client || fe.var_alpha_3 || "—"; }

// ── Modal contestation ────────────────────────────────────────────────────────
function ContestModal({ fe, onClose, onSave }) {
  const [motif, setMotif] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,0.4)",
      display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:14,
        padding:24, width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", fontFamily:T.font }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#ff3b30", marginBottom:4 }}>
          ⚠️ Contester la FE client
        </div>
        <div style={{ fontSize:12, color:T.textSecond, marginBottom:16 }}>
          FE {fe?.numero_fe} — {getClientName(fe)}
        </div>
        <div style={{ padding:"10px 14px", background:"#fff8ed", borderRadius:8,
          border:"1.5px solid #ff9f0a", fontSize:12, color:"#b45309", marginBottom:16 }}>
          Cette FE sera <strong>exclue des KPI</strong> une fois contestée. Opération réversible.
        </div>
        <label style={{ fontSize:11, fontWeight:700, color:T.textSecond, textTransform:"uppercase", letterSpacing:".3px" }}>
          Motif de contestation *
        </label>
        <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3}
          placeholder="Expliquer pourquoi cette FE est contestée..."
          style={{ width:"100%", marginTop:8, padding:"9px 12px", borderRadius:8,
            border:`1.5px solid ${T.border}`, fontSize:13, fontFamily:T.font,
            boxSizing:"border-box", outline:"none", resize:"vertical" }} />
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", borderRadius:8,
            border:`1.5px solid ${T.border}`, background:"transparent", cursor:"pointer", fontFamily:T.font, fontSize:13 }}>
            Annuler
          </button>
          <button onClick={() => motif.trim() && onSave(motif)} disabled={!motif.trim()}
            style={{ flex:1, padding:"9px", borderRadius:8, border:"none",
              background:motif.trim()?"#ff3b30":"#ccc", color:"#fff",
              cursor:motif.trim()?"pointer":"not-allowed", fontFamily:T.font, fontSize:13, fontWeight:700 }}>
            Confirmer la contestation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const config = PAGES["client"];
  const gp     = useGridPage({ origine: "RCLI", config });

  const [source,  setSource]  = useState("diapason");
  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });

  // FE contestées — stocké localement + sync BDD
  const [contestees, setContestees] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kep_fe_contestees") || "{}"); } catch { return {}; }
  });
  const [contestModal, setContestModal] = useState(null);

  const { map: analyses8D, update: updateAnalyses8D } = useAnalyses8D();

  const appFE = useAppFE("client", {
    q:      source === "app" ? gp.q      : "",
    statut: source === "app" ? gp.statut : "Tous",
    annee:  source === "app" ? gp.annee  : null,
  });

  useEffect(() => { injectGlobalCSS(); }, []);

  const open8D     = (fe) => setModal8D({ open: true, fe, value: analyses8D[fe.numero_fe] || fe.analyse_8d || "" });
  const handleSave8D = (v) => {
    if (modal8D.fe?.numero_fe) updateAnalyses8D(modal8D.fe.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  const handleContester = async (fe, motif) => {
    const token = localStorage.getItem("kep_token");
    const site  = (fe.site || getSiteFromJWT() || "soucy").toLowerCase();
    try {
      await fetch(`${API}/api/nc-fe/${site}/contester`, {
        method:"PATCH", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ id: fe.id, motif }),
      });
    } catch {}
    const updated = { ...contestees, [fe.numero_fe || fe.id]: { motif, date: new Date().toISOString() } };
    setContestees(updated);
    localStorage.setItem("kep_fe_contestees", JSON.stringify(updated));
    setContestModal(null);
  };

  const handleRecontester = (fe) => {
    const updated = { ...contestees };
    delete updated[fe.numero_fe || fe.id];
    setContestees(updated);
    localStorage.setItem("kep_fe_contestees", JSON.stringify(updated));
  };

  const isApp   = source === "app";
  const rows    = isApp ? appFE.items : gp.pagedRows;
  const loading = isApp ? appFE.loading : gp.loading;
  const contestedCount = Object.keys(contestees).length;

  return (
    <div style={{ fontFamily:T.font, padding:24, background:T.bg, minHeight:"100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">
            Suivi Clients
            {contestedCount > 0 && (
              <span className="ap-badge ap-badge-orange" style={{ marginLeft:10, fontSize:11, verticalAlign:"middle" }}>
                {contestedCount} FE contestée{contestedCount>1?"s":""} — exclues KPI
              </span>
            )}
          </div>
          <div className="ap-sub">{loading ? "Chargement…" : `${isApp ? appFE.total : gp.items.length} FE`}</div>
        </div>
        <SourceToggle source={source} onChange={setSource} diapasonLabel="SILOG"
          diapasonCount={gp.items?.length} appCount={appFE.total} />
      </div>

      <GridToolbar q={gp.q} setQ={gp.setQ} statut={gp.statut} setStatut={gp.setStatut}
        annee={gp.annee} setAnnee={gp.setAnnee}
        onlyMissing={gp.onlyMissing} setOnlyMissing={gp.setOnlyMissing}
        onPageReset={() => gp.setPage(1)} />

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th className="ap-th">N° FE</th>
              <th className="ap-th">Client</th>
              <th className="ap-th">Article</th>
              <th className="ap-th">N° NC Client</th>
              <th className="ap-th">Statut</th>
              <th className="ap-th">Qté NC</th>
              <th className="ap-th">Délai sécu</th>
              {isApp && <th className="ap-th">Gravité</th>}
              {isApp && <th className="ap-th">Déclarant</th>}
              <th className="ap-th">Avancement 8D</th>
              <th className="ap-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fe, idx) => {
              const feId        = fe.numero_fe || fe.id;
              const feEnrichi   = isApp ? fe : { ...fe, analyse_8d: analyses8D[fe.numero_fe] || fe.analyse_8d };
              const clientCode  = getClientCode(fe);
              const clientName  = getClientName(fe);
              const ncClient    = getNcClient(fe);
              const isConteste  = !!contestees[feId];
              const contestInfo = contestees[feId];

              return (
                <tr key={feId || idx} className="ap-tr-hover"
                  style={{ opacity: isConteste ? 0.6 : 1 }}>

                  <td className="ap-td">
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <button onClick={() => open8D(feEnrichi)} style={{ background:"none", border:"none",
                        cursor:"pointer", fontWeight:700, color:"#0071e3", fontSize:13, padding:0, fontFamily:"inherit" }}>
                        {feId || "—"}
                      </button>
                      {isConteste && (
                        <span className="ap-badge ap-badge-red" style={{ fontSize:9 }}>Contestée</span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:T.textSecond, marginTop:2 }}>
                      {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </td>

                  <td className="ap-td">
                    <div style={{ fontWeight:600, fontSize:12 }}>{clientName}</div>
                    <div style={{ fontSize:10, color:T.textLight, fontFamily:"monospace" }}>{clientCode}</div>
                  </td>

                  <td className="ap-td" style={{ fontSize:12 }}>
                    <div style={{ fontFamily:"monospace", fontSize:11 }}>{fe.code_article || "—"}</div>
                    <div style={{ fontSize:11, color:T.textLight, maxWidth:140, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {fe.designation_article || fe.designation || ""}
                    </div>
                  </td>

                  <td className="ap-td" style={{ fontSize:12,
                    color: ncClient!=="—" ? T.textPrimary : T.textLight,
                    fontWeight: ncClient!=="—" ? 600 : 400 }}>
                    {ncClient}
                  </td>

                  <td className="ap-td">
                    {isApp
                      ? <span className={`ap-badge ${STATUT_BADGE[fe.statut]||"ap-badge-gray"}`}>{fe.statut||"—"}</span>
                      : <span className={`ap-badge ${fe.statut?.toLowerCase().includes("traité")?"ap-badge-green":"ap-badge-orange"}`}>{fe.statut||"—"}</span>}
                  </td>

                  <td className="ap-td" style={{ fontWeight:600 }}>
                    {isApp ? (fe.quantite||"—") : (fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—")}
                  </td>

                  {/* ── Délai sécurisation — jours ouvrés ── */}
                  <td className="ap-td">
                    <DelaiSecuBadge
                      fe={fe}
                      site={(fe.site || getSiteFromJWT() || "soucy").toLowerCase()}
                      onCalculate={() => {}}
                    />
                  </td>

                  {isApp && <td className="ap-td"><span className={`ap-badge ${GRAVITE_BADGE[fe.gravite]||"ap-badge-gray"}`}>{fe.gravite||"—"}</span></td>}
                  {isApp && <td className="ap-td" style={{ fontSize:12, color:T.textSecond }}>{fe.declarant_nom||"—"}</td>}

                  <td className="ap-td">
                    {isApp
                      ? <span style={{ fontSize:12, color:T.textLight }}>—</span>
                      : <Badge8D fe={feEnrichi} />}
                  </td>

                  <td className="ap-td">
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {!isApp && (
                        <button className="ap-btn ap-btn-primary" style={{ padding:"4px 10px", fontSize:11 }}
                          onClick={() => open8D(feEnrichi)}>
                          8D
                        </button>
                      )}
                      {isConteste ? (
                        <button style={{ padding:"4px 10px", fontSize:10, borderRadius:6,
                          border:"1.5px solid #30d158", background:"#e8fdf0", color:"#1a7a3f",
                          cursor:"pointer", fontFamily:T.font, fontWeight:600 }}
                          title={`Motif : ${contestInfo?.motif}`}
                          onClick={() => handleRecontester(fe)}>
                          ↩ Rétablir
                        </button>
                      ) : (
                        <button style={{ padding:"4px 10px", fontSize:10, borderRadius:6,
                          border:"1.5px solid #ff3b30", background:"#fff0ef", color:"#ff3b30",
                          cursor:"pointer", fontFamily:T.font, fontWeight:600 }}
                          onClick={() => setContestModal(fe)}>
                          ⚠ Contester
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr><td className="ap-td" colSpan={11} style={{ textAlign:"center", padding:40, color:T.textLight }}>
                Aucune FE {isApp ? "dans l'app" : "SILOG"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isApp && <Pagination page={gp.page} totalPages={gp.totalPages} setPage={gp.setPage} />}

      {contestModal && (
        <ContestModal fe={contestModal}
          onClose={() => setContestModal(null)}
          onSave={(motif) => handleContester(contestModal, motif)} />
      )}

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        site={getSiteFromJWT()}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={handleSave8D}
      />
    </div>
  );
}