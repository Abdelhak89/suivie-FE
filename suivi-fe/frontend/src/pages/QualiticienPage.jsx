import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("fe_profile") || "null");
  } catch {
    return null;
  }
}

export default function QualiticienPage() {
  const { slug } = useParams();
  const nav = useNavigate();

  // ✅ IMPORTANT: profil en state (pas useMemo([]) sinon figé)
  const [profile, setProfile] = useState(() => getProfile());

  const [annee, setAnnee] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // ✅ recharger le profil quand le slug change (navigation)
  useEffect(() => {
    const p = getProfile();

    // sécurité: si pas de profil -> retour accueil
    if (!p) {
      setProfile(null);
      return;
    }

    // ✅ si le slug de l’URL ne correspond pas au profil stocké, on le recharge quand même
    // (et on laisse l'écran, car c’est le profil qui pilote le filtre)
    setProfile(p);
  }, [slug]);

  useEffect(() => {
    if (!profile) return;

    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);

    // filtre portefeuille
    if (profile.role === "qualiticien" && profile.clientCodes?.length) {
      params.set("clientCodes", profile.clientCodes.join(","));
    }

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee, profile?.slug]); // ✅ dépend du slug du profil (change quand tu changes de carte)

  if (!profile) {
    return (
      <div className="container">
        <div className="panel">
          <div className="panelTitle">Profil introuvable</div>
          <div className="sub">Retour à l’accueil.</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" onClick={() => nav("/accueil", { replace: true })}>
              Retour profils
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="toolbar">
          <div className="field">
            <span className="label">Année</span>
            <select className="select" value={annee} onChange={(e) => setAnnee(e.target.value)}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="">Toutes</option>
            </select>
          </div>

          <span className="badge badgeBlue">
            {loading ? "Chargement…" : `${items.length} FE`}
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panelTitle">FE filtrées</div>

        {items.length === 0 && !loading ? (
          <div className="sub">Aucune FE pour ce filtre.</div>
        ) : (
          <div className="tableWrap">
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
                    <td className="td">{x.code_article || "—"}</td>
                    <td className="td">{x.designation || "—"}</td>
                    <td className="td">{x.statut || "—"}</td>
                    <td className="td">{String(x.date_creation || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
