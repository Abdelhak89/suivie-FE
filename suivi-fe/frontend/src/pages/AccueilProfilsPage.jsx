// src/pages/AccueilProfilsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setProfile } from "../lib/session";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";
import { getAllSitesFromJWT } from "../utils/auth.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const PAGE_CSS = `
.accueil-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.profil-card {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  font-family: ${T.font};
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow .15s, border-color .15s, transform .12s;
  width: 100%;
}
.profil-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.10); border-color: rgba(0,0,0,0.14); transform: translateY(-2px); }
.profil-card.manager { border-color: rgba(255,159,10,0.3); background: #fffcf0; }
.profil-card.manager:hover { border-color: #ff9f0a; }
.profil-card.all { border-color: rgba(0,113,227,0.25); background: rgba(0,113,227,0.04); }
.profil-card.all:hover { border-color: ${T.accent}; }
.profil-avatar { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:18px; margin-bottom:14px; flex-shrink:0; }
.profil-name { font-family:${T.fontDisplay}; font-size:15px; font-weight:700; color:${T.textPrimary}; margin-bottom:6px; letter-spacing:-.2px; }
.profil-footer { display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid ${T.border}; margin-top:auto; }
.profil-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.profil-cta { font-family:${T.font}; font-size:12px; font-weight:600; color:${T.textLight}; background:none; border:none; cursor:pointer; padding:0; transition:color .12s; }
.profil-card:hover .profil-cta { color:${T.accent}; }
`;

const SITE_COLORS = {
  SOUCY:{ bg:"#e8f0fe", color:"#1a56a0" },
  SENS: { bg:"#f3e8ff", color:"#6b21a8" },
  LAXOU:{ bg:"#fff8ed", color:"#b45309" },
  KMTM: { bg:"#e8fdf0", color:"#1a7a3f" },
};

const AVATAR_COLORS = [
  { bg:"#e8f0fe", color:"#1a56a0" },
  { bg:"#e8fdf0", color:"#1a7a3f" },
  { bg:"#fff8ed", color:"#b45309" },
  { bg:"#f3e5f5", color:"#7b1fa2" },
  { bg:"#fce4ec", color:"#c62828" },
];

function getInitials(label) {
  return (label||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
}

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
}

function SitePill({ site }) {
  const sc = SITE_COLORS[site?.toUpperCase()] || { bg:"#f5f5f7", color:"#6e6e73" };
  return (
    <span style={{ padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700,
      background:sc.bg, color:sc.color, display:"inline-block" }}>
      {site?.toUpperCase()}
    </span>
  );
}

export default function AccueilProfilsPage() {
  const nav = useNavigate();

  const [qualitiens,    setQualitiens]    = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Sites du user connecté
  const userSites = getAllSitesFromJWT(); // ["laxou"] | ["soucy","sens"] | ["soucy","sens","laxou","kmtm"]

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("accueil-css")) {
      const s = document.createElement("style"); s.id="accueil-css"; s.textContent=PAGE_CSS;
      document.head.appendChild(s);
    }
    loadQualitiens();
  }, []);

  const loadQualitiens = async () => {
    setLoading(true);
    try {
      const token    = localStorage.getItem("kep_token");
      const headers  = { Authorization:`Bearer ${token}` };
      const kepUser  = JSON.parse(localStorage.getItem("kep_user") || "{}");
      const isAdmin  = kepUser.role === "admin" || kepUser.sites === "ALL";

      // Admin → fetch les 4 sites, sinon seulement les sites du JWT
      const sitesToFetch = isAdmin
        ? ["soucy","sens","laxou","kmtm"]
        : userSites;

      const results = await Promise.allSettled(
        sitesToFetch.map(site =>
          fetch(`${API}/api/users?site=${site}`, { headers })
            .then(r => r.json())
            .then(d => (d.data || []).map(q => ({ ...q, _site: site.toUpperCase() })))
            .catch(() => [])
        )
      );

      // Merger + dédupliquer par email
      const seen = new Set();
      const all  = [];
      results.forEach(r => {
        if (r.status === "fulfilled") {
          r.value.forEach(q => {
            if (!seen.has(q.email)) { seen.add(q.email); all.push(q); }
          });
        }
      });
      setQualitiens(all);
    } catch {
      setQualitiens([]);
    } finally {
      setLoading(false);
    }
  };

  const go = (p) => {
    setProfile({ slug:p.slug, label:p.label, role:p.role, clientCodes:p.clientCodes||[] });
    if (p.role === "manager") return nav("/manager", { replace:true });
    if (p.role === "all")     return nav("/all-fe",  { replace:true });
    return nav(`/qualiticien/${p.slug}`, { replace:true });
  };

  const goQualitien = (q) => {
    const slug  = slugify(`${q.prenom} ${q.nom}`);
    const label = `${q.prenom} ${q.nom}`;
    setProfile({ slug, label, role:"qualiticien", clientCodes:[] });
    nav(`/qualiticien/${slug}`, { replace:true });
  };

  const kepUser  = JSON.parse(localStorage.getItem("kep_user") || "{}");
  const isAdmin  = kepUser.role === "admin" || kepUser.sites === "ALL";
  const allSites = isAdmin ? ["SOUCY","SENS","LAXOU","KMTM"] : userSites.map(s=>s.toUpperCase());

  // Grouper par site
  const siteGroups = allSites.map(s => ({
    site: s,
    members: qualitiens.filter(q => q._site === s),
  })).filter(g => g.members.length > 0);

  const multiSite = siteGroups.length > 1;

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:"100vh", padding:"32px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <div style={{ fontFamily:T.fontDisplay, fontSize:28, fontWeight:800, color:T.textPrimary, letterSpacing:"-.5px", marginBottom:6 }}>
          Suivi F.E
        </div>
        <div style={{ fontSize:14, color:T.textSecond }}>
          Choisissez votre profil pour accéder à vos fiches événements
        </div>
        {/* Sites du user */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:10, flexWrap:"wrap" }}>
          {userSites.map(s => <SitePill key={s} site={s}/>)}
        </div>
      </div>

      {/* Qualitiens — groupés par site si multi-site */}
      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:T.textLight }}>Chargement des profils…</div>
      ) : qualitiens.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:T.textLight }}>
          Aucun profil qualitien trouvé pour votre site.<br/>
          <button onClick={() => nav("/interne-serie")} style={{ marginTop:16, padding:"9px 20px",
            borderRadius:8, border:"none", background:T.accent, color:"#fff",
            cursor:"pointer", fontFamily:T.font, fontSize:13, fontWeight:700 }}>
            Accéder directement
          </button>
        </div>
      ) : multiSite ? (
        // Affichage par groupe de site
        siteGroups.map(group => (
          <div key={group.site} style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <SitePill site={group.site} />
              <div style={{ fontSize:11, fontWeight:700, color:T.textLight, textTransform:"uppercase", letterSpacing:".6px" }}>
                {group.members.length} qualitien{group.members.length>1?"s":""}
              </div>
            </div>
            <div className="accueil-grid">
              {group.members.map((q, i) => <QualitienCard key={q.id||i} q={q} idx={i} onClick={() => goQualitien(q)} />)}
            </div>
          </div>
        ))
      ) : (
        // Affichage simple — un seul site
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textLight, textTransform:"uppercase",
            letterSpacing:".6px", marginBottom:12 }}>
            Qualiticiens — {userSites[0]?.toUpperCase()}
          </div>
          <div className="accueil-grid">
            {qualitiens.map((q, i) => <QualitienCard key={q.id||i} q={q} idx={i} onClick={() => goQualitien(q)} />)}
          </div>
        </div>
      )}

      {/* Séparateur */}
      <div style={{ height:1, background:T.border, margin:"24px 0" }}/>

      {/* Accès spéciaux */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:T.textLight, textTransform:"uppercase",
          letterSpacing:".6px", marginBottom:12 }}>
          Accès spéciaux
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
          <button className="profil-card manager" onClick={() => go({ slug:"responsable", label:"Responsable", role:"manager" })}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div className="profil-avatar" style={{ background:"#fff8ed", color:"#b45309", fontSize:20 }}>⚙️</div>
              <div>
                <div className="profil-name" style={{ marginBottom:2 }}>Responsable</div>
                <div style={{ fontSize:11, color:T.textSecond }}>Gestion & assignation des FE</div>
              </div>
            </div>
            <div className="profil-footer">
              <span className="profil-badge" style={{ background:"#fff8ed", color:"#b45309" }}>Manager</span>
              <span className="profil-cta">Accéder →</span>
            </div>
          </button>

          <button className="profil-card all" onClick={() => go({ slug:"toutes", label:"Toutes les FE", role:"all" })}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div className="profil-avatar" style={{ background:"#e8f0fe", color:T.accent, fontSize:20 }}>🌐</div>
              <div>
                <div className="profil-name" style={{ marginBottom:2 }}>Toutes les FE</div>
                <div style={{ fontSize:11, color:T.textSecond }}>Vue complète sans filtre client</div>
              </div>
            </div>
            <div className="profil-footer">
              <span className="profil-badge" style={{ background:"#e8f0fe", color:T.accent }}>Vue globale</span>
              <span className="profil-cta">Accéder →</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function QualitienCard({ q, idx, onClick }) {
  const av   = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const site = q._site || q.sites?.split(",")[0]?.trim().toUpperCase();
  const sc   = SITE_COLORS[site] || av;
  return (
    <button className="profil-card" onClick={onClick}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
        <div className="profil-avatar" style={{ background:sc.bg, color:sc.color }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
            fontWeight:800, fontSize:15 }}>
            {getInitials(`${q.prenom} ${q.nom}`)}
          </span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="profil-name">{q.prenom} {q.nom}</div>
          <div style={{ fontSize:11, color:"#6e6e73" }}>{q.role || "Qualiticien"}</div>
          {q.email && <div style={{ fontSize:10, color:"#aeaeb2", marginTop:2,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.email}</div>}
        </div>
      </div>
      <div className="profil-footer">
        <span className="profil-badge" style={{ background:sc.bg, color:sc.color }}>
          ✓ {site || "Qualitien"}
        </span>
        <span className="profil-cta">Ouvrir →</span>
      </div>
    </button>
  );
}