// src/pages/AllFePage.jsx — Style Apple — colonnes épurées — clic → 8D
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllFE } from "../services/feApi.js";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

export default function AllFePage() {
  const [sp]  = useSearchParams();
  const annee = sp.get("annee") ?? "2026";

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });

  useEffect(() => { injectGlobalCSS(); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ annee: annee||null, limit: 200 })
      .then(r => { if (!ctrl.signal.aborted) { setItems(r.items||[]); setTotal(r.total||0); } })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee]);

  const open8D = (fe) => setModal8D({ open: true, fe, value: fe.analyse_8d || "" });

  const statutBadge = s => {
    if (!s) return "ap-badge-gray";
    if (s.toLowerCase().includes("traité") || s.toLowerCase().includes("clôt")) return "ap-badge-green";
    if (s.toLowerCase().includes("cours")) return "ap-badge-orange";
    return "ap-badge-gray";
  };

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Toutes les FE</div>
          <div className="ap-sub">Année : <b>{annee || "toutes"}</b> — {loading ? "Chargement…" : `${total} FE`}</div>
        </div>
        <span className="ap-badge ap-badge-blue">{loading ? "…" : `${total} FE`}</span>
      </div>

      <div className="ap-table-wrap">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.textLight, fontFamily: T.font }}>Chargement…</div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th className="ap-th">N° FE</th>
                <th className="ap-th">Statut</th>
                <th className="ap-th">Qté NC</th>
                <th className="ap-th">Date</th>
                <th className="ap-th">8D</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.numero_fe} className="ap-tr-hover">
                  <td className="ap-td">
                    <button onClick={() => open8D(r)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: T.accent, fontSize: 13, padding: 0, fontFamily: T.font }}>
                      {r.numero_fe || "—"}
                    </button>
                  </td>
                  <td className="ap-td">
                    <span className={`ap-badge ${statutBadge(r.statut)}`}>{r.statut || "—"}</span>
                  </td>
                  <td className="ap-td" style={{ fontWeight: 600 }}>
                    {r.qte_non_conforme ? Number(r.qte_non_conforme).toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="ap-td" style={{ color: T.textSecond, fontSize: 12 }}>
                    {r.date_creation ? new Date(r.date_creation).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="ap-td">
                    <button className="ap-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => open8D(r)}>Ouvrir 8D</button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="ap-td" colSpan={5} style={{ textAlign: "center", color: T.textLight, padding: 40 }}>Aucune FE trouvée</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={v => { console.log("Save 8D →", modal8D.fe?.numero_fe, v); setModal8D({ open: false, fe: null, value: "" }); }}
      />
    </div>
  );
}