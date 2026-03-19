// src/pages/SiteFEPage.jsx — FE créées via l'app par site
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SITE_COLORS = {
  SOUCY: { accent: "#0071e3", light: "#e8f0fe" },
  SENS:  { accent: "#7c3aed", light: "#f3e8ff" },
  LAXOU: { accent: "#d97706", light: "#fff8ed" },
  KMTM:  { accent: "#059669", light: "#e8fdf0" },
};

const GRAVITE_BADGE = {
  mineur:   "ap-badge-green",
  majeur:   "ap-badge-orange",
  critique: "ap-badge-red",
};

const STATUT_BADGE = {
  ouvert:    "ap-badge-blue",
  en_cours:  "ap-badge-orange",
  clos:      "ap-badge-green",
};

const TYPE_LABELS = {
  nc_interne:     "Interne",
  nc_fournisseur: "Fournisseur",
  nc_client:      "Client",
  incident:       "Incident",
};

export default function SiteFEPage() {
  const { site = "soucy" } = useParams();
  const siteUp  = site.toUpperCase();
  const colors  = SITE_COLORS[siteUp] || SITE_COLORS.SOUCY;
  const token   = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState("");
  const [statut,   setStatut]   = useState("tous");
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { injectGlobalCSS(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/nc-fe/${site}`, { headers });
      setItems(res.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [site]);

  const filtered = useMemo(() => {
    let list = items;
    if (statut !== "tous") list = list.filter(fe => fe.statut === statut);
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(fe =>
        [fe.numero_fe, fe.code_article, fe.designation, fe.declarant_nom, fe.type_evenement]
          .some(f => (f || "").toLowerCase().includes(ql))
      );
    }
    return list;
  }, [items, statut, q]);

  const handleChangeStatut = async (fe, newStatut) => {
    setSaving(true);
    try {
      // PATCH — on réutilise la route GET/:site en PATCH
      await axios.patch(`${API}/api/nc-fe/${site}/${fe.id}`, { statut: newStatut }, { headers });
      setItems(prev => prev.map(f => f.id === fe.id ? { ...f, statut: newStatut } : f));
      if (selected?.id === fe.id) setSelected(s => ({ ...s, statut: newStatut }));
    } catch { alert("Erreur mise à jour."); }
    finally { setSaving(false); }
  };

  const kpis = [
    { label: "Total",    val: items.length,                                   badge: "ap-badge-blue"   },
    { label: "Ouvertes", val: items.filter(f => f.statut === "ouvert").length, badge: "ap-badge-blue"   },
    { label: "En cours", val: items.filter(f => f.statut === "en_cours").length, badge: "ap-badge-orange" },
    { label: "Closes",   val: items.filter(f => f.statut === "clos").length,  badge: "ap-badge-green"  },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", padding: "24px 28px" }}>

      {/* Header */}
      <div className="ap-page-head">
        <div>
          <div className="ap-h1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            FE {siteUp}
            <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: colors.light, color: colors.accent }}>
              App KEP
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {!loading && kpis.map(k => (
              <span key={k.label} className={`ap-badge ${k.badge}`}>{k.val} {k.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher N° FE, article, déclarant…"
          style={{ flex: 1, minWidth: 200, padding: "9px 13px", borderRadius: 10,
            border: `1.5px solid ${T.border}`, fontSize: 13, fontFamily: T.font,
            background: T.surface, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "tous",     label: "Tous" },
            { key: "ouvert",   label: "Ouvertes" },
            { key: "en_cours", label: "En cours" },
            { key: "clos",     label: "Closes" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatut(key)} style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: T.font, transition: "all .12s",
              border: `1.5px solid ${statut === key ? colors.accent : T.border}`,
              background: statut === key ? colors.accent : "transparent",
              color: statut === key ? "#fff" : T.muted,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16 }}>

        {/* Table */}
        <div className="ap-table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: T.textLight }}>Chargement…</div>
          ) : (
            <table className="ap-table">
              <thead>
                <tr>
                  <th className="ap-th">N° FE</th>
                  <th className="ap-th">Type</th>
                  <th className="ap-th">Article</th>
                  <th className="ap-th">Gravité</th>
                  <th className="ap-th">Statut</th>
                  <th className="ap-th">Déclarant</th>
                  <th className="ap-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(fe => (
                  <tr key={fe.id}
                    className="ap-tr-hover"
                    onClick={() => setSelected(selected?.id === fe.id ? null : fe)}
                    style={{ cursor: "pointer", background: selected?.id === fe.id ? colors.light : "" }}
                  >
                    <td className="ap-td">
                      <div style={{ fontWeight: 700, color: colors.accent, fontSize: 13 }}>{fe.numero_fe}</div>
                    </td>
                    <td className="ap-td">
                      <span className="ap-badge ap-badge-gray" style={{ fontSize: 10 }}>
                        {TYPE_LABELS[fe.type_evenement] || fe.type_evenement || "—"}
                      </span>
                    </td>
                    <td className="ap-td" style={{ fontSize: 12, color: T.textSecond }}>
                      {fe.code_article || "—"}
                    </td>
                    <td className="ap-td">
                      <span className={`ap-badge ${GRAVITE_BADGE[fe.gravite] || "ap-badge-gray"}`}>
                        {fe.gravite || "—"}
                      </span>
                    </td>
                    <td className="ap-td">
                      <span className={`ap-badge ${STATUT_BADGE[fe.statut] || "ap-badge-gray"}`}>
                        {fe.statut || "—"}
                      </span>
                    </td>
                    <td className="ap-td" style={{ fontSize: 12, color: T.textSecond }}>
                      {fe.declarant_nom || "—"}
                    </td>
                    <td className="ap-td" style={{ fontSize: 12, color: T.textSecond }}>
                      {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
                {!filtered.length && !loading && (
                  <tr><td colSpan={7} className="ap-td"
                    style={{ textAlign: "center", color: T.textLight, padding: 48 }}>
                    Aucune FE trouvée
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel détail */}
        {selected && (
          <div style={{ background: T.surface, border: `1.5px solid ${colors.accent}`,
            borderRadius: 14, padding: 20, height: "fit-content",
            boxShadow: `0 4px 20px ${colors.light}` }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: colors.accent }}>{selected.numero_fe}</div>
                <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>
                  {new Date(selected.date_creation).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none",
                cursor: "pointer", color: T.textLight, fontSize: 18 }}>✕</button>
            </div>

            {/* Champs */}
            {[
              ["Type",        TYPE_LABELS[selected.type_evenement] || selected.type_evenement],
              ["Article",     selected.code_article],
              ["Désignation", selected.designation],
              ["OF",          selected.numero_of],
              ["Quantité",    selected.quantite],
              ["Déclarant",   selected.declarant_nom],
              ["Îlot",        selected.ilot],
              ["Fournisseur", selected.nom_fournisseur || selected.code_fournisseur],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between",
                padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.textSecond, fontWeight: 600 }}>{label}</span>
                <span style={{ color: T.text, textAlign: "right", maxWidth: 200,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
              </div>
            ))}

            {selected.description && (
              <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8,
                fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                {selected.description}
              </div>
            )}

            {/* Changement statut */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecond,
                textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                Statut
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "ouvert",   label: "Ouvert" },
                  { key: "en_cours", label: "En cours" },
                  { key: "clos",     label: "Clos" },
                ].map(({ key, label }) => (
                  <button key={key}
                    onClick={() => handleChangeStatut(selected, key)}
                    disabled={saving || selected.statut === key}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12,
                      fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                      border: `1.5px solid ${selected.statut === key ? colors.accent : T.border}`,
                      background: selected.statut === key ? colors.accent : "transparent",
                      color: selected.statut === key ? "#fff" : T.muted,
                      transition: "all .12s",
                    }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}