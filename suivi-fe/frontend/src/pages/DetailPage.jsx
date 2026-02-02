import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetch(`${API}/fe/${id}`)
      .then((r) => r.json())
      .then(setItem);
  }, [id]);

  const entries = useMemo(() => {
    const data = item?.data || {};
    return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  }, [item]);

  if (!item) return <div className="page"><div className="card">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h2 className="pageTitle">FE {item.numero_fe || "(vide)"}</h2>
          <div className="pageSubtitle">
            Statut : <b>{item.statut || "—"}</b>
          </div>
        </div>

        <Link className="btn" to="/accueil" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          ← Retour
        </Link>
      </div>

      <div className="card">
        <div className="cardTitle">Toutes les colonnes (DATA)</div>

        <div className="tableWrap">
          <table className="table">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="trHover">
                  <td className="td" style={{ width: 360, fontWeight: 900 }}>{k}</td>
                  <td className="td">{String(v ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
