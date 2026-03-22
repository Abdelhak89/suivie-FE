// src/pages/FournisseurPage.jsx
import { useEffect, useState } from "react";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import Badge8D        from "../components/Badge8D.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage }    from "../hooks/useGridPage.js";
import { useAppFE }       from "../hooks/useAppFE.js";
import { useAnalyses8D }  from "../hooks/useAnalyses8D.js";
import SourceToggle       from "../components/SourceToggle.jsx";
import { PAGES }          from "../config/fePages.js";
import { getSiteFromJWT } from "../utils/auth.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const GRAVITE_BADGE = { mineur:"ap-badge-green", majeur:"ap-badge-orange", critique:"ap-badge-red" };
const STATUT_BADGE  = { ouvert:"ap-badge-blue", en_cours:"ap-badge-orange", clos:"ap-badge-green" };

function getClientCode(fe) { return (fe.code_article || "").slice(0, 3) || "—"; }
function getClientName(fe) { return fe.client_fourn || fe.client_programme || getClientCode(fe); }
function getNumCommande(fe) { return fe.no_commande || fe.numero_commande || fe.var_alpha_2 || ""; }

// ── Cellule N° Commande éditable (FE App uniquement) ─────────
function CommandeCell({ fe, onSaved }) {
  const [val,    setVal]    = useState(getNumCommande(fe) || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const current = getNumCommande(fe);
  // Toujours en mode édition si pas de valeur, sinon toggle
  const [editing, setEditing] = useState(!current);

  const feId   = fe?.id;
  const feSite = (fe?.site || "").toLowerCase();

  const handleSave = async () => {
    if (!feId || !feSite) {
      console.warn("CommandeCell: id ou site manquant", fe);
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("kep_token");
      const res = await fetch(`${API}/api/nc-fe/${feSite}/${feId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ no_commande: val }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved(feId, val);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch(e) { console.error("CommandeCell save error", e); }
    finally { setSaving(false); }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter")  handleSave();
    if (e.key === "Escape") { setVal(current || ""); setEditing(false); }
  };

  if (editing) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="N° commande..."
          style={{ width:130, padding:"5px 9px", borderRadius:6, border:`1.5px solid ${T.accent}`, fontSize:12, fontFamily:T.font, outline:"none", background:"#fff" }}
        />
        <button onClick={handleSave} disabled={saving}
          style={{ padding:"5px 9px", borderRadius:6, border:"none", background:T.accent, color:"#fff", fontSize:12, cursor:"pointer", fontWeight:700 }}>
          {saving ? "…" : "✓"}
        </button>
        {current && (
          <button onClick={() => { setVal(current); setEditing(false); }}
            style={{ padding:"5px 7px", borderRadius:6, border:`1px solid ${T.border}`, background:"transparent", fontSize:11, cursor:"pointer", color:T.muted }}>
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:12, color:T.textPrimary, fontWeight:600 }}>
        {saved ? <span style={{ color:"#389e0d" }}>✓ {val}</span> : val}
      </span>
      <button
        onClick={() => setEditing(true)}
        title="Modifier le N° de commande"
        style={{ padding:"2px 6px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", fontSize:10, cursor:"pointer", color:T.muted }}
      >
        ✏️
      </button>
    </div>
  );
}

export default function FournisseurPage() {
  const config = PAGES["fournisseur"];
  const gp     = useGridPage({ origine: "DFOU", config });

  const [source,  setSource]  = useState("diapason");
  const [modal8D, setModal8D] = useState({ open: false, fe: null, value: "" });
  // Cache local des no_commande modifiés
  const [commandeMap, setCommandeMap] = useState({});

  const { map: analyses8D, update: updateAnalyses8D } = useAnalyses8D();

  const appFE = useAppFE("fournisseur", {
    q:      source === "app" ? gp.q      : "",
    statut: source === "app" ? gp.statut : "Tous",
    annee:  source === "app" ? gp.annee  : null,
  });

  useEffect(() => { injectGlobalCSS(); }, []);

  const open8D = (fe) => setModal8D({ open: true, fe, value: analyses8D[fe.numero_fe] || fe.analyse_8d || "" });
  const handleSave8D = (v) => {
    if (modal8D.fe?.numero_fe) updateAnalyses8D(modal8D.fe.numero_fe, v);
    setModal8D({ open: false, fe: null, value: "" });
  };

  const handleCommandeSaved = (feId, val) => {
    setCommandeMap(prev => ({ ...prev, [feId]: val }));
  };

  const isApp   = source === "app";
  const rows    = isApp ? appFE.items : gp.pagedRows;
  const loading = isApp ? appFE.loading : gp.loading;

  return (
    <div style={{ fontFamily:T.font, padding:24, background:T.bg, minHeight:"100vh" }}>
      <div className="ap-page-head">
        <div>
          <div className="ap-h1">Fournisseur</div>
          <div className="ap-sub">{loading ? "Chargement…" : `${isApp ? appFE.total : gp.items.length} FE`}</div>
        </div>
        <SourceToggle source={source} onChange={setSource} diapasonLabel="SILOG"
          diapasonCount={gp.items?.length} appCount={appFE.total} />
      </div>

      <GridToolbar q={gp.q} setQ={gp.setQ} statut={gp.statut} setStatut={gp.setStatut}
        annee={gp.annee} setAnnee={gp.setAnnee}
        onlyMissing={gp.onlyMissing} setOnlyMissing={gp.setOnlyMissing}
        onPageReset={() => gp.setPage(1)} />

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th className="ap-th">N° FE</th>
              <th className="ap-th">Client</th>
              <th className="ap-th">Article</th>
              <th className="ap-th">Fournisseur</th>
              <th className="ap-th">N° Commande</th>
              <th className="ap-th">Statut</th>
              <th className="ap-th">Qté NC</th>
              {isApp && <th className="ap-th">Gravité</th>}
              <th className="ap-th">Avancement 8D</th>
              {!isApp && <th className="ap-th">Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((fe, idx) => {
              const feEnrichi   = isApp ? fe : { ...fe, analyse_8d: analyses8D[fe.numero_fe] || fe.analyse_8d };
              const clientCode  = getClientCode(fe);
              const clientName  = getClientName(fe);
              const fournisseur = isApp
                ? (fe.nom_fournisseur || fe.code_fournisseur || "—")
                : (fe.fournisseur_resp || fe.client_fourn || "—");

              // Merge cache local dans la FE pour CommandeCell
              const feAvecCommande = isApp
                ? { ...fe, no_commande: commandeMap[fe.id] ?? fe.no_commande }
                : fe;

              const numCommande = isApp
                ? (commandeMap[fe.id] ?? getNumCommande(fe))
                : getNumCommande(fe);

              return (
                <tr key={fe.numero_fe || fe.id || idx} className="ap-tr-hover">
                  <td className="ap-td">
                    <button onClick={() => open8D(feEnrichi)} style={{ background:"none", border:"none", cursor:"pointer", fontWeight:700, color:"#0071e3", fontSize:13, padding:0, fontFamily:"inherit" }}>
                      {fe.numero_fe || "—"}
                    </button>
                    <div style={{ fontSize:11, color:T.textSecond, marginTop:2 }}>
                      {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </td>
                  <td className="ap-td">
                    <div style={{ fontWeight:600, fontSize:12 }}>{clientName}</div>
                    <div style={{ fontSize:10, color:T.textLight, fontFamily:"monospace" }}>{clientCode}</div>
                  </td>
                  <td className="ap-td">
                    <div style={{ fontFamily:"monospace", fontSize:11 }}>{fe.code_article || "—"}</div>
                    <div style={{ fontSize:11, color:T.textLight, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={fe.designation}>
                      {fe.designation || ""}
                    </div>
                  </td>
                  <td className="ap-td" style={{ fontSize:12, color:T.textSecond }}>{fournisseur}</td>

                  {/* N° Commande — éditable en mode App, lecture seule en SILOG */}
                  <td className="ap-td">
                    {isApp ? (
                      <CommandeCell
                        fe={feAvecCommande}
                        onSaved={handleCommandeSaved}
                      />
                    ) : (
                      <span style={{ fontSize:12, color:numCommande?"#1d1d1f":T.textLight, fontWeight:numCommande?600:400 }}>
                        {numCommande || "—"}
                      </span>
                    )}
                  </td>

                  <td className="ap-td">
                    {isApp
                      ? <span className={`ap-badge ${STATUT_BADGE[fe.statut] || "ap-badge-gray"}`}>{fe.statut || "—"}</span>
                      : <span className={`ap-badge ${fe.statut?.toLowerCase().includes("traité") ? "ap-badge-green" : "ap-badge-orange"}`}>{fe.statut || "—"}</span>}
                  </td>
                  <td className="ap-td" style={{ fontWeight:600 }}>
                    {isApp ? (fe.quantite || "—") : (fe.qte_non_conforme ? Number(fe.qte_non_conforme).toLocaleString("fr-FR") : "—")}
                  </td>
                  {isApp && <td className="ap-td"><span className={`ap-badge ${GRAVITE_BADGE[fe.gravite] || "ap-badge-gray"}`}>{fe.gravite || "—"}</span></td>}
                  <td className="ap-td">
                    {isApp ? <span style={{ fontSize:12, color:T.textLight }}>—</span> : <Badge8D fe={feEnrichi} />}
                  </td>
                  {!isApp && (
                    <td className="ap-td">
                      <button className="ap-btn ap-btn-primary" style={{ padding:"4px 12px", fontSize:11 }} onClick={() => open8D(feEnrichi)}>
                        Analyse 8D
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr><td className="ap-td" colSpan={10} style={{ textAlign:"center", padding:40, color:T.textLight }}>
                Aucune FE {isApp ? "dans l'app" : "SILOG"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isApp && <Pagination page={gp.page} totalPages={gp.totalPages} setPage={gp.setPage} />}

      <Analyse8DModal
        open={modal8D.open} fe={modal8D.fe} initialValue={modal8D.value}
        site={getSiteFromJWT()}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={handleSave8D}
      />
    </div>
  );
}