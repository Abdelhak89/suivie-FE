// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../services/feApi.js";
import StatCard from "../components/StatCard.jsx";
import "../styles/app.css";

const NAV_ITEMS = [
  { to: "/interne-serie",   title: "Interne Série",    sub: "Non-conformités internes série" },
  { to: "/interne-fai",     title: "Interne FAI",      sub: "Fiches DVI / FAI" },
  { to: "/client",          title: "Client",           sub: "Réclamations et NC clients" },
  { to: "/fournisseur",     title: "Fournisseur",      sub: "NC fournisseurs" },
  { to: "/kpi",             title: "📊 KPI",           sub: "Pareto, tendances, drilldown", accent: true },
  { to: "/alerte-qualite",  title: "Alerte Qualité",   sub: "Export XLSX" },
  { to: "/clinique-qualite",title: "Clinique Qualité", sub: "A3 DMAIC — PPT" },
  { to: "/derogation",      title: "Dérogation",       sub: "Export XLSX dérogation" },
];

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const g        = stats?.global   || {};
  const byType   = stats?.by_type  || [];
  const byClient = stats?.by_client|| [];

  const pct = (n, t) => t ? Math.round((n / t) * 100) : 0;

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Dashboard Qualité</h2>
          <div className="sub">Vue d'ensemble des Fiches Événements</div>
        </div>
        {loading && <span className="badge badgeGray">Chargement…</span>}
      </div>

      {/* KPI */}
      <div className="grid4" style={{ marginBottom: 20 }}>
        <StatCard label="Total FE"          value={g.total?.toLocaleString("fr-FR")           || "—"} sub="Toutes les fiches événements" />
        <StatCard label="FE Traitées"       value={g.traitees?.toLocaleString("fr-FR")        || "—"} sub={`${pct(g.traitees, g.total)}% du total`}   accent="var(--green)" />
        <StatCard label="FE En cours"       value={g.en_cours?.toLocaleString("fr-FR")        || "—"} sub={`${pct(g.en_cours, g.total)}% du total`}   accent="var(--amber)" />
        <StatCard label="Articles distincts"value={g.articles_distincts?.toLocaleString("fr-FR")||"—"} sub="Références uniques"                        accent="var(--blue)" />
      </div>

      {/* Navigation */}
      <div className="grid4" style={{ marginBottom: 20 }}>
        {NAV_ITEMS.map(({ to, title, sub, accent }) => (
          <Link
            key={to}
            to={to}
            className="navCard"
            style={accent ? { borderColor: "var(--primary)" } : {}}
          >
            <div className="navCard__title" style={accent ? { color: "var(--primary)" } : {}}>{title}</div>
            <div className="navCard__sub">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Stats détail */}
      <div className="grid2">
        {byType.length > 0 && (
          <div className="panel">
            <div className="panelTitle">FE par type</div>
            <div className="kv">
              {byType.slice(0, 6).map((item) => (
                <div key={item.type} className="kvRow">
                  <div className="kvKey">{item.type || "—"}</div>
                  <div className="kvVal">{item.count} FE</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {byClient.length > 0 && (
          <div className="panel">
            <div className="panelTitle">Top clients</div>
            <div className="kv">
              {byClient.slice(0, 6).map((item) => (
                <div key={item.client} className="kvRow">
                  <div className="kvKey">{item.client || "—"}</div>
                  <div className="kvVal">{item.count} FE</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
