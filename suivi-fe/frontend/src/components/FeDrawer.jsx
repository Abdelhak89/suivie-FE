// src/components/FeDrawer.jsx
import "../styles/drawer.css";
import StatusBadge from "./StatusBadge.jsx";

export default function FeDrawer({ open, onClose, record }) {
  if (!open) return null;

  const safe = record || { numero_fe: "", statut: "", data: {} };
  const dataEntries = Object.entries(safe.data || {}).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="drawerOverlay" onMouseDown={onClose}>
      <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>

        <div className="drawerHeader">
          <div>
            <div className="drawerTitle">Détail FE</div>
            <div className="drawerSubRow">
              <b>{safe.numero_fe || "—"}</b>
              <StatusBadge value={safe.statut} />
            </div>
          </div>
          <button className="drawerClose" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="drawerBody">
          <div className="drawerSection">
            <div className="drawerSectionTitle">Champs indexés</div>
            <div className="kv">
              {[
                ["REF",         safe.code_article],
                ["Désignation", safe.designation],
                ["Lancement",   safe.code_lancement],
                ["Fournisseur", safe.nom_fournisseur],
                ["Semaine",     safe.semaine],
                ["Année",       safe.annee],
              ].map(([k, v]) => (
                <div key={k} className="kvRow">
                  <div className="kvKey">{k}</div>
                  <div className="kvVal">{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="drawerSection">
            <div className="drawerSectionTitle">Toutes les colonnes (DATA)</div>
            <div className="dataList">
              {dataEntries.map(([k, v]) => (
                <div key={k} className="dataRow">
                  <div className="dataKey">{k}</div>
                  <div className="dataVal">{String(v ?? "—")}</div>
                </div>
              ))}
              {!dataEntries.length && (
                <div className="dataRow">
                  <div className="dataVal" style={{ gridColumn: "1/-1", color: "var(--inkFaint)" }}>Aucune donnée</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="drawerFooter">
          <button className="btn btnDark" onClick={onClose}>Fermer</button>
        </div>

      </div>
    </div>
  );
}
