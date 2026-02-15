// src/pages/DashboardPage.jsx - VERSION ADAPTÉE
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../services/feApi.js";
import "../styles/app.css";

function StatCard({ title, value, subtitle, color = "#111827" }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color, marginBottom: 4 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Dashboard</h2>
        <div style={{ color: "#6b7280", marginTop: 12 }}>Chargement des statistiques...</div>
      </div>
    );
  }

  const global = stats?.global || {};
  const byType = stats?.by_type || [];
  const byClient = stats?.by_client || [];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard Qualité</h2>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            Vue d'ensemble des Fiches Événements
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <StatCard
          title="Total FE"
          value={global.total?.toLocaleString("fr-FR") || "0"}
          subtitle="Toutes les fiches événements"
          color="#111827"
        />
        
        <StatCard
          title="FE Traitées"
          value={global.traitees?.toLocaleString("fr-FR") || "0"}
          subtitle={`${global.total ? Math.round((global.traitees / global.total) * 100) : 0}% du total`}
          color="#16a34a"
        />
        
        <StatCard
          title="FE En cours"
          value={global.en_cours?.toLocaleString("fr-FR") || "0"}
          subtitle={`${global.total ? Math.round((global.en_cours / global.total) * 100) : 0}% du total`}
          color="#ea580c"
        />
        
        <StatCard
          title="Articles distincts"
          value={global.articles_distincts?.toLocaleString("fr-FR") || "0"}
          subtitle="Références uniques"
          color="#2563eb"
        />
      </div>

      {/* Navigation rapide */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <Link
          to="/interne-serie"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Interne Série</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Gérer les non-conformités internes série
          </div>
        </Link>

        <Link
          to="/client"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Client</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Réclamations et NC clients
          </div>
        </Link>

        <Link
          to="/fournisseur"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Fournisseur</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            NC fournisseurs et réclamations
          </div>
        </Link>

        <Link
          to="/kpi"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #2563eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8, color: "#2563eb" }}>
            📊 KPI & Analyses
          </div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Pareto, tendances, drilldown
          </div>
        </Link>

        <Link
          to="/alerte-qualite"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Alerte Qualité</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Générer exports XLSX
          </div>
        </Link>

        <Link
          to="/clinique-qualite"
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Clinique Qualité</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            A3 DMAIC - Générer PPT
          </div>
        </Link>
      </div>

      {/* Statistiques détaillées */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16
      }}>
        {/* Par type */}
        {byType.length > 0 && (
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16
          }}>
            <div style={{ fontWeight: 900, marginBottom: 12 }}>FE par Type</div>
            <div style={{ display: "grid", gap: 8 }}>
              {byType.slice(0, 5).map((item) => (
                <div
                  key={item.type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6"
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.type || "—"}</span>
                  <span style={{ color: "#6b7280" }}>
                    {item.count} FE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Par client */}
        {byClient.length > 0 && (
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16
          }}>
            <div style={{ fontWeight: 900, marginBottom: 12 }}>Top Clients</div>
            <div style={{ display: "grid", gap: 8 }}>
              {byClient.slice(0, 5).map((item) => (
                <div
                  key={item.client}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6"
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.client || "—"}</span>
                  <span style={{ color: "#6b7280" }}>
                    {item.count} FE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
