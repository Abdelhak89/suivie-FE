// src/pages/QualiticienPage.jsx — Style Apple — filtre clientCodes cote client
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getProfile() {
  try { return JSON.parse(localStorage.getItem("fe_profile") || "null"); } catch { return null; }
}

function badge8D(fe) {
  const raw = fe.analyse_8d;
  if (!raw) return <span className="ap-badge ap-badge-gray">A demarrer</span>;
  try {
    const p = JSON.parse(raw);
    const d = p?.responsable_qualite ? 8 : p?.resultat_verif ? 7 : p?.actions?.length ? 6
            : p?.why_apparition?.some(Boolean) ? 5 : p?.ilot ? 4 : p?.actions_immediates?.length ? 3 : 1;
    const cls = d >= 8 ? "ap-badge-green" : d >= 5 ? "ap-badge-orange" : "ap-badge-blue";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className={"ap-badge " + cls}>D{d}/D8</span>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ width: Math.round((d/8)*100) + "%", height: "100%", background: d>=8 ? T.green : d>=5 ? T.orange : T.accent }} />
        </div>
      </div>
    );
  } catch { return <span className="ap-badge ap-badge-gray">Saisie</span>; }
}

export default function QualiticienPage() {
  const { slug } = useParams();
  const nav      = useNavigate();

  const [profile, setProfileState] = useState(() => getProfile());
  const [annee,   setAnnee]        = useState("2026");
  const [loading, setLoading]      = useState(false);
  const [items,   setItems]        = useState([]);
  const [modal8D, setModal8D]      = useState({ open: false, fe: null, value: "" });

  useEffect(() => { injectGlobalCSS(); }, []);

  useEffect(() => {
    const p = getProfile();
    if (!p) { setProfileState(null); return; }
    setProfileState(p);
  }, [slug]);

  // Chargement + filtre client-side par les 3 premiers chiffres du code_article
  useEffect(() => {
    if (!profile) return;
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    params.set("limit", "2000");
    if (annee) {
      params.set("date_debut", annee + "-01-01");
      params.set("date_fin",   annee + "-12-31");
    }

    fetch(API + "/api/fe?" + params.toString(), { signal: ctrl.signal })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (ctrl.signal.aborted) return;
        var all = d.data || [];
        // Filtre par portefeuille : 3 premiers caracteres de code_article
        if (profile.role === "qualiticien" && profile.clientCodes && profile.clientCodes.length > 0) {
          var codes = new Set(profile.clientCodes);
          all = all.filter(function(fe) {
            var prefix = (fe.code_article || "").slice(0, 3);
            return codes.has(prefix);
          });
        }
        setItems(all);
      })
      .catch(function() { if (!ctrl.signal.aborted) setItems([]); })
      .finally(function() { if (!ctrl.signal.aborted) setLoading(false); });

    return function() { ctrl.abort(); };
  }, [annee, profile && profile.slug]);

  if (!profile) return (
    <div style={{ fontFamily: T.font, padding: 32, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.surface, border: "1.5px solid " + T.border, borderRadius: 16, padding: 32, maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Profil introuvable</div>
        <div style={{ fontSize: 13, color: T.textSecond, marginBottom: 20 }}>Retourne a l'accueil pour choisir un profil.</div>
        <button className="ap-btn ap-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => nav("/accueil", { replace: true })}>
          Retour profils
        </button>
      </div>
    </div>
  );

  var nbEnCours  = items.filter(function(x) { return x.statut && x.statut.toLowerCase().includes("cours"); }).length;
  var nbTraitees = items.filter(function(x) { return x.statut && x.statut.toLowerCase().includes("trait"); }).length;

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>

      <div className="ap-page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <button className="ap-btn ap-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => nav("/accueil", { replace: true })}>
              Profils
            </button>
            <div className="ap-h1">{profile.label}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(profile.clientCodes || []).map(function(c) {
              return (
                <span key={c} style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "rgba(0,113,227,0.08)", color: T.accent, border: "1px solid rgba(0,113,227,0.15)" }}>
                  {c}
                </span>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select className="ap-select" style={{ minWidth: 90 }} value={annee} onChange={function(e) { setAnnee(e.target.value); }}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>
          <span className="ap-badge ap-badge-blue">{loading ? "..." : items.length + " FE"}</span>
        </div>
      </div>

      {!loading && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total",    value: items.length, color: T.accent },
            { label: "En cours", value: nbEnCours,    color: T.orange },
            { label: "Traitees", value: nbTraitees,   color: T.green  },
          ].map(function(s) {
            return (
              <div key={s.label} style={{ background: T.surface, border: "1.5px solid " + T.border, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".4px" }}>{s.label}</div>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="ap-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textLight }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textLight }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            Aucune FE pour ce portefeuille
          </div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th className="ap-th">N FE</th>
                <th className="ap-th">Statut</th>
                <th className="ap-th">Qte NC</th>
                <th className="ap-th">REF</th>
                <th className="ap-th">Date</th>
                <th className="ap-th">Avancement 8D</th>
              </tr>
            </thead>
            <tbody>
              {items.map(function(x) {
                return (
                  <tr key={x.numero_fe || x.id} className="ap-tr-hover">
                    <td className="ap-td">
                      <button
                        onClick={() => setModal8D({ open: true, fe: x, value: x.analyse_8d || "" })}
                        style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: T.accent, fontSize: 13, padding: 0, fontFamily: T.font }}
                      >
                        {x.numero_fe || "—"}
                      </button>
                    </td>
                    <td className="ap-td">
                      <span className={"ap-badge " + (x.statut && x.statut.toLowerCase().includes("trait") ? "ap-badge-green" : "ap-badge-orange")}>
                        {x.statut || "—"}
                      </span>
                    </td>
                    <td className="ap-td" style={{ fontWeight: 600 }}>
                      {x.qte_non_conforme ? Number(x.qte_non_conforme).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="ap-td" style={{ fontFamily: "monospace", fontSize: 12 }}>{x.code_article || "—"}</td>
                    <td className="ap-td" style={{ color: T.textSecond, fontSize: 12 }}>
                      {x.date_creation ? new Date(x.date_creation).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="ap-td">{badge8D(x)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Analyse8DModal
        open={modal8D.open}
        fe={modal8D.fe}
        initialValue={modal8D.value}
        onCancel={() => setModal8D({ open: false, fe: null, value: "" })}
        onSave={function(v) { console.log("Save 8D", modal8D.fe && modal8D.fe.numero_fe, v); setModal8D({ open: false, fe: null, value: "" }); }}
      />
    </div>
  );
}