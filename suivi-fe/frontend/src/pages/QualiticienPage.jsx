// src/pages/QualiticienPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getProfile() {
  try { return JSON.parse(localStorage.getItem("fe_profile") || "null"); } catch { return null; }
}

export default function QualiticienPage() {
  const { slug } = useParams();
  const nav      = useNavigate();
  const [profile, setProfile] = useState(() => getProfile());
  const [annee,   setAnnee]   = useState("2026");
  const [loading, setLoading] = useState(false);
  const [items,   setItems]   = useState([]);

  useEffect(() => {
    const p = getProfile();
    if (!p) { setProfile(null); return; }
    setProfile(p);
  }, [slug]);

  useEffect(() => {
    if (!profile) return;
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);
    if (profile.role === "qualiticien" && profile.clientCodes?.length) params.set("clientCodes", profile.clientCodes.join(","));
    fetch(`${API}/fe?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [annee, profile?.slug]);

  if (!profile) return (
    <div className="container">
      <div className="panel">
        <div className="panelTitle">Profil introuvable</div>
        <div className="sub" style={{ marginBottom: 14 }}>Retour à l'accueil.</div>
        <button className="btn btnPrimary" onClick={() => nav("/accueil", { replace: true })}>← Retour profils</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">{profile.label}</h2>
          <div className="sub">
            {profile.role === "qualiticien"
              ? `Portefeuille : ${(profile.clientCodes || []).join(", ")}`
              : "Vue globale"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
            <option value="2026">2026</option><option value="2025">2025</option>
            <option value="2024">2024</option><option value="">Toutes</option>
          </select>
          <span className="badge badgeBlue">{loading ? "Chargement…" : `${items.length} FE`}</span>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="tableWrap" style={{ border: "none", borderRadius: "var(--r-xl)" }}>
          {items.length === 0 && !loading ? (
            <div style={{ padding: 24 }} className="sub">Aucune FE pour ce filtre.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th className="th">N° FE</th>
                  <th className="th">REF</th>
                  <th className="th">Désignation</th>
                  <th className="th">Statut</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} className="rowHover">
                    <td className="td"><b>{x.numero_fe || "—"}</b></td>
                    <td className="td mono">{x.code_article || "—"}</td>
                    <td className="td">{x.designation || "—"}</td>
                    <td className="td"><StatusBadge value={x.statut} /></td>
                    <td className="td">{String(x.date_creation || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
