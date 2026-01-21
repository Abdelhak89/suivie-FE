import "../styles/drawer.css";
import StatusBadge from "./StatusBadge.jsx";

export default function FeDrawer({ open, onClose, record }) {
  if (!open) return null;

  // sécurité : jamais null
  const safe = record || {
    numero_fe: "",
    statut: "",
    data: {},
  };

  const dataEntries = Object.entries(safe.data || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="drawerHeader">
          <div>
            <div className="drawerTitle">Détail FE</div>

            {/* ✅ FE + BADGE STATUT */}
            <div
              className="drawerSub"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <b>{safe.numero_fe || "—"}</b>
              <StatusBadge value={safe.statut} />
            </div>
          </div>

          <button className="drawerClose" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="drawerBody">
          {/* CHAMPS INDEXÉS */}
          <div className="drawerSection">
            <div className="drawerSectionTitle">Champs indexés</div>

            <div className="kv">
              <div className="kvRow">
                <div className="kvKey">REF</div>
                <div className="kvVal">{safe.code_article || "—"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Désignation</div>
                <div className="kvVal">{safe.designation || "—"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Lancement</div>
                <div className="kvVal">{safe.code_lancement || "—"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Fournisseur</div>
                <div className="kvVal">{safe.nom_fournisseur || "—"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Semaine</div>
                <div className="kvVal">{safe.semaine || "—"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Année</div>
                <div className="kvVal">{safe.annee || "—"}</div>
              </div>
            </div>
          </div>

          {/* DONNÉES EXCEL */}
          <div className="drawerSection">
            <div className="drawerSectionTitle">
              Toutes les colonnes (Excel DATA)
            </div>

            <div className="dataList">
              {dataEntries.map(([k, v]) => (
                <div key={k} className="dataRow">
                  <div className="dataKey">{k}</div>
                  <div className="dataVal">{String(v ?? "—")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="drawerFooter">
          <button className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
