// src/pages/LoginPage.jsx
// Chaque site a sa propre URL : /login/soucy, /login/sens, /login/laxou, /login/kmtm
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const KEP_BLUE    = "#0A84C8";
const KEP_DARK    = "#0D1117";
const KEP_SURFACE = "#161B22";
const KEP_BORDER  = "#30363D";
const KEP_TEXT    = "#E6EDF3";
const KEP_MUTED   = "#8B949E";
const KEP_ERROR   = "#F85149";
const KEP_SUCCESS = "#3FB950";

const SITE_CONFIG = {
  soucy: { label:"KEP Soucy",  color:"#0A84C8", bg:"#0D1F2D", border:"rgba(10,132,200,0.4)"  },
  sens:  { label:"KEP Sens",   color:"#BF5AF2", bg:"#1A0D2D", border:"rgba(191,90,242,0.4)"  },
  laxou: { label:"KEP Laxou",  color:"#FF9F0A", bg:"#2D1A00", border:"rgba(255,159,10,0.4)"  },
  kmtm:  { label:"KEP KMTM",   color:"#30D158", bg:"#0D2D14", border:"rgba(48,209,88,0.4)"   },
};

// Page d'accueil sans site — liste les 4 sites
function SiteSelector() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100vh", backgroundColor:KEP_DARK, display:"flex", flexDirection:"column", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:KEP_TEXT }}>
      <header style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 32px", borderBottom:`1px solid ${KEP_BORDER}`, backgroundColor:KEP_SURFACE }}>
        <div style={{ width:34, height:34, backgroundColor:KEP_BLUE, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" }}>FE</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:KEP_TEXT }}>Suivi F.E — KEP Métal</div>
          <div style={{ fontSize:11, color:KEP_MUTED }}>Sélectionnez votre site</div>
        </div>
      </header>
      <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px" }}>
        <div style={{ width:"100%", maxWidth:480 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:22, fontWeight:700, color:KEP_TEXT, marginBottom:8 }}>Choisissez votre site</div>
            <div style={{ fontSize:13, color:KEP_MUTED }}>Chaque site a sa propre page de connexion</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {Object.entries(SITE_CONFIG).map(([code, s]) => (
              <button key={code} onClick={() => navigate(`/login/${code}`)}
                style={{ background:s.bg, border:`2px solid ${s.border}`, borderRadius:12, padding:"20px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.15s", display:"flex", flexDirection:"column", gap:6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.8px", color:s.color, textTransform:"uppercase" }}>{code.toUpperCase()}</div>
                <div style={{ fontSize:15, fontWeight:600, color:KEP_TEXT }}>{s.label}</div>
                <div style={{ fontSize:11, color:KEP_MUTED, marginTop:2 }}>Accéder →</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage({ onLoginSuccess }) {
  const navigate         = useNavigate();
  const { site: siteRaw } = useParams();
  const site             = siteRaw?.toLowerCase();
  const siteConf         = SITE_CONFIG[site];

  // Hooks toujours déclarés — pas de return conditionnel avant eux
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [inputFocus, setInputFocus] = useState(null);

  // Pas de site dans l'URL → page de sélection de site (après les hooks)
  if (!site || !siteConf) return <SiteSelector />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Identifiant et mot de passe requis."); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Connexion refusée.");
      localStorage.setItem("kep_token", data.token);
      localStorage.setItem("kep_user",  JSON.stringify(data.user));
      if (onLoginSuccess) onLoginSuccess(data);
      else navigate("/accueil");
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", backgroundColor:KEP_DARK, display:"flex", flexDirection:"column", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:KEP_TEXT }}>

      {/* Header */}
      <header style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 32px", borderBottom:`1px solid ${KEP_BORDER}`, backgroundColor:KEP_SURFACE }}>
        <div style={{ width:34, height:34, backgroundColor:siteConf.color, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" }}>FE</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:KEP_TEXT }}>Suivi F.E — {siteConf.label}</div>
          <div style={{ fontSize:11, color:KEP_MUTED }}>Gestion des fiches de non conformité</div>
        </div>
        {/* Lien changer de site */}
        <button onClick={() => navigate("/login")}
          style={{ marginLeft:"auto", fontSize:12, color:KEP_MUTED, background:"none", border:`1px solid ${KEP_BORDER}`, borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit" }}>
          ← Changer de site
        </button>
      </header>

      <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px" }}>
        <div style={{ width:"100%", maxWidth:840, display:"grid", gridTemplateColumns:"var(--login-cols, 1fr 1fr)", gap:0, border:`1px solid ${KEP_BORDER}`, borderRadius:12, overflow:"hidden" }}>

          {/* ── Gauche : déclaration FE publique ── */}
          <div style={{ background:siteConf.bg, padding:"44px 40px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden", borderRight:`1px solid ${KEP_BORDER}` }}>
            {/* Cercles décoratifs */}
            <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", border:`1px solid ${siteConf.color}20`, pointerEvents:"none" }}/>
            <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", border:`1px solid ${siteConf.color}10`, pointerEvents:"none" }}/>

            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${siteConf.color}20`, border:`1px solid ${siteConf.color}40`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:siteConf.color, marginBottom:24 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:siteConf.color, display:"inline-block" }}/>
                Accès libre — {site.toUpperCase()}
              </div>

              <h2 style={{ fontSize:22, fontWeight:700, color:KEP_TEXT, margin:"0 0 12px", lineHeight:1.3 }}>
                Déclarer une fiche<br/>de non conformité
              </h2>
              <p style={{ fontSize:13, color:KEP_MUTED, margin:"0 0 28px", lineHeight:1.6 }}>
                Site <strong style={{ color:KEP_TEXT }}>{siteConf.label}</strong> — accès sans connexion requise.
              </p>

              <button
                onClick={() => navigate(`/declaration-fe/${site}`)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, backgroundColor:siteConf.color, color:"#fff", border:"none", borderRadius:8, padding:"14px 20px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.transform = "none"; }}
              >
                <span>Déclarer une FE</span>
                <span style={{ fontSize:18 }}>→</span>
              </button>
            </div>

            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:11, color:KEP_MUTED, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600 }}>Site actif</div>
              <span style={{ background:`${siteConf.color}30`, border:`1px solid ${siteConf.color}60`, borderRadius:4, padding:"3px 10px", fontSize:12, fontWeight:700, color:siteConf.color, letterSpacing:"0.5px" }}>
                {site.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ── Droite : login qualitien ── */}
          <div style={{ backgroundColor:KEP_SURFACE, padding:"44px 40px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(63,185,80,0.10)", border:"1px solid rgba(63,185,80,0.3)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:KEP_SUCCESS, marginBottom:24 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:KEP_SUCCESS, display:"inline-block" }}/>
              Espace qualité
            </div>

            <h2 style={{ fontSize:22, fontWeight:700, color:KEP_TEXT, margin:"0 0 6px" }}>Connexion</h2>
            <p style={{ fontSize:13, color:KEP_MUTED, margin:"0 0 28px", lineHeight:1.5 }}>
              Qualitiens & responsables {siteConf.label}.<br/>Accès dashboard, analyses et gestion NC.
            </p>

            <form onSubmit={handleLogin}>
              {error && (
                <div style={{ background:"rgba(248,81,73,0.1)", border:"1px solid rgba(248,81,73,0.3)", borderRadius:6, padding:"10px 14px", fontSize:13, color:KEP_ERROR, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span>⚠</span>{error}
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:KEP_MUTED, marginBottom:7, letterSpacing:"0.5px", textTransform:"uppercase" }}>Identifiant</label>
                <input type="text" placeholder="prenom.nom@kep-metal.fr" value={email}
                  onChange={e=>setEmail(e.target.value)} onFocus={()=>setInputFocus("email")} onBlur={()=>setInputFocus(null)}
                  disabled={loading}
                  style={{ width:"100%", background:KEP_DARK, border:`1px solid ${inputFocus==="email"?siteConf.color:KEP_BORDER}`, borderRadius:6, padding:"10px 13px", fontSize:14, color:KEP_TEXT, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.15s" }}
                />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:KEP_MUTED, marginBottom:7, letterSpacing:"0.5px", textTransform:"uppercase" }}>Mot de passe</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e=>setPassword(e.target.value)} onFocus={()=>setInputFocus("pass")} onBlur={()=>setInputFocus(null)}
                  disabled={loading}
                  style={{ width:"100%", background:KEP_DARK, border:`1px solid ${inputFocus==="pass"?siteConf.color:KEP_BORDER}`, borderRadius:6, padding:"10px 13px", fontSize:14, color:KEP_TEXT, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color 0.15s" }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", background:siteConf.color, color:"#fff", border:"none", borderRadius:8, padding:13, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1, fontFamily:"inherit", letterSpacing:"0.3px" }}>
                {loading?"Connexion…":"Se connecter →"}
              </button>
            </form>

            <div style={{ borderTop:`1px solid ${KEP_BORDER}`, margin:"24px 0" }}/>
            <p style={{ fontSize:12, color:KEP_MUTED, lineHeight:1.6, margin:0 }}>
              Compte bloqué ?{" "}
              <span style={{ color:siteConf.color, fontWeight:600 }}>Contactez le responsable qualité.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}