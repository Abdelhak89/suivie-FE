import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = "http://localhost:3001";

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

  if (!item) return <div>Chargement...</div>;

  return (
    <div>
      <Link to="/">← Retour</Link>
      <h2 style={{ marginTop: 12, marginBottom: 6 }}>
        FE {item.numero_fe || "(vide)"}
      </h2>
      <div style={{ color: "#666", marginBottom: 12 }}>
        Statut: <b>{item.statut || ""}</b>
      </div>

      <h3 style={{ margin: "12px 0" }}>Toutes les colonnes (DATA)</h3>

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td style={{ width: 320, fontWeight: 600 }}>{k}</td>
                <td>{String(v ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
