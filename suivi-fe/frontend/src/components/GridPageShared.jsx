// src/components/GridPageShared.jsx
// Toolbar, Pagination — réutilisés dans InterneSerie / Fournisseur / Client / InterneFAI
import "../styles/app.css";

export function GridToolbar({ q, setQ, statut, setStatut, annee, setAnnee, onlyMissing, setOnlyMissing, onPageReset }) {
  return (
    <div className="toolbar">
      <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={onlyMissing}
          onChange={(e) => { setOnlyMissing(e.target.checked); onPageReset?.(); }}
        />
        FE incomplètes
      </label>

      <select className="select" value={statut} onChange={(e) => { setStatut(e.target.value); onPageReset?.(); }}>
        <option value="En cours">En cours</option>
        <option value="Traitée">Traitée</option>
        <option value="Tous">Tous les statuts</option>
      </select>

      <select className="select" value={annee} onChange={(e) => { setAnnee(e.target.value); onPageReset?.(); }}>
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="">Toutes les années</option>
      </select>

      <input
        className="input"
        style={{ flex: 1, minWidth: 220 }}
        value={q}
        onChange={(e) => { setQ(e.target.value); onPageReset?.(); }}
        placeholder="Rechercher (N°, REF, désignation…)"
      />
    </div>
  );
}

export function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="pagination">
      <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
      <span>Page {page} / {totalPages}</span>
      <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
    </div>
  );
}
