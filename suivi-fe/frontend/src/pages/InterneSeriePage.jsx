// src/pages/InterneSeriePage.jsx — Style Apple — N°FE + Qté NC + clic → 8D
import { useEffect, useMemo, useState } from "react";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage } from "../hooks/useGridPage.js";
import { PAGES } from "../config/fePages.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

export default function InterneSeriePage() {
  const config = PAGES["interne-serie"];
  const gp     = useGridPage({ origine: "CINT", config });

  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });

  useEffect(() => { injectGlobalCSS(); }, []);

  const open8D = (fe) => setModal8D({ open: true, fe, value: fe.analyse_8d || "" });
  const save8D = (v)  => { console.log("Save 8D", gp.editCtx?.rowId || modal8D.fe?.numero_fe, v); setModal8D({ open: false, fe: null, value: "" }); };

  const badge8D = (fe) => {
    const raw = fe.analyse_8d;
    if (!raw) return <span className="ap-badge ap-badge-gray">À démarrer</span>;
    try {
      const p = JSON.parse(raw);
      const d = p?.responsable_qualite ? 8 : p?.resultat_verif ? 7 : p?.actions?.length ? 6 : p?.why_apparition?.some(Boolean) ? 5 : p?.ilot ? 4 : p?.actions_immediates?.length ? 3 : 1;
      const cls = d >= 8 ? "ap-badge-green" : d >= 5 ? "ap-badge-orange" : "ap-badge-blue";
      return <span className={`ap-badge ${cls}`}>D{d}/D8</span>;
    } catch { return <span className="ap-badge ap-badge-gray">Saisie</span>; }
  };

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Interne Série</div>
          <div className="ap-sub">{gp.loading ? "Chargement…" : `${gp.items.length} FE`}</div>
        </div>
      </div>

      <GridToolbar q={gp.q} setQ={gp.setQ} statut={gp.statut} setStatut={gp.setStatut} annee={gp.annee} setAnnee={gp.setAnnee} onlyMissing={gp.onlyMissing} setOnlyMissing={gp.setOnlyMissing} onPageReset={() => gp.setPage(1)} />

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th className="ap-th">N° FE</th>
              <th className="ap-th">Statut</th>
              <th className="ap-th">Qté NC</th>
              
              <th className="ap-th">Avancement 8D</th>
              <th className="ap-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {gp.pagedRows.map((fe, idx) => (
              <tr key={fe.numero_fe || idx} className="ap-tr-hover">
                <td className="ap-td">
                  <button onClick={() => open8D(fe)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "#0071e3", fontSize: 13, padding: 0, fontFamily: "inherit" }}>
                        {fe.numero_fe || "—"}
                      </button>
                      <div style={{ fontSize: 12, color: "#000000", marginTop: 2 }}>
                        {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : ""}
                      </div>
                </td>
                <td className="ap-td">
                  <span className={`ap-badge ${fe.statut?.toLowerCase().includes("traité") ? "ap-badge-green" : "ap-badge-orange"}`}>{fe.statut || "—"}</span>
                </td>
                <td className="ap-td" style={{ fontWeight: 600 }}>
                  {fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—"}
                </td>
                
                <td className="ap-td">{badge8D(fe)}</td>
                <td className="ap-td">
                  <button className="ap-btn ap-btn-primary" style={{ padding: "4px 12px", fontSize: 11 }} onClick={() => open8D(fe)}>
                    Analyse 8D
                  </button>
                </td>
              </tr>
            ))}
            {!gp.pagedRows.length && !gp.loading && (
              <tr><td className="ap-td" colSpan={6} style={{ textAlign: "center", padding: 40, color: T.textLight }}>Aucune FE</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={gp.page} totalPages={gp.totalPages} setPage={gp.setPage} />

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={save8D}
      />
    </div>
  );
}