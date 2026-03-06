// src/pages/ListPage.jsx — Style Apple — colonnes épurées — clic N°FE → 8D
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllFE } from "../services/feApi.js";
import Analyse6MModal from "../components/Analyse6MModal.jsx";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

export default function ListPage() {
  const navigate = useNavigate();
  const [q,       setQ]       = useState("");
  const [statut,  setStatut]  = useState("En cours");
  const [origine, setOrigine] = useState("");
  const [annee,   setAnnee]   = useState("2026");
  const [page,    setPage]    = useState(1);
  const pageSize = 50;

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const [modal8D, setModal8D]   = useState({ open: false, fe: null, value: "" });

  useEffect(() => { injectGlobalCSS(); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getAllFE({ q: q.trim()||null, statut: statut||null, origine: origine||null, annee: annee||null, limit: pageSize, offset: (page-1)*pageSize })
      .then(r => { if (!ctrl.signal.aborted) { setItems(r.items||[]); setTotal(r.total||0); } })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [q, statut, origine, annee, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const reset = () => { setQ(""); setStatut("En cours"); setOrigine(""); setAnnee("2026"); setPage(1); };

  const open8D = (fe) => setModal8D({ open: true, fe, value: fe.analyse_8d || "" });
  const save8D = (v) => {
    console.log("Save 8D →", modal8D.fe?.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  const statutBadge = (s) => {
    if (!s) return "ap-badge-gray";
    if (s.toLowerCase().includes("traité") || s.toLowerCase().includes("clôt")) return "ap-badge-green";
    if (s.toLowerCase().includes("cours")) return "ap-badge-orange";
    return "ap-badge-gray";
  };

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>
      <div className="ap-page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
            <div className="ap-h1">Fiches Événements</div>
            <button
              className="ap-btn ap-btn-primary"
              onClick={() => navigate("/declaration-fe")}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >＋ Nouvelle FE</button>
          </div>
          <div className="ap-sub">{loading ? "Chargement…" : `${total} FE trouvées`}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="ap-toolbar">
        <select className="ap-select" style={{ minWidth: 90 }} value={annee} onChange={e => { setPage(1); setAnnee(e.target.value); }}>
          <option value="">Toutes</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
        <select className="ap-select" style={{ minWidth: 120 }} value={statut} onChange={e => { setPage(1); setStatut(e.target.value); }}>
          <option value="">Tous statuts</option>
          <option value="En cours">En cours</option>
          <option value="Traitée">Traitée</option>
        </select>
        <select className="ap-select" style={{ minWidth: 130 }} value={origine} onChange={e => { setPage(1); setOrigine(e.target.value); }}>
          <option value="">Toutes origines</option>
          <option value="CINT">Interne</option>
          <option value="RCLI">Client</option>
          <option value="DFOU">Fournisseur</option>
        </select>
        <input className="ap-input" style={{ flex: 1, minWidth: 200 }} value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="N° FE / REF / Désignation…" />
        <button className="ap-btn" onClick={reset}>Réinitialiser</button>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th className="ap-th">N° FE</th>
              <th className="ap-th">Statut</th>
              <th className="ap-th">Qté NC</th>
              <th className="ap-th">Date</th>
              <th className="ap-th">Origine</th>
              <th className="ap-th">8D</th>
            </tr>
          </thead>
          <tbody>
            {items.map((fe, idx) => (
              <tr key={fe.numero_fe || idx} className="ap-tr-hover">
                <td className="ap-td">
                  <button
                    onClick={() => open8D(fe)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: T.accent, fontSize: 13, padding: 0, fontFamily: T.font }}
                  >
                    {fe.numero_fe || "(vide)"}
                  </button>
                </td>
                <td className="ap-td">
                  <span className={`ap-badge ${statutBadge(fe.statut)}`}>{fe.statut || "—"}</span>
                </td>
                <td className="ap-td" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—"}
                </td>
                <td className="ap-td" style={{ color: T.textSecond, fontSize: 12 }}>
                  {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="ap-td">
                  <span className="ap-badge ap-badge-gray">{fe.origine || "—"}</span>
                </td>
                <td className="ap-td">
                  <button className="ap-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => open8D(fe)}>
                    Ouvrir 8D
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td className="ap-td" colSpan={6} style={{ textAlign: "center", padding: 40, color: T.textLight }}>
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="ap-pagination">
        <button className="ap-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>← Précédent</button>
        <span>Page {page} / {pages} <span style={{ color: T.textLight }}>({total} résultats)</span></span>
        <button className="ap-btn" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page >= pages}>Suivant →</button>
      </div>

      {/* Modal 8D */}
      <Analyse8DModal
        open={modal8D.open}
        fe={modal8D.fe}
        initialValue={modal8D.value}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={save8D}
      />
    </div>
  );
}