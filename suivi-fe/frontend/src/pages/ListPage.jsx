// src/pages/ListPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllFE } from "../services/feApi.js";
import StatusBadge from "../components/StatusBadge.jsx";
import "../styles/app.css";

export default function ListPage() {
  const [q,      setQ]      = useState("");
  const [statut, setStatut] = useState("En cours");
  const [origine,setOrigine]= useState("");
  const [annee,  setAnnee]  = useState("2026");
  const [page,   setPage]   = useState(1);
  const pageSize = 50;

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ q: q.trim() || null, statut: statut || null, origine: origine || null, annee: annee || null, limit: pageSize, offset: (page - 1) * pageSize })
      .then((r) => { if (!ctrl.signal.aborted) { setItems(r.items || []); setTotal(r.total || 0); } })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [q, statut, origine, annee, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const reset = () => { setQ(""); setStatut("En cours"); setOrigine(""); setAnnee("2026"); setPage(1); };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Liste des Fiches Événements</h2>
          <div className="sub">{loading ? "Chargement…" : `${total} FE trouvées`}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="toolbar">
        <select className="select" value={annee} onChange={(e) => { setPage(1); setAnnee(e.target.value); }}>
          <option value="">Toutes les années</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>

        <select className="select" value={statut} onChange={(e) => { setPage(1); setStatut(e.target.value); }}>
          <option value="">Tous les statuts</option>
          <option value="En cours">En cours</option>
          <option value="Traitée">Traitée</option>
        </select>

        <select className="select" value={origine} onChange={(e) => { setPage(1); setOrigine(e.target.value); }}>
          <option value="">Toutes origines</option>
          <option value="CINT">Interne</option>
          <option value="RCLI">Client</option>
          <option value="DFOU">Fournisseur</option>
        </select>

        <input
          className="input"
          style={{ flex: 1 }}
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="Recherche (N° FE / REF / Désignation / Lancement…)"
        />

        <button className="btn btnDark" onClick={reset}>Réinitialiser</button>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0 }}>
        <div className="tableWrap" style={{ border: "none", borderRadius: "var(--r-xl)" }}>
          <table className="table">
            <thead>
              <tr>
                <th className="th">N° FE</th>
                <th className="th">Statut</th>
                <th className="th">Date</th>
                <th className="th">Origine</th>
                <th className="th">Type NC</th>
                <th className="th">Code Article</th>
                <th className="th">Désignation</th>
                <th className="th">Lancement</th>
                <th className="th" style={{ textAlign: "right" }}>Qté NC</th>
              </tr>
            </thead>
            <tbody>
              {items.map((fe, idx) => (
                <tr key={fe.numero_fe || idx} className="rowHover">
                  <td className="td">
                    <Link to={`/fe/${fe.numero_fe}`} style={{ fontWeight: 700, color: "var(--primaryMid)" }}>
                      {fe.numero_fe || "(vide)"}
                    </Link>
                  </td>
                  <td className="td"><StatusBadge value={fe.statut} /></td>
                  <td className="td">{fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="td">{fe.origine || "—"}</td>
                  <td className="td">{fe.type_nc || "—"}</td>
                  <td className="td mono">{fe.code_article || "—"}</td>
                  <td className="td truncate" style={{ maxWidth: 260 }} title={fe.designation}>{fe.designation || "—"}</td>
                  <td className="td mono">{fe.code_lancement || "—"}</td>
                  <td className="td" style={{ textAlign: "right", fontWeight: 600 }}>
                    {fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
              {!items.length && !loading && (
                <tr><td className="td" colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--inkFaint)" }}>Aucun résultat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← Précédent</button>
        <span>Page {page} / {pages} ({total} résultats)</span>
        <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Suivant →</button>
      </div>

      {statut === "En cours" && (
        <div className="panel" style={{ marginTop: 12, background: "var(--amberBg)", borderColor: "#fbbf24", textAlign: "center" }}>
          <span style={{ color: "var(--amber)", fontWeight: 700, fontSize: 13 }}>⚠️ Filtré sur FE EN COURS uniquement</span>
        </div>
      )}
    </div>
  );
}
