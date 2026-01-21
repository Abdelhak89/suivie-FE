import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:3001";

export default function ListPage() {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [fournisseur, setFournisseur] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      q,
      statut,
      fournisseur,
      page: String(page),
      pageSize: String(pageSize),
    });

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [q, statut, fournisseur, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h2 style={{ margin: 0 }}>Liste</h2>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="Recherche (FE / article / lancement / désignation)"
          style={{ padding: 8, minWidth: 320 }}
        />
        <input
          value={statut}
          onChange={(e) => { setPage(1); setStatut(e.target.value); }}
          placeholder="Statut"
          style={{ padding: 8 }}
        />
        <input
          value={fournisseur}
          onChange={(e) => { setPage(1); setFournisseur(e.target.value); }}
          placeholder="Fournisseur"
          style={{ padding: 8 }}
        />
      </div>

      <div style={{ marginTop: 12, color: "#666" }}>
        {loading ? "Chargement..." : `${total} enregistrements`}
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>FE</th>
              <th>Statut</th>
              <th>Article</th>
              <th>Désignation</th>
              <th>Lancement</th>
              <th>Fournisseur</th>
              <th>Semaine</th>
              <th>Année</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td><Link to={`/fe/${x.id}`}>{x.numero_fe || "(vide)"}</Link></td>
                <td>{x.statut || ""}</td>
                <td>{x.code_article || ""}</td>
                <td>{x.designation || ""}</td>
                <td>{x.code_lancement || ""}</td>
                <td>{x.nom_fournisseur || ""}</td>
                <td>{x.semaine || ""}</td>
                <td>{x.annee || ""}</td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan="8" style={{ textAlign: "center", color: "#666" }}>Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Précédent
        </button>
        <span>Page {page} / {pages}</span>
        <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
          Suivant
        </button>
      </div>
    </div>
  );
}
