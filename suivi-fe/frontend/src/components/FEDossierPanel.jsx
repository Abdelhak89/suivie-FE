// src/components/FEDossierPanel.jsx
// Affiche et permet d'uploader les fichiers du dossier d'une FE
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const T = {
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  border: "rgba(0,0,0,0.08)", accent: "#0071e3", muted: "#6e6e73",
  light: "#aeaeb2", surface: "#fff", bg: "#f5f5f7",
};

const SOUS_TYPES = [
  { key: "photos",                  label: "📷 Photos défaut",           accept: "image/*" },
  { key: "alerte_qualite",          label: "🚨 Alerte Qualité",          accept: ".pdf,.docx" },
  { key: "derogation",              label: "📝 Dérogation",              accept: ".pdf,.docx" },
  { key: "8D",                      label: "🔍 Analyse 8D",              accept: ".pdf,.docx,.xlsx" },
  { key: "bons_retour_fournisseur", label: "📦 Bons retour fournisseur", accept: ".pdf,.docx" },
];

function fileIcon(nom) {
  const ext = nom.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📄";
  if (["docx","doc"].includes(ext)) return "📝";
  if (["xlsx","xls"].includes(ext)) return "📊";
  return "📁";
}

export default function FEDossierPanel({ fe, site }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null); // sous_type en cours
  const [error,     setError]     = useState(null);

  const feId   = fe?.id;
  const feSite = (fe?.site || site || "").toLowerCase();
  const token  = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFichiers = async () => {
    if (!feId || !feSite) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/nc-fe/${feSite}/${feId}/fichiers`, { headers });
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.message);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFichiers(); }, [feId, feSite]);

  const handleUpload = async (e, sousType) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(sousType);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const res = await fetch(`${API}/api/nc-fe/${feSite}/${feId}/upload`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body:    JSON.stringify({ sous_type: sousType, nom_fichier: file.name, base64 }),
        });
        const json = await res.json();
        if (json.success) fetchFichiers();
        else setError(json.message);
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch(e) { setError(e.message); setUploading(null); }
    e.target.value = "";
  };

  if (loading) return <div style={{ padding:20, textAlign:"center", color:T.light, fontFamily:T.font, fontSize:13 }}>Chargement du dossier…</div>;

  return (
    <div style={{ fontFamily:T.font }}>
      {/* Chemin dossier */}
      {data?.path && (
        <div style={{ padding:"8px 12px", background:"#f5f5f7", borderRadius:8, border:`1px solid ${T.border}`, fontSize:11, color:T.muted, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <span>📂</span>
          <span style={{ fontFamily:"monospace", fontSize:11 }}>{data.path}</span>
          {!data.exists && <span style={{ color:"#cf1322", fontWeight:600 }}>— dossier non trouvé</span>}
        </div>
      )}

      {error && <div style={{ color:"#cf1322", fontSize:12, marginBottom:10 }}>⚠ {error}</div>}

      {/* Sous-dossiers */}
      <div style={{ display:"grid", gap:10 }}>
        {SOUS_TYPES.map(({ key, label, accept }) => {
          const fichiers = data?.files?.[key] || [];
          return (
            <div key={key} style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1d1d1f" }}>{label}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:T.muted }}>{fichiers.length} fichier{fichiers.length>1?"s":""}</span>
                  <label style={{ padding:"4px 10px", borderRadius:6, border:`1.5px solid ${T.accent}`, background:"rgba(0,113,227,0.06)", color:T.accent, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    {uploading===key ? "⏳" : "+ Ajouter"}
                    <input type="file" accept={accept} style={{ display:"none" }} onChange={e => handleUpload(e, key)} disabled={uploading===key}/>
                  </label>
                </div>
              </div>
              <div style={{ padding:"10px 14px" }}>
                {fichiers.length === 0 ? (
                  <div style={{ fontSize:12, color:T.light, fontStyle:"italic" }}>Aucun fichier</div>
                ) : (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {fichiers.map(nom => (
                      <div key={nom} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:6, background:T.bg, border:`1px solid ${T.border}`, fontSize:12 }}>
                        <span>{fileIcon(nom)}</span>
                        <span style={{ color:"#1d1d1f", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nom}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}