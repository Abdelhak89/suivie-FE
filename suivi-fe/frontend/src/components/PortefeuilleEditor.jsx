// src/components/PortefeuilleEditor.jsx
// Éditeur de portefeuille client d'un qualitien
// Props: userId, userName, currentPortefeuille, userSites, onSaved, onClose
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { getClientNameFromCode } from "../data/clients.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const T = {
  bg: "#f5f5f7", surface: "#fff", border: "rgba(0,0,0,0.08)",
  accent: "#0071e3", red: "#ff3b30", muted: "#6e6e73", light: "#aeaeb2",
  text: "#1d1d1f",
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

export default function PortefeuilleEditor({ userId, userName, currentPortefeuille = [], userSites, onSaved, onClose }) {
  const token   = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Sites disponibles pour ce qualitien
  const sites = useMemo(() =>
    (userSites || "SOUCY").split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
    [userSites]
  );

  const [activeSite,  setActiveSite]  = useState(sites[0] || "SOUCY");
  const [diapClients, setDiapClients] = useState([]); // [{prefixe, nom_client}] depuis Diapason
  const [loadingDiap, setLoadingDiap] = useState(false);
  const [portefeuille, setPortefeuille] = useState(
    Array.isArray(currentPortefeuille) ? currentPortefeuille : []
  );
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Charge les préfixes Diapason pour le site actif
  useEffect(() => {
    setLoadingDiap(true);
    setSearch("");
    axios.get(`${API}/api/clients/prefixes?site=${activeSite.toLowerCase()}`, { headers })
      .then(r => setDiapClients(r.data.data || []))
      .catch(() => setDiapClients([]))
      .finally(() => setLoadingDiap(false));
  }, [activeSite]);

  // Clients déjà dans le portefeuille pour ce site
  const portefeuilleSite = portefeuille.filter(p => p.site === activeSite);
  const portefeuilleKeys = new Set(portefeuille.map(p => `${p.prefixe}|${p.site}`));

  const isSelected = (prefixe) => portefeuilleKeys.has(`${prefixe}|${activeSite}`);

  const toggle = (prefixe, nom_client_diap) => {
    const nom_client = getClientNameFromCode(prefixe) || nom_client_diap || prefixe;
    const key = `${prefixe}|${activeSite}`;
    if (portefeuilleKeys.has(key)) {
      setPortefeuille(prev => prev.filter(p => !(p.prefixe === prefixe && p.site === activeSite)));
    } else {
      setPortefeuille(prev => [...prev, { prefixe, nom_client, site: activeSite }]);
    }
  };

  const removeFromPortefeuille = (prefixe, site) => {
    setPortefeuille(prev => prev.filter(p => !(p.prefixe === prefixe && p.site === site)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/users/${userId}`, { portefeuille }, { headers });
      onSaved(portefeuille);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = diapClients.filter(c =>
    !search ||
    c.prefixe.includes(search) ||
    c.nom_client?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1300, padding: 20
    }} onClick={onClose}>
      <div style={{
        background: T.surface, borderRadius: 14, width: "min(820px, 95vw)",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2)", overflow: "hidden"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
              Portefeuille client — {userName}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {portefeuille.length} client{portefeuille.length > 1 ? "s" : ""} assigné{portefeuille.length > 1 ? "s" : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.muted }}>✕</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Panneau gauche — catalogue Diapason */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>

            {/* Sélecteur site */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 6 }}>
              {sites.map(s => (
                <button key={s} onClick={() => setActiveSite(s)} style={{
                  padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: `1.5px solid ${activeSite === s ? T.accent : T.border}`,
                  background: activeSite === s ? T.accent : "transparent",
                  color: activeSite === s ? "#fff" : T.muted,
                }}>{s}</button>
              ))}
            </div>

            {/* Recherche */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher préfixe ou client…"
                style={{ width: "100%", boxSizing: "border-box", padding: "7px 11px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", fontFamily: T.font }}
              />
            </div>

            {/* Liste clients Diapason */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
              {loadingDiap && (
                <div style={{ padding: 30, textAlign: "center", color: T.light, fontSize: 13 }}>Chargement…</div>
              )}
              {!loadingDiap && filtered.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: T.light, fontSize: 13 }}>Aucun client trouvé</div>
              )}
              {!loadingDiap && filtered.map(c => {
                const sel = isSelected(c.prefixe);
                return (
                  <div
                    key={c.prefixe}
                    onClick={() => toggle(c.prefixe, c.nom_client)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                      marginBottom: 2,
                      background: sel ? "rgba(0,113,227,0.07)" : "transparent",
                      border: `1.5px solid ${sel ? T.accent : "transparent"}`,
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${sel ? T.accent : T.border}`,
                      background: sel ? T.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#fff", fontWeight: 700,
                    }}>{sel ? "✓" : ""}</div>
                    <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: T.accent, minWidth: 36 }}>{c.prefixe}</span>
                    <span style={{ fontSize: 13, color: T.text }}>{getClientNameFromCode(c.prefixe) || c.nom_client || c.prefixe}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T.light, fontWeight: 600 }}>{activeSite}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panneau droit — portefeuille actuel */}
          <div style={{ width: 260, display: "flex", flexDirection: "column", background: T.bg }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
              Portefeuille assigné
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
              {portefeuille.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: T.light, fontSize: 12 }}>
                  Aucun client assigné
                </div>
              )}
              {/* Groupé par site */}
              {sites.map(site => {
                const items = portefeuille.filter(p => p.site === site);
                if (items.length === 0) return null;
                return (
                  <div key={site} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", padding: "4px 8px" }}>{site}</div>
                    {items.map(p => (
                      <div key={`${p.prefixe}|${p.site}`} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 10px", borderRadius: 7, background: T.surface,
                        border: `1px solid ${T.border}`, marginBottom: 3, fontSize: 12,
                      }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.accent, minWidth: 30 }}>{p.prefixe}</span>
                        <span style={{ flex: 1, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nom_client}</span>
                        <button
                          onClick={() => removeFromPortefeuille(p.prefixe, p.site)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.light, fontSize: 14, padding: 0, lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.muted }}>
            {portefeuille.length} client{portefeuille.length > 1 ? "s" : ""} · {sites.join(", ")}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", color: T.muted, fontFamily: T.font }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: saving ? T.light : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}