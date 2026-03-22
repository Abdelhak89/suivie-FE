// src/pages/ManagerPage.jsx — Gestion des qualitiens
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PortefeuilleEditor from "../components/PortefeuilleEditor.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const T = {
  bg:      "#f5f5f7", surface: "#fff", border: "rgba(0,0,0,0.08)",
  accent:  "#0071e3", red: "#ff3b30", green: "#30d158",
  text:    "#1d1d1f", muted: "#6e6e73", light: "#aeaeb2",
  font:    "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

const ROLE_COLORS = {
  admin:        { bg: "#fff0ef", color: "#ff3b30", border: "rgba(255,59,48,0.3)" },
  responsable:  { bg: "#fff8ed", color: "#ff9f0a", border: "rgba(255,159,10,0.3)" },
  qualiticien:  { bg: "#e8f0fe", color: "#0071e3", border: "rgba(0,113,227,0.3)" },
};

// ── Récupère le user connecté depuis le localStorage ─────────
function getConnectedUser() {
  try { return JSON.parse(localStorage.getItem("kep_user")); }
  catch { return null; }
}

// ── Sites accessibles au manager connecté ────────────────────
function getManagerSites(user) {
  if (!user?.sites) return ["SOUCY"];
  if (user.sites === "ALL") return ["SOUCY", "SENS", "LAXOU", "KMTM"];
  return user.sites.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
}

// ── Rôles créables selon le rôle du manager ──────────────────
function getAllowedRoles(user) {
  if (user?.role === "admin") return ["qualiticien", "responsable", "admin"];
  return ["qualiticien", "responsable"]; // responsable ne peut pas créer admin
}

function Badge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.qualiticien;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {role}
    </span>
  );
}

function SitesPills({ sites }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {(sites || "").split(",").map(s => s.trim()).filter(Boolean).map(s => (
        <span key={s} style={{ padding: "1px 7px", borderRadius: 4, fontSize: 11,
          fontWeight: 600, background: "rgba(0,113,227,0.08)", color: T.accent }}>
          {s}
        </span>
      ))}
    </div>
  );
}

// ── Checkboxes sites — limités aux sites du manager ──────────
function SitesCheckboxes({ value, onChange, allowedSites }) {
  const selected = value.split(",").map(s => s.trim()).filter(Boolean);

  const toggle = (site) => {
    let next = selected.includes(site)
      ? selected.filter(s => s !== site)
      : [...selected, site];
    if (next.length === 0) next = [allowedSites[0]]; // au moins un site
    onChange(next.join(","));
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {allowedSites.map(s => {
        const active = selected.includes(s);
        return (
          <button key={s} onClick={() => toggle(s)} type="button" style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1.5px solid ${active ? T.accent : T.border}`,
            background: active ? T.accent : "transparent",
            color: active ? "#fff" : T.muted, transition: "all .12s",
          }}>{s}</button>
        );
      })}
    </div>
  );
}

function UserForm({ initial, onSave, onCancel, loading, allowedSites, allowedRoles }) {
  const defaultSite = allowedSites[0] || "SOUCY";
  const EMPTY_FORM  = { nom: "", prenom: "", email: "", password: "", role: "qualiticien", sites: defaultSite };

  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isEdit = !!initial?.id;

  return (
    <div style={{ background: T.surface, border: `1.5px solid ${T.accent}`, borderRadius: 14,
      padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,113,227,0.1)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20 }}>
        {isEdit ? `Modifier — ${initial.prenom} ${initial.nom}` : "Nouveau qualitien"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {[["Nom", "nom"], ["Prénom", "prenom"]].map(([label, key]) => (
          <div key={key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: ".5px", display: "block", marginBottom: 6 }}>{label} *</label>
            <input value={form[key]} onChange={e => set(key, e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: "none" }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
          letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Email *</label>
        <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
          placeholder="prenom.nom@kep-metal.fr"
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
            border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: "none" }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
          letterSpacing: ".5px", display: "block", marginBottom: 6 }}>
          {isEdit ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe *"}
        </label>
        <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
          placeholder={isEdit ? "Laisser vide pour ne pas changer" : "Minimum 8 caractères"}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
            border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, outline: "none" }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
          letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Rôle</label>
        <select value={form.role} onChange={e => set("role", e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
            fontSize: 13, fontFamily: T.font, outline: "none", background: "#fff" }}>
          {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
          letterSpacing: ".5px", display: "block", marginBottom: 8 }}>Sites accessibles</label>
        <SitesCheckboxes
          value={form.sites}
          onChange={v => set("sites", v)}
          allowedSites={allowedSites}
        />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 8,
          border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 13,
          fontWeight: 600, cursor: "pointer", color: T.muted, fontFamily: T.font }}>
          Annuler
        </button>
        <button onClick={() => onSave(form)} disabled={loading}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none",
            background: loading ? T.light : T.accent, color: "#fff", fontSize: 13,
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: T.font }}>
          {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le compte"}
        </button>
      </div>
    </div>
  );
}

export default function ManagerPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [q,        setQ]        = useState("");
  const [error,    setError]    = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [loadingDem, setLoadingDem] = useState(false);
  const [portefeuilleModal, setPortefeuilleModal] = useState(null); // {user}

  const token   = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Infos du manager connecté ─────────────────────────────
  const connectedUser = useMemo(() => getConnectedUser(), []);
  const managerSites  = useMemo(() => getManagerSites(connectedUser), [connectedUser]);
  const allowedRoles  = useMemo(() => getAllowedRoles(connectedUser), [connectedUser]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // ← /api/users filtre déjà par les sites du JWT côté back
      const res = await axios.get(`${API}/api/users`, { headers });
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur chargement des qualitiens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); loadDemandes(); }, []);

  const loadDemandes = async () => {
    setLoadingDem(true);
    try {
      const res = await axios.get(`${API}/api/admin/demandes-suppression`, { headers });
      setDemandes(res.data.data || []);
    } catch {}
    finally { setLoadingDem(false); }
  };

  const handleApprouver = async (id) => {
    if (!confirm("Approuver et supprimer définitivement cette FE ?")) return;
    try {
      await axios.post(`${API}/api/admin/demandes-suppression/${id}/approuver`, {}, { headers });
      setDemandes(prev => prev.filter(d => d.id !== id));
    } catch(e) { alert(e.response?.data?.message || "Erreur."); }
  };

  const handleRefuser = async (id) => {
    try {
      await axios.post(`${API}/api/admin/demandes-suppression/${id}/refuser`, {}, { headers });
      setDemandes(prev => prev.filter(d => d.id !== id));
    } catch(e) { alert(e.response?.data?.message || "Erreur."); }
  };

  const handleSave = async (form) => {
    if (!form.nom || !form.prenom || !form.email)
      return alert("Champs obligatoires manquants.");
    if (!editing && !form.password)
      return alert("Mot de passe requis pour un nouveau compte.");

    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.patch(`${API}/api/users/${editing.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/api/users`, form, { headers });
      }
      setShowForm(false);
      setEditing(null);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur serveur.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async (user) => {
    const action = user.actif ? "désactiver" : "réactiver";
    if (!confirm(`${action} le compte de ${user.prenom} ${user.nom} ?`)) return;
    try {
      await axios.patch(`${API}/api/users/${user.id}`, { actif: !user.actif }, { headers });
      await loadUsers();
    } catch { alert("Erreur."); }
  };

  // Filtre texte côté front uniquement
  const filtered = users.filter(u =>
    !q || [u.nom, u.prenom, u.email, u.role, u.sites].some(f =>
      (f || "").toLowerCase().includes(q.toLowerCase())
    )
  );

  const actifs   = filtered.filter(u => u.actif);
  const inactifs = filtered.filter(u => !u.actif);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
            Gestion des qualitiens
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
            Sites : <strong>{managerSites.join(", ")}</strong>
            {" · "}{actifs.length} actif{actifs.length > 1 ? "s" : ""}
            {inactifs.length > 0 && ` · ${inactifs.length} désactivé${inactifs.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: T.accent,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>
          + Nouveau qualitien
        </button>
      </div>

      {/* Formulaire */}
      {(showForm || editing) && (
        <UserForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          loading={saving}
          allowedSites={managerSites}
          allowedRoles={allowedRoles}
        />
      )}

      {/* Recherche */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par nom, email, rôle, site…"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10,
            border: `1.5px solid ${T.border}`, fontSize: 13, fontFamily: T.font,
            background: T.surface, outline: "none" }}
        />
      </div>

      {error && (
        <div style={{ background: "#fff0ef", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 8,
          padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: T.light }}>Chargement…</div>
      ) : (
        <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 14,
          overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1.5px solid ${T.border}` }}>
                {["Nom", "Email", "Rôle", "Sites", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5,
                    fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: T.light }}>
                  Aucun utilisateur trouvé
                </td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                  opacity: u.actif ? 1 : 0.5,
                }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: T.text }}>{u.prenom} {u.nom}</div>
                    <div style={{ fontSize: 11, color: T.light, marginTop: 2 }}>
                      Créé le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: T.muted }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}><Badge role={u.role} /></td>
                  <td style={{ padding: "12px 16px" }}><SitesPills sites={u.sites} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: u.actif ? "rgba(48,209,88,0.12)" : "rgba(0,0,0,0.06)",
                      color: u.actif ? "#1a7a3f" : T.light }}>
                      {u.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditing(u); setShowForm(false); }}
                        style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`,
                          background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          color: T.muted, fontFamily: T.font }}>
                        Modifier
                      </button>
                      <button onClick={() => setPortefeuilleModal(u)}
                        style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: T.font, border: `1.5px solid rgba(0,113,227,0.3)`,
                          background: "rgba(0,113,227,0.06)", color: T.accent }}>
                        Portefeuille
                      </button>
                      <button onClick={() => handleToggleActif(u)}
                        style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: T.font, border: "none",
                          background: u.actif ? "rgba(255,59,48,0.08)" : "rgba(48,209,88,0.12)",
                          color: u.actif ? T.red : "#1a7a3f" }}>
                        {u.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inactifs.length > 0 && (
        <p style={{ fontSize: 12, color: T.light, marginTop: 12, textAlign: "center" }}>
          {inactifs.length} compte{inactifs.length > 1 ? "s" : ""} désactivé{inactifs.length > 1 ? "s" : ""} — visible{inactifs.length > 1 ? "s" : ""} dans la liste
        </p>
      )}

      {/* ── Section demandes de suppression ── */}
      {demandes.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:0 }}>
              Demandes de suppression
            </h2>
            <span style={{ padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700, background:"#fff0ef", color:T.red, border:"1px solid rgba(255,59,48,0.3)" }}>
              {demandes.length} en attente
            </span>
          </div>
          <div style={{ background:T.surface, border:`1.5px solid rgba(255,59,48,0.2)`, borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#fff0ef", borderBottom:`1.5px solid rgba(255,59,48,0.15)` }}>
                  {["FE","Site","Demandeur","Motif","Date","Actions"].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, color:T.red, textTransform:"uppercase", letterSpacing:".5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demandes.map((d,i) => (
                  <tr key={d.id} style={{ borderBottom:i<demandes.length-1?`1px solid ${T.border}`:"none" }}>
                    <td style={{ padding:"12px 16px", fontWeight:700, color:T.text }}>{d.numero_fe}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700, background:"rgba(0,113,227,0.08)", color:"#0071e3" }}>{d.site}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:T.muted }}>{d.demandeur_nom || "—"}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:T.muted, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.motif || "—"}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:T.muted }}>{new Date(d.date_demande).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => handleApprouver(d.id)}
                          style={{ padding:"5px 12px", borderRadius:7, border:"none", background:T.red, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font }}>
                          ✓ Approuver
                        </button>
                        <button onClick={() => handleRefuser(d.id)}
                          style={{ padding:"5px 12px", borderRadius:7, border:`1.5px solid ${T.border}`, background:"transparent", fontSize:12, fontWeight:600, cursor:"pointer", color:T.muted, fontFamily:T.font }}>
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {portefeuilleModal && (
        <PortefeuilleEditor
          userId={portefeuilleModal.id}
          userName={`${portefeuilleModal.prenom} ${portefeuilleModal.nom}`}
          currentPortefeuille={(() => { try { return JSON.parse(portefeuilleModal.portefeuille || "[]"); } catch { return []; } })()}
          userSites={portefeuilleModal.sites}
          onSaved={(pf) => {
            setUsers(prev => prev.map(u => u.id === portefeuilleModal.id ? { ...u, portefeuille: JSON.stringify(pf) } : u));
            setPortefeuilleModal(null);
          }}
          onClose={() => setPortefeuilleModal(null)}
        />
      )}
    </div>
  );
}