// src/pages/ClientPage.jsx
import { useEffect, useState } from "react";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import Badge8D        from "../components/Badge8D.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage }    from "../hooks/useGridPage.js";
import { useAppFE }       from "../hooks/useAppFE.js";
import { useAnalyses8D }  from "../hooks/useAnalyses8D.js";
import SourceToggle       from "../components/SourceToggle.jsx";
import { PAGES }          from "../config/fePages.js";
import { getSiteFromJWT } from "../utils/auth.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const GRAVITE_BADGE = { mineur:"ap-badge-green", majeur:"ap-badge-orange", critique:"ap-badge-red" };
const STATUT_BADGE  = { ouvert:"ap-badge-blue", en_cours:"ap-badge-orange", clos:"ap-badge-green" };

function getSecurisationStatus(dateCreation) {
  if (!dateCreation) return null;
  const limit = new Date(new Date(dateCreation).getTime() + 48 * 3600 * 1000);
  const diffH = Math.floor((limit - new Date()) / 3600000);
  if (diffH < 0)  return { text:`⚠️ RETARD (${Math.abs(diffH)}h)`, cls:"ap-badge-red" };
  if (diffH < 12) return { text:`⏳ ${diffH}h rest.`,              cls:"ap-badge-orange" };
  return { text:`${diffH}h rest.`, cls:"ap-badge-green" };
}

export default function ClientPage() {
  const config = PAGES["client"];
  const gp     = useGridPage({ origine: "RCLI", config });

  const [source,  setSource]  = useState("diapason");
  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });

  const { map: analyses8D, update: updateAnalyses8D } = useAnalyses8D();

  const appFE = useAppFE("client", {
    q:      source === "app" ? gp.q      : "",
    statut: source === "app" ? gp.statut : "Tous",
    annee:  source === "app" ? gp.annee  : null,
  });

  useEffect(() => { injectGlobalCSS(); }, []);

  const open8D = (fe) => setModal8D({ open: true, fe, value: analyses8D[fe.numero_fe] || fe.analyse_8d || "" });

  const handleSave8D = (v) => {
    if (modal8D.fe?.numero_fe) updateAnalyses8D(modal8D.fe.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  const isApp   = source === "app";
  const rows    = isApp ? appFE.items : gp.pagedRows;
  const loading = isApp ? appFE.loading : gp.loading;

  return (
    <div style={{ fontFamily:T.font, padding:24, background:T.bg, minHeight:"100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Suivi Clients</div>
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
              <th className="ap-th">Statut</th>
              <th className="ap-th">Qté NC</th>
              {!isApp && <th className="ap-th">Sécurisation</th>}
              {isApp  && <th className="ap-th">Gravité</th>}
              {isApp  && <th className="ap-th">Déclarant</th>}
              <th className="ap-th">Avancement 8D</th>
              <th className="ap-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fe, idx) => {
              const sec       = !isApp ? getSecurisationStatus(fe.date_creation) : null;
              const feEnrichi = isApp  ? fe : { ...fe, analyse_8d: analyses8D[fe.numero_fe] || fe.analyse_8d };
              return (
                <tr key={fe.numero_fe || fe.id || idx} className="ap-tr-hover">
                  <td className="ap-td">
                    <button onClick={() => open8D(feEnrichi)} style={{ background:"none", border:"none", cursor:"pointer", fontWeight:700, color:"#0071e3", fontSize:13, padding:0, fontFamily:"inherit" }}>
                      {fe.numero_fe || "—"}
                    </button>
                    <div style={{ fontSize:12, color:T.textSecond, marginTop:2 }}>
                      {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </td>
                  <td className="ap-td">
                    {isApp
                      ? <span className={`ap-badge ${STATUT_BADGE[fe.statut] || "ap-badge-gray"}`}>{fe.statut || "—"}</span>
                      : <span className={`ap-badge ${fe.statut?.toLowerCase().includes("traité") ? "ap-badge-green" : "ap-badge-orange"}`}>{fe.statut || "—"}</span>}
                  </td>
                  <td className="ap-td" style={{ fontWeight:600 }}>
                    {isApp ? (fe.quantite || "—") : (fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—")}
                  </td>
                  {!isApp && (
                    <td className="ap-td">
                      {sec ? <span className={`ap-badge ${sec.cls}`}>{sec.text}</span> : <span style={{ color:T.textLight }}>—</span>}
                    </td>
                  )}
                  {isApp && <td className="ap-td"><span className={`ap-badge ${GRAVITE_BADGE[fe.gravite] || "ap-badge-gray"}`}>{fe.gravite || "—"}</span></td>}
                  {isApp && <td className="ap-td" style={{ fontSize:12, color:T.textSecond }}>{fe.declarant_nom || "—"}</td>}
                  <td className="ap-td">
                    {isApp ? <span style={{ fontSize:12, color:T.textLight }}>—</span> : <Badge8D fe={feEnrichi} />}
                  </td>
                  <td className="ap-td">
                    {!isApp && (
                      <button className="ap-btn ap-btn-primary" style={{ padding:"4px 12px", fontSize:11 }} onClick={() => open8D(feEnrichi)}>
                        Analyse 8D
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr><td className="ap-td" colSpan={8} style={{ textAlign:"center", padding:40, color:T.textLight }}>
                Aucune FE {isApp ? "dans l'app" : "SILOG"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isApp && <Pagination page={gp.page} totalPages={gp.totalPages} setPage={gp.setPage} />}

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        site={getSiteFromJWT()}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={handleSave8D}
      />
    </div>
  );
}