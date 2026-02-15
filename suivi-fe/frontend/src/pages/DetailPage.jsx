// src/pages/DetailPage.jsx - VERSION ADAPTÉE
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFEByNumero } from "../services/feApi.js";

export default function DetailPage() {
  const { id } = useParams(); // id = numero_fe
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFE = async () => {
      setLoading(true);
      try {
        const fe = await getFEByNumero(id);
        setItem(fe);
      } catch (error) {
        console.error("Erreur chargement FE:", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    loadFE();
  }, [id]);

  const entries = useMemo(() => {
    const data = item?.data || {};
    return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  }, [item]);

  if (loading) {
    return (
      <div className="page">
        <div className="card">Chargement...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <div className="card">
          <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: 12 }}>
            Fiche Événement introuvable
          </div>
          <Link className="btn" to="/" style={{ textDecoration: "none", display: "inline-flex" }}>
            ← Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h2 className="pageTitle">FE {item.numero_fe || "(vide)"}</h2>
          <div className="pageSubtitle">
            Statut : <b>{item.statut || "—"}</b>
          </div>
        </div>

        <Link 
          className="btn" 
          to="/" 
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
        >
          ← Retour
        </Link>
      </div>

      {/* Informations principales */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardTitle">Informations principales</div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ fontWeight: 700 }}>N° FE</div>
          <div>{item.numero_fe || "—"}</div>

          <div style={{ fontWeight: 700 }}>Code Article</div>
          <div>{item.code_article || "—"}</div>

          <div style={{ fontWeight: 700 }}>Désignation</div>
          <div>{item.designation || "—"}</div>

          <div style={{ fontWeight: 700 }}>Code Lancement</div>
          <div>{item.code_lancement || "—"}</div>

          <div style={{ fontWeight: 700 }}>Date création</div>
          <div>
            {item.date_creation 
              ? new Date(item.date_creation).toLocaleDateString('fr-FR')
              : "—"}
          </div>

          <div style={{ fontWeight: 700 }}>Origine</div>
          <div>{item.origine || "—"}</div>

          <div style={{ fontWeight: 700 }}>Type NC</div>
          <div>{item.type_nc || "—"}</div>

          <div style={{ fontWeight: 700 }}>Qté Non Conforme</div>
          <div>{item.qte_non_conforme || "—"}</div>

          <div style={{ fontWeight: 700 }}>Statut</div>
          <div>
            <span style={{
              padding: "4px 10px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: item.statut === "Traitée" ? "#dcfce7" : "#fef3c7",
              color: item.statut === "Traitée" ? "#166534" : "#92400e"
            }}>
              {item.statut || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Toutes les colonnes (DATA) */}
      <div className="card">
        <div className="cardTitle">Toutes les colonnes (DATA)</div>

        <div className="tableWrap">
          <table className="table">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="trHover">
                  <td className="td" style={{ width: 360, fontWeight: 900 }}>{k}</td>
                  <td className="td">{String(v ?? "")}</td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td className="td" colSpan={2} style={{ textAlign: "center", color: "#9ca3af" }}>
                    Aucune donnée supplémentaire
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
