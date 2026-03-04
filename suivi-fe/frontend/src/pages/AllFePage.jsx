// src/pages/AllFePage.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import FeDrawer from "../components/FeDrawer.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import "../styles/app.css";

export default function AllFePage() {
  const [sp]    = useSearchParams();
  const annee   = sp.get("annee") ?? "2026";

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ annee: annee || null, limit: 200 })
      .then((r) => { if (!ctrl.signal.aborted) { setItems(r.items || []); setTotal(r.total || 0); } })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [annee]);

  const openDetail = async (numeroFE) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: numeroFE, statut: "", data: {} });
    try { setSelectedRecord(await getFEByNumero(numeroFE)); }
    catch (err) { setSelectedRecord({ numero_fe: numeroFE, statut: "", data: { Erreur: String(err) } }); }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Toutes les FE</h2>
          <div className="sub">Année : <b>{annee || "toutes"}</b></div>
        </div>
        <span className="badge badgeBlue">{loading ? "Chargement…" : `${total} FE`}</span>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="tableWrap" style={{ border: "none", borderRadius: "var(--r-xl)" }}>
          {loading ? (
            <div style={{ padding: 20 }} className="sub">Chargement…</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th className="th">N° FE</th>
                  <th className="th">Statut</th>
                  <th className="th">REF</th>
                  <th className="th">Désignation</th>
                  <th className="th">Lancement</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.numero_fe} className="rowHover" onMouseDown={() => openDetail(r.numero_fe)}>
                    <td className="td"><b>{r.numero_fe || "—"}</b></td>
                    <td className="td"><StatusBadge value={r.statut} /></td>
                    <td className="td mono">{r.code_article || "—"}</td>
                    <td className="td truncate" style={{ maxWidth: 280 }}>{r.designation || "—"}</td>
                    <td className="td mono">{r.code_lancement || "—"}</td>
                    <td className="td">{r.date_creation ? new Date(r.date_creation).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td className="td" colSpan={6} style={{ textAlign: "center", color: "var(--inkFaint)", padding: 32 }}>Aucune FE trouvée</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </div>
  );
}
