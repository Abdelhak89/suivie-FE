// src/pages/DetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFEByNumero } from "../services/feApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import "../styles/app.css";

export default function DetailPage() {
  const { id }    = useParams();
  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFEByNumero(id)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const entries = useMemo(() => Object.entries(item?.data || {}).sort((a, b) => a[0].localeCompare(b[0])), [item]);

  if (loading) return <div className="container"><div className="sub" style={{ marginTop: 40 }}>Chargement…</div></div>;

  if (!item) return (
    <div className="container">
      <div className="panel">
        <div style={{ color: "var(--red)", fontWeight: 700, marginBottom: 12 }}>Fiche Événement introuvable</div>
        <Link className="btn" to="/">← Retour</Link>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">FE {item.numero_fe || "(vide)"}</h2>
          <div className="sub">Statut : <StatusBadge value={item.statut} /></div>
        </div>
        <Link className="btn" to="/">← Retour</Link>
      </div>

      {/* Infos principales */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panelTitle">Informations principales</div>
        <div className="kv">
          {[
            ["N° FE",          item.numero_fe],
            ["Code Article",   item.code_article],
            ["Désignation",    item.designation],
            ["Code Lancement", item.code_lancement],
            ["Date création",  item.date_creation ? new Date(item.date_creation).toLocaleDateString("fr-FR") : null],
            ["Origine",        item.origine],
            ["Type NC",        item.type_nc],
            ["Qté NC",         item.qte_non_conforme],
          ].map(([k, v]) => (
            <div key={k} className="kvRow">
              <div className="kvKey">{k}</div>
              <div className="kvVal">{v || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data complète */}
      <div className="panel">
        <div className="panelTitle">Toutes les colonnes (DATA)</div>
        <div className="tableWrap" style={{ marginTop: 8 }}>
          <table className="table">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="rowHover">
                  <td className="td" style={{ width: 320, fontWeight: 700, color: "var(--inkMid)" }}>{k}</td>
                  <td className="td mono">{String(v ?? "—")}</td>
                </tr>
              ))}
              {!entries.length && (
                <tr><td className="td" colSpan={2} style={{ color: "var(--inkFaint)", textAlign: "center" }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
