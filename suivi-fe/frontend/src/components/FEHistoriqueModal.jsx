// components/FEHistoriqueModal.jsx
import React, { useEffect, useState, useCallback } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
import "../styles/FEHistoriqueModal.css";

const STATUT_LABEL = { O: "Traitée", N: "En cours" };
const STATUT_CLASS  = { O: "statut--ok", N: "statut--alert" };

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString("fr-FR");
}

export default function FEHistoriqueModal({ codeArticle, designation, site = "soucy", onClose }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [expanded, setExpanded] = useState(null); // numero_fe expanded pour voir commentaire

  const fetchFE = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE}/api/fe?code_article=${encodeURIComponent(codeArticle)}&site=${site}&limit=200&offset=0`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      setItems(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [codeArticle, site]);

  useEffect(() => { fetchFE(); }, [fetchFE]);

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleExpand = (num) =>
    setExpanded((prev) => (prev === num ? null : num));

  return (
    <div className="fe-modal-overlay" onClick={onClose}>
      <div className="fe-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fe-modal-header">
          <div>
            <div className="fe-modal-title">Historique FE — {codeArticle}</div>
            {designation && <div className="fe-modal-sub">{designation}</div>}
          </div>
          <button className="fe-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="fe-modal-body">
          {loading && <div className="fe-modal-state">Chargement…</div>}
          {error   && <div className="fe-modal-state fe-modal-error">Erreur : {error}</div>}

          {!loading && !error && items.length === 0 && (
            <div className="fe-modal-state">Aucune FE trouvée pour cet article.</div>
          )}

          {!loading && !error && items.length > 0 && (
            <table className="fe-modal-table">
              <thead>
                <tr>
                  <th>N° FE</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Type NC</th>
                  <th>Qté NC</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {items.map((fe) => {
                  const isOpen = expanded === fe.numero_fe;
                  const hasComment = fe.detail_anomalie?.trim();
                  return (
                    <React.Fragment key={fe.numero_fe}>
                      <tr
                        className={hasComment ? "fe-row--expandable" : ""}
                        onClick={() => hasComment && toggleExpand(fe.numero_fe)}
                      >
                        <td className="fe-num">{fe.numero_fe}</td>
                        <td>{fmt(fe.date_creation)}</td>
                        <td>
                          <span className={`fe-statut ${STATUT_CLASS[fe.statut === "Traitée" ? "O" : "N"]}`}>
                            {fe.statut}
                          </span>
                        </td>
                        <td>{fe.type_nc || "—"}</td>
                        <td>{fe.qte_non_conforme ?? "—"}</td>
                        <td className="fe-comment-cell">
                          {hasComment
                            ? <span className="fe-comment-toggle">{isOpen ? "▲" : "▼"} Voir</span>
                            : <span className="fe-empty">—</span>}
                        </td>
                      </tr>
                      {isOpen && hasComment && (
                        <tr className="fe-row--detail">
                          <td colSpan={6}>
                            <div className="fe-detail-text">{fe.detail_anomalie}</div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && items.length > 0 && (
          <div className="fe-modal-footer">
            <span>{items.length} FE · {items.filter(f => f.statut === "En cours").length} en cours</span>
          </div>
        )}
      </div>
    </div>
  );
}