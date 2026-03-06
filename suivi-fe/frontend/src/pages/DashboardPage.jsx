// src/pages/DashboardPage.jsx — Style Apple
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStats } from "../services/feApi.js";
import { injectGlobalCSS, T } from "../styles/appleTokens.js";

const NAV_ITEMS = [
  { to: "/declaration-fe",   title: "Nouvelle FE",      sub: "Déclarer une NC",            icon: "➕", accent: true },
  { to: "/interne-serie",    title: "Interne Série",    sub: "NC internes série",          icon: "🔧" },
  { to: "/interne-fai",      title: "Interne FAI",      sub: "Fiches DVI / FAI",           icon: "📋" },
  { to: "/client",           title: "Client",           sub: "Réclamations NC clients",    icon: "👥" },
  { to: "/fournisseur",      title: "Fournisseur",      sub: "NC fournisseurs",            icon: "📦" },
  { to: "/kpi",              title: "KPI",              sub: "Pareto, tendances",          icon: "📊" },
  { to: "/alerte-qualite",   title: "Alerte Qualité",   sub: "Export XLSX",                icon: "🚨" },
  { to: "/clinique-qualite", title: "Clinique Qualité", sub: "A3 DMAIC — PPT",             icon: "🏥" },
  { to: "/derogation",       title: "Dérogation",       sub: "Export XLSX dérogation",     icon: "📝" },
];

const DASH_CSS = `
.dash-stat {
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 18px 20px;
  box-shadow: ${T.shadow};
}
.dash-stat-accent {
  display: inline-block;
  width: 4px;
  height: 30px;
  border-radius: 2px;
  margin-right: 12px;
  vertical-align: middle;
  flex-shrink: 0;
}
.dash-nav {
  display: block;
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.r};
  padding: 16px 18px;
  box-shadow: ${T.shadow};
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: box-shadow .15s, border-color .15s, transform .12s;
}
.dash-nav:hover {
  box-shadow: ${T.shadowMd};
  border-color: rgba(0,0,0,.16);
  transform: translateY(-1px);
}
.dash-nav.accent { border-color: ${T.accent}; background: rgba(0,113,227,.04); }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectGlobalCSS();
    if (!document.getElementById("dash-styles")) {
      const s = document.createElement("style"); s.id = "dash-styles"; s.textContent = DASH_CSS; document.head.appendChild(s);
    }
    getStats().then(setStats).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const g        = stats?.global   || {};
  const byType   = stats?.by_type  || [];
  const byClient = stats?.by_client|| [];
  const pct      = (n, t) => t ? Math.round((n/t)*100) : 0;

  const STATS = [
    { label: "Total FE",           value: g.total?.toLocaleString("fr-FR")||"—",            sub: "Toutes les fiches", color: T.accent },
    { label: "FE Traitées",        value: g.traitees?.toLocaleString("fr-FR")||"—",         sub: `${pct(g.traitees,g.total)}% du total`, color: T.green },
    { label: "FE En cours",        value: g.en_cours?.toLocaleString("fr-FR")||"—",         sub: `${pct(g.en_cours,g.total)}% du total`, color: T.orange },
    { label: "Articles distincts", value: g.articles_distincts?.toLocaleString("fr-FR")||"—", sub: "Références uniques", color: T.blue },
  ];

  return (
    <div style={{ fontFamily: T.font, padding: 24, background: T.bg, minHeight: "100vh" }}>

      {/* Header */}
      <div className="ap-page-head" style={{ marginBottom: 24 }}>
        <div>
          <div className="ap-h1">Dashboard Qualité</div>
          <div className="ap-sub">Vue d'ensemble des Fiches Événements</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {loading && <span className="ap-badge ap-badge-gray">Chargement…</span>}
          <button className="ap-btn ap-btn-primary" onClick={() => navigate("/declaration-fe")}>＋ Nouvelle FE</button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} className="dash-stat">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div className="dash-stat-accent" style={{ background: s.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecond, textTransform: "uppercase", letterSpacing: ".4px" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 800, color: T.textPrimary, letterSpacing: "-.5px", fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: T.textLight, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Navigation modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {NAV_ITEMS.map(({ to, title, sub, icon, accent }) => (
          <Link key={to} to={to} className={`dash-nav ${accent ? "accent" : ""}`}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 14, color: accent ? T.accent : T.textPrimary, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: T.textSecond }}>{sub}</div>
          </Link>
        ))}
      </div>

      {/* Détail stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {byType.length > 0 && (
          <div className="ap-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecond, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>FE par type</div>
            {byType.slice(0, 6).map(item => (
              <div key={item.type} className="ap-kv-row">
                <div className="ap-kv-key">{item.type||"—"}</div>
                <div className="ap-kv-val">{item.count} FE</div>
              </div>
            ))}
          </div>
        )}
        {byClient.length > 0 && (
          <div className="ap-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecond, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>Top clients</div>
            {byClient.slice(0, 6).map(item => (
              <div key={item.client} className="ap-kv-row">
                <div className="ap-kv-key">{item.client||"—"}</div>
                <div className="ap-kv-val">{item.count} FE</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}