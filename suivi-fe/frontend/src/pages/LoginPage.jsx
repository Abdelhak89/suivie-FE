import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const KEP_BLUE = "#0A84C8";
const KEP_DARK = "#0D1117";
const KEP_SURFACE = "#161B22";
const KEP_BORDER = "#30363D";
const KEP_TEXT = "#E6EDF3";
const KEP_MUTED = "#8B949E";
const KEP_ERROR = "#F85149";
const KEP_SUCCESS = "#3FB950";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: KEP_DARK,
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: KEP_TEXT,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 32px",
    borderBottom: `1px solid ${KEP_BORDER}`,
    backgroundColor: KEP_SURFACE,
  },
  logo: {
    width: "36px",
    height: "36px",
    backgroundColor: KEP_BLUE,
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    letterSpacing: "0.5px",
    color: "#fff",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: KEP_TEXT,
    margin: 0,
  },
  headerSub: {
    fontSize: "12px",
    color: KEP_MUTED,
    margin: 0,
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },
  container: {
    width: "100%",
    maxWidth: "840px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0",
    border: `1px solid ${KEP_BORDER}`,
    borderRadius: "12px",
    overflow: "hidden",
  },
  publicZone: {
    backgroundColor: KEP_BLUE,
    padding: "48px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  publicPattern: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    pointerEvents: "none",
  },
  publicPattern2: {
    position: "absolute",
    top: "-80px",
    right: "-80px",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.07)",
    pointerEvents: "none",
  },
  publicBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "#fff",
    width: "fit-content",
    marginBottom: "24px",
  },
  publicTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: 1.2,
    margin: "0 0 12px",
  },
  publicDesc: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.6,
    margin: "0 0 32px",
  },
  publicBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "#fff",
    color: KEP_BLUE,
    border: "none",
    borderRadius: "8px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    letterSpacing: "0.2px",
  },
  publicBtnDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
    letterSpacing: "0.2px",
  },
  publicSites: {
    display: "flex",
    gap: "6px",
    marginTop: "24px",
    flexWrap: "wrap",
  },
  sitePill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.5px",
  },
  sitePillActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  loginZone: {
    backgroundColor: KEP_SURFACE,
    padding: "48px 40px",
  },
  loginLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(63,185,80,0.1)",
    border: "1px solid rgba(63,185,80,0.3)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: KEP_SUCCESS,
    width: "fit-content",
    marginBottom: "24px",
  },
  loginTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: KEP_TEXT,
    margin: "0 0 6px",
  },
  loginSub: {
    fontSize: "13px",
    color: KEP_MUTED,
    margin: "0 0 32px",
    lineHeight: 1.5,
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  fieldLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: KEP_MUTED,
    marginBottom: "8px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    backgroundColor: KEP_DARK,
    border: `1px solid ${KEP_BORDER}`,
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "14px",
    color: KEP_TEXT,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  errorBox: {
    backgroundColor: "rgba(248,81,73,0.1)",
    border: "1px solid rgba(248,81,73,0.3)",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "13px",
    color: KEP_ERROR,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: KEP_BLUE,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
    transition: "opacity 0.15s",
    letterSpacing: "0.3px",
    fontFamily: "inherit",
  },
  divider: {
    borderTop: `1px solid ${KEP_BORDER}`,
    margin: "24px 0",
  },
  footer: {
    fontSize: "12px",
    color: KEP_MUTED,
    lineHeight: 1.6,
  },
  footerAccent: {
    color: KEP_BLUE,
    fontWeight: "600",
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const { site } = useParams();   // défini sur /login/:site, undefined sur /login
  const navigate  = useNavigate();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [inputFocus, setInputFocus] = useState(null);
  const [pubHover,   setPubHover]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Identifiant et mot de passe requis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Connexion refusée.");
      // Stocke token + infos user
      localStorage.setItem("kep_token", data.token);
      localStorage.setItem("kep_user",  JSON.stringify(data.user));
      if (onLoginSuccess) onLoginSuccess(data);
      else navigate("/accueil");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicAccess = () => {
    navigate(`/declaration-fe/${site}`);
  };

  const getFocusBorder = (name) => ({
    ...styles.input,
    borderColor: inputFocus === name ? KEP_BLUE : KEP_BORDER,
  });

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logo}>KEP</div>
        <div>
          <p style={styles.headerTitle}>KEP Qualité</p>
          <p style={styles.headerSub}>Suivi des non-conformités · Déclaration FE</p>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>
        <div style={{ ...styles.container, gridTemplateColumns: "1fr 1fr" }}>

          {/* ── Zone gauche : accès public FE ── */}
          <div style={styles.publicZone}>
            <div style={styles.publicPattern} />
            <div style={styles.publicPattern2} />

            <div>
              <div style={styles.publicBadge}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#fff", display: "inline-block" }} />
                Accès libre
              </div>

              <h2 style={styles.publicTitle}>
                Déclaration<br />Fin d'Étape
              </h2>

              <p style={styles.publicDesc}>
                {site
                  ? <>Site <strong style={{ color: "#fff" }}>{site.toUpperCase()}</strong> — déclarez une fin d'étape depuis l'atelier. Aucune connexion requise.</>
                  : "Accédez via l'URL de votre site pour déclarer une fin d'étape."}
              </p>

              {site ? (
                <button
                  style={{
                    ...styles.publicBtn,
                    transform:  pubHover ? "translateY(-1px)" : "none",
                    boxShadow:  pubHover ? "0 6px 20px rgba(0,0,0,0.25)" : "none",
                  }}
                  onMouseEnter={() => setPubHover(true)}
                  onMouseLeave={() => setPubHover(false)}
                  onClick={handlePublicAccess}
                >
                  <span>Accéder à la déclaration</span>
                  <span style={{ fontSize: "18px" }}>→</span>
                </button>
              ) : (
                <div style={styles.publicBtnDisabled}>
                  <span>Sélectionnez un site via l'URL</span>
                  <span style={{ fontSize: "16px" }}>⊘</span>
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                Sites actifs
              </p>
              <div style={styles.publicSites}>
                {["SOUCY", "SENS", "LAXOU", "KMTM"].map((s) => (
                  <span
                    key={s}
                    style={s.toLowerCase() === site ? styles.sitePillActive : styles.sitePill}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Zone droite : connexion qualité ── */}
          <div style={styles.loginZone}>
            <div style={styles.loginLabel}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: KEP_SUCCESS, display: "inline-block" }} />
              Espace qualité
            </div>

            <h2 style={styles.loginTitle}>Connexion</h2>
            <p style={styles.loginSub}>
              Réservé aux qualitiens KEP.<br />
              Accès dashboard, analyses et gestion NC.
            </p>

            <form onSubmit={handleLogin}>
              {error && (
                <div style={styles.errorBox}>
                  <span style={{ fontSize: "14px" }}>⚠</span>
                  {error}
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel} htmlFor="email">Identifiant</label>
                <input
                  id="email"
                  type="text"
                  placeholder="prenom.nom@kep-metal.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setInputFocus("email")}
                  onBlur={() => setInputFocus(null)}
                  style={getFocusBorder("email")}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel} htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setInputFocus("password")}
                  onBlur={() => setInputFocus(null)}
                  style={getFocusBorder("password")}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor:  loading ? "not-allowed" : "pointer",
                }}
                disabled={loading}
              >
                {loading ? "Connexion en cours…" : "Se connecter"}
              </button>
            </form>

            <div style={styles.divider} />

            <p style={styles.footer}>
              Compte bloqué ou mot de passe oublié ?{" "}
              <span style={styles.footerAccent}>Contactez l'IT ou le responsable qualité</span>.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}