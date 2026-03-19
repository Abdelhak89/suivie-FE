// src/pages/ManagerPage.jsx — Gestion des qualitiens
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ROLES  = ["qualiticien", "responsable", "admin"];
const SITES  = ["SOUCY", "SENS", "LAXOU", "KMTM", "ALL"];

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

const EMPTY_FORM = { nom: "", prenom: "", email: "", password: "", role: "qualiticien", sites: "SOUCY" };

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

function SitesCheckboxes({ value, onChange }) {
  const selected = value === "ALL" ? ["ALL"] : value.split(",").map(s => s.trim()).filter(Boolean);
  const isAll    = selected.includes("ALL");

  const toggle = (site) => {
    if (site === "ALL") { onChange("ALL"); return; }
    let next = isAll ? [] : [...selected];
    next.includes(site) ? next = next.filter(s => s !== site) : next.push(site);
    onChange(next.length ? next.join(",") : "SOUCY");
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {["SOUCY", "SENS", "LAXOU", "KMTM", "ALL"].map(s => {
        const active = isAll ? s === "ALL" : selected.includes(s);
        return (
          <button key={s} onClick={() => toggle(s)} style={{
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

function UserForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
            letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Rôle</label>
          <select value={form.role} onChange={e => set("role", e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, outline: "none", background: "#fff" }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
          letterSpacing: ".5px", display: "block", marginBottom: 8 }}>Sites accessibles</label>
        <SitesCheckboxes value={form.sites} onChange={v => set("sites", v)} />
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

  const token = localStorage.getItem("kep_token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/users`, { headers });
      setUsers(res.data.data || []);
    } catch (err) {
      setError("Erreur chargement users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSave = async (form) => {
    if (!form.nom || !form.prenom || !form.email) return alert("Champs obligatoires manquants.");
    if (!editing && !form.password) return alert("Mot de passe requis pour un nouveau compte.");

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

  const filtered = users.filter(u =>
    !q || [u.nom, u.prenom, u.email, u.role].some(f => (f || "").toLowerCase().includes(q.toLowerCase()))
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
            {actifs.length} compte{actifs.length > 1 ? "s" : ""} actif{actifs.length > 1 ? "s" : ""}
            {inactifs.length > 0 && ` · ${inactifs.length} désactivé${inactifs.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
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
        />
      )}

      {/* Recherche */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher par nom, email, rôle..."
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
                  transition: "background .1s",
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
    </div>
  );
}