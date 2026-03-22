// src/components/DemandeSuppressionModal.jsx
import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const T = {
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  border: "rgba(0,0,0,0.08)", red: "#ff3b30", muted: "#6e6e73",
};

export default function DemandeSuppressionModal({ fe, onClose, onSent }) {
  const [motif,   setMotif]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const site = (fe?.site || "").toLowerCase();
  const id   = fe?.id;

  const handleSend = async () => {
    if (!site || !id) { setError("Site ou ID manquant."); return; }
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("kep_token");
      const res   = await fetch(`${API}/api/nc-fe/${site}/${id}/demande-suppression`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ motif }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSent?.();
      onClose();
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1400, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:14, width:"min(460px,95vw)", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", fontFamily:T.font }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:"#fff0ef", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🗑️</div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#1d1d1f" }}>Demande de suppression</div>
            <div style={{ fontSize:12, color:T.muted }}>FE {fe?.numero_fe}</div>
          </div>
        </div>

        <div style={{ padding:"10px 14px", background:"#fff8ed", borderRadius:8, border:"1.5px solid #ffd591", fontSize:12, color:"#b45309", marginBottom:18 }}>
          ⚠️ La demande sera envoyée au responsable de site pour approbation. La FE ne sera pas supprimée immédiatement.
        </div>

        <label style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".3px", display:"block", marginBottom:6 }}>
          Motif de suppression
        </label>
        <textarea
          rows={3}
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Expliquer pourquoi cette FE doit être supprimée..."
          style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${T.border}`, fontSize:13, fontFamily:T.font, outline:"none", resize:"vertical" }}
        />

        {error && <div style={{ color:T.red, fontSize:12, marginTop:8 }}>⚠ {error}</div>}

        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose}
            style={{ padding:"9px 18px", borderRadius:8, border:`1.5px solid ${T.border}`, background:"transparent", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font, color:T.muted }}>
            Annuler
          </button>
          <button onClick={handleSend} disabled={loading}
            style={{ padding:"9px 18px", borderRadius:8, border:"none", background:loading?"#ccc":T.red, color:"#fff", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:T.font }}>
            {loading ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}