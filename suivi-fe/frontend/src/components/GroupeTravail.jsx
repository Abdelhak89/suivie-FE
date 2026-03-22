// src/components/GroupeTravail.jsx
// Groupe de travail 8D — membres, relance email, export PDF

import { useState } from "react";

const T = {
  font:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  fontDisplay:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
  accent:"#0071e3", green:"#30d158", orange:"#ff9f0a", red:"#ff3b30",
  border:"rgba(0,0,0,0.08)", surface:"#fff", surfaceAlt:"#f5f5f7",
  textPrimary:"#1d1d1f", textSecond:"#6e6e73", textLight:"#aeaeb2",
  r:"12px", rSm:"8px",
};

const ROLES = ["Responsable Qualité","Chef d'îlot","Technicien méthodes","Responsable production","Ingénieur qualité","Opérateur","Contrôleur","Autre"];
const SITES = ["SOUCY","SENS","LAXOU","KMTM"];
const SITE_COLORS = { SOUCY:{bg:"#e8f0fe",color:"#1a56a0"}, SENS:{bg:"#f3e8ff",color:"#6b21a8"}, LAXOU:{bg:"#fff8ed",color:"#b45309"}, KMTM:{bg:"#e8fdf0",color:"#1a7a3f"} };

const EMPTY_MEMBRE = { prenom:"", nom:"", email:"", role:"", site:"SOUCY" };

function Avatar({ prenom, nom, site }) {
  const s = SITE_COLORS[site] || { bg:"#f5f5f7", color:"#6e6e73" };
  const initials = ((prenom?.[0]||"")+(nom?.[0]||"")).toUpperCase() || "?";
  return (
    <div style={{ width:36, height:36, borderRadius:"50%", background:s.bg, color:s.color,
      display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>
      {initials}
    </div>
  );
}

export default function GroupeTravail({ membres = [], onChange, fe, data8D }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_MEMBRE });
  const [editIdx, setEditIdx]   = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.prenom.trim() || !form.nom.trim()) return;
    if (editIdx !== null) {
      const updated = membres.map((m, i) => i === editIdx ? { ...form } : m);
      onChange(updated);
      setEditIdx(null);
    } else {
      onChange([...membres, { ...form }]);
    }
    setForm({ ...EMPTY_MEMBRE });
    setShowForm(false);
  };

  const handleEdit = (i) => {
    setForm({ ...membres[i] });
    setEditIdx(i);
    setShowForm(true);
  };

  const handleRemove = (i) => {
    onChange(membres.filter((_, idx) => idx !== i));
  };

  // Email groupé — relance
  const handleRelance = () => {
    if (!membres.length) return;
    const emails = membres.map(m => m.email).filter(Boolean).join(",");
    const feNum  = fe?.numero_fe || "NC";
    const feDesc = fe?.designation || "";
    const subject = `[8D] Relance — FE ${feNum}`;

    const actionsEnCours = (data8D?.actions || []).filter(a => a.statut === "En cours" || a.statut === "À faire");
    const lignesActions  = actionsEnCours.map((a, i) =>
      `  ${i+1}. ${a.description||"—"} — Resp: ${a.responsable||"—"} — Échéance: ${a.echeance||"—"} — Statut: ${a.statut}`
    ).join("\n");

    const body = `Bonjour,\n\nCeci est un rappel concernant l'analyse 8D en cours.\n\n` +
      `FE : ${feNum}${feDesc ? ` — ${feDesc}` : ""}\n\n` +
      `────── ACTIONS EN ATTENTE ──────\n${lignesActions || "  Aucune action en attente"}\n\n` +
      `────── AVANCEMENT ──────\n` +
      `Merci de mettre à jour vos actions et de valider votre avancement.\n\n` +
      `---\nEnvoyé depuis Suivi FE — Analyse 8D`;

    window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <div style={{ display:"grid", gap:14 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:T.fontDisplay, fontWeight:700, fontSize:14, color:T.textPrimary }}>
            👥 Groupe de travail
          </div>
          <div style={{ fontSize:11, color:T.textSecond, marginTop:2 }}>
            {membres.length} membre{membres.length > 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {membres.length > 0 && (
            <button onClick={handleRelance} style={{
              fontFamily:T.font, fontSize:12, fontWeight:600, padding:"7px 14px",
              borderRadius:T.rSm, border:`1.5px solid ${T.orange}`,
              background:"#fff8ed", color:"#b45309", cursor:"pointer",
              display:"flex", alignItems:"center", gap:6,
            }}>
              📧 Relancer le groupe
            </button>
          )}
          <button onClick={() => { setForm({...EMPTY_MEMBRE}); setEditIdx(null); setShowForm(!showForm); }} style={{
            fontFamily:T.font, fontSize:12, fontWeight:600, padding:"7px 14px",
            borderRadius:T.rSm, border:`1.5px solid ${T.accent}`,
            background:showForm ? T.accent : "transparent",
            color:showForm ? "#fff" : T.accent, cursor:"pointer",
          }}>
            {showForm ? "✕ Annuler" : "＋ Ajouter"}
          </button>
        </div>
      </div>

      {/* Formulaire ajout/édition */}
      {showForm && (
        <div style={{ background:"#eef4ff", borderRadius:T.r, border:`1.5px solid rgba(0,113,227,.2)`, padding:16, display:"grid", gap:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <input style={inputStyle} placeholder="Prénom *" value={form.prenom} onChange={e => setF("prenom", e.target.value)} />
            <input style={inputStyle} placeholder="Nom *"    value={form.nom}    onChange={e => setF("nom",    e.target.value)} />
          </div>
          <input style={inputStyle} placeholder="Email" type="email" value={form.email} onChange={e => setF("email", e.target.value)} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <select style={inputStyle} value={form.role} onChange={e => setF("role", e.target.value)}>
              <option value="">— Rôle —</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select style={inputStyle} value={form.site} onChange={e => setF("site", e.target.value)}>
              {SITES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} disabled={!form.prenom.trim() || !form.nom.trim()} style={{
            fontFamily:T.font, fontSize:13, fontWeight:600, padding:"9px",
            borderRadius:T.rSm, border:"none", background:T.accent, color:"#fff",
            cursor:"pointer", opacity:(!form.prenom.trim() || !form.nom.trim()) ? .5 : 1,
          }}>
            {editIdx !== null ? "✓ Modifier" : "＋ Ajouter au groupe"}
          </button>
        </div>
      )}

      {/* Liste membres */}
      {membres.length === 0 && !showForm ? (
        <div style={{ padding:"24px", textAlign:"center", color:T.textLight, fontSize:13,
          background:T.surfaceAlt, borderRadius:T.r, border:`1.5px dashed ${T.border}` }}>
          Aucun membre — ajoutez les participants à cette analyse
        </div>
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {membres.map((m, i) => {
            const sc = SITE_COLORS[m.site] || { bg:"#f5f5f7", color:"#6e6e73" };
            return (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                background:T.surface, borderRadius:T.r, border:`1.5px solid ${T.border}`,
                transition:"box-shadow .12s",
              }}>
                <Avatar prenom={m.prenom} nom={m.nom} site={m.site} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.textPrimary }}>
                    {m.prenom} {m.nom}
                  </div>
                  <div style={{ fontSize:11, color:T.textSecond, marginTop:1, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    {m.role && <span>{m.role}</span>}
                    {m.email && <span style={{ color:T.accent }}>📧 {m.email}</span>}
                    <span style={{ padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:700, background:sc.bg, color:sc.color }}>
                      {m.site}
                    </span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {m.email && (
                    <button onClick={() => window.open(`mailto:${m.email}?subject=[8D] FE ${fe?.numero_fe||""}`, "_blank")}
                      style={ghostBtn} title="Envoyer un email">✉️</button>
                  )}
                  <button onClick={() => handleEdit(i)} style={ghostBtn} title="Modifier">✏️</button>
                  <button onClick={() => handleRemove(i)} style={{ ...ghostBtn, color:T.red }} title="Retirer">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  fontSize:13, color:"#1d1d1f", background:"#fff", border:"1.5px solid rgba(0,0,0,0.08)",
  borderRadius:"8px", padding:"8px 11px", width:"100%", boxSizing:"border-box", outline:"none",
};
const ghostBtn = {
  width:28, height:28, borderRadius:8, border:"1.5px solid rgba(0,0,0,0.08)",
  background:"transparent", cursor:"pointer", display:"flex", alignItems:"center",
  justifyContent:"center", fontSize:13, fontFamily:"inherit",
};