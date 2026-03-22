// pages/HistoriqueFEPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
import FEBadge from "../components/FEBadge";
import FEHistoriqueModal from "../components/FEHistoriqueModal";
import "../styles/HistoriqueFEPage.css";

const SITES = ["soucy", "sens", "laxou", "kmtm"];

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString("fr-FR");
}

export default function HistoriqueFEPage() {
  const [site, setSite]       = useState("soucy");
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(null);

  // ── Filtres ──────────────────────────────────────────────
  const [search,      setSearch]      = useState("");
  const [filtreClient, setFiltreClient] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous"); // tous | en_cours | traitees
  const [sortKey,     setSortKey]     = useState("total");
  const [sortDir,     setSortDir]     = useState("desc");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res  = await fetch(`${API_BASE}/api/fe/par-article?site=${site}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      setRows(json.data);
      // reset filtre client si changement de site
      setFiltreClient("tous");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Liste clients distincts (triés)
  const clients = useMemo(() => {
    const set = new Set(rows.map(r => r.client).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  // Sort handler
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };
  const arrow = (key) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  // Données filtrées + triées
  const filtered = useMemo(() => {
    return rows
      .filter(r => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          r.code_article?.toLowerCase().includes(q) ||
          r.designation_article?.toLowerCase().includes(q) ||
          r.client?.toLowerCase().includes(q);
        const matchClient  = filtreClient === "tous" || r.client === filtreClient;
        const matchStatut  =
          filtreStatut === "tous"      ? true :
          filtreStatut === "en_cours"  ? r.en_cours > 0 :
          filtreStatut === "traitees"  ? r.en_cours === 0 && r.traitees > 0 :
          true;
        return matchSearch && matchClient && matchStatut;
      })
      .sort((a, b) => {
        let va = a[sortKey] ?? 0;
        let vb = b[sortKey] ?? 0;
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ?  1 : -1;
        return 0;
      });
  }, [rows, search, filtreClient, filtreStatut, sortKey, sortDir]);

  const totalFE    = filtered.reduce((s, r) => s + (r.total    || 0), 0);
  const totalAlert = filtered.reduce((s, r) => s + (r.en_cours || 0), 0);

  return (
    <div className="hfe-page">

      {/* ── Header ── */}
      <div className="hfe-header">
        <div className="hfe-title">
          <span className="hfe-icon">🗂️</span>
          Historique FE par article
        </div>

        {/* Sites */}
        <div className="hfe-sites">
          {SITES.map(s => (
            <button
              key={s}
              className={`hfe-site-btn ${site === s ? "active" : ""}`}
              onClick={() => setSite(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Barre de filtres ── */}
      <div className="hfe-filters">
        {/* Recherche texte */}
        <input
          className="hfe-search"
          type="text"
          placeholder="Article, désignation, client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Filtre client */}
        <select
          className="hfe-select"
          value={filtreClient}
          onChange={e => setFiltreClient(e.target.value)}
        >
          <option value="tous">Tous les clients</option>
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Filtre statut */}
        <div className="hfe-statut-btns">
          {[
            { key: "tous",     label: "Tous" },
            { key: "en_cours", label: "⚠ En cours" },
            { key: "traitees", label: "✓ Traitées" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`hfe-statut-btn ${filtreStatut === key ? "active" : ""} ${key === "en_cours" ? "alert" : ""}`}
              onClick={() => setFiltreStatut(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reset filtres */}
        {(search || filtreClient !== "tous" || filtreStatut !== "tous") && (
          <button
            className="hfe-reset-btn"
            onClick={() => { setSearch(""); setFiltreClient("tous"); setFiltreStatut("tous"); }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* ── Summary ── */}
      {!loading && !error && (
        <div className="hfe-summary">
          <span>{filtered.length} articles</span>
          <span>·</span>
          <span>{totalFE} FE total</span>
          <span>·</span>
          <span className="hfe-summary--alert">{totalAlert} en cours</span>
          {filtreClient !== "tous" && <span>· Client : <b>{filtreClient}</b></span>}
        </div>
      )}

      {/* ── Table ── */}
      <div className="hfe-table-wrap">
        {loading && <div className="hfe-state">Chargement…</div>}
        {error   && <div className="hfe-state hfe-state--error">Erreur : {error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="hfe-state">Aucun résultat.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className="hfe-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("client")} className="sortable">
                  Client{arrow("client")}
                </th>
                <th onClick={() => handleSort("code_article")} className="sortable">
                  Code article{arrow("code_article")}
                </th>
                <th>Désignation</th>
                <th onClick={() => handleSort("total")} className="sortable center">
                  Total{arrow("total")}
                </th>
                <th onClick={() => handleSort("en_cours")} className="sortable center">
                  En cours{arrow("en_cours")}
                </th>
                <th onClick={() => handleSort("traitees")} className="sortable center">
                  Traitées{arrow("traitees")}
                </th>
                <th onClick={() => handleSort("date_derniere")} className="sortable center">
                  Dernière FE{arrow("date_derniere")}
                </th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr
                  key={row.code_article}
                  className={row.en_cours > 0 ? "row--alert" : ""}
                >
                  {/* Client badge */}
                  <td className="td-client">
                    <span
                      className="client-badge"
                      style={{ cursor: "pointer" }}
                      onClick={() => setFiltreClient(row.client === filtreClient ? "tous" : row.client)}
                      title="Filtrer ce client"
                    >
                      {row.client || "—"}
                    </span>
                  </td>

                  <td className="code-article">{row.code_article}</td>
                  <td className="designation">{row.designation_article || "—"}</td>

                  <td className="center">
                    <FEBadge
                      codeArticle={row.code_article}
                      count={row.total}
                      enCours={row.en_cours}
                      site={site}
                      designation={row.designation_article}
                    />
                  </td>

                  <td className="center">
                    {row.en_cours > 0
                      ? <span className="count--alert">{row.en_cours}</span>
                      : <span className="count--ok">0</span>}
                  </td>

                  <td className="center">
                    <span className="count--ok">{row.traitees}</span>
                  </td>

                  <td className="center">{fmt(row.date_derniere)}</td>

                  <td className="center">
                    <button
                      className="hfe-btn-voir"
                      onClick={() => setModal({ codeArticle: row.code_article, designation: row.designation_article })}
                    >
                      Voir FE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modale ── */}
      {modal && (
        <FEHistoriqueModal
          codeArticle={modal.codeArticle}
          designation={modal.designation}
          site={site}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}