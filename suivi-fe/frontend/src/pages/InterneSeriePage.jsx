// src/pages/InterneSeriePage.jsx - Page Interne Série (CINT)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllFE } from "../services/feApi.js";

export default function InterneSeriePage() {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("En cours");
  const [annee, setAnnee] = useState("2026");

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          q: q.trim() || null,
          statut: statut || null,
          origine: "CINT", // ✅ CORRIGÉ : Client Interne
          annee: annee || null,
          limit: pageSize,
          offset: (page - 1) * pageSize
        });
        
        if (!ctrl.signal.aborted) {
          setItems(result.items || []);
          setTotal(result.total || 0);
        }
      } catch (error) {
        if (!ctrl.signal.aborted) {
          console.error("Erreur chargement FE Internes:", error);
          alert("Erreur lors du chargement des FE");
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => ctrl.abort();
  }, [q, statut, annee, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Interne Série</h2>
          <div style={{ color: "#666", marginTop: 4 }}>
            {loading ? "Chargement..." : `${total} FE internes trouvées`}
          </div>
        </div>
        <span style={{
          padding: "6px 12px",
          borderRadius: 8,
          background: "#dbeafe",
          color: "#1e40af",
          fontSize: 12,
          fontWeight: 700
        }}>
          CINT - Client Interne
        </span>
      </div>

      {/* Filtres */}
      <div style={{ 
        display: "flex", 
        gap: 10, 
        marginBottom: 16, 
        flexWrap: "wrap",
        padding: 14,
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12
      }}>
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="🔍 Recherche (N° FE / REF / Désignation / Lancement...)"
          style={{ 
            padding: 10, 
            minWidth: 360,
            border: "1px solid #e5e7eb",
            borderRadius: 8
          }}
        />
        
        <select 
          value={annee} 
          onChange={(e) => { setPage(1); setAnnee(e.target.value); }}
          style={{ 
            padding: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 8
          }}
        >
          <option value="">Toutes les années</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
        
        <select 
          value={statut} 
          onChange={(e) => { setPage(1); setStatut(e.target.value); }}
          style={{ 
            padding: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            minWidth: 150,
            fontWeight: statut === "En cours" ? 700 : 400
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="En cours">⚠️ En cours</option>
          <option value="Traitée">✅ Traitée</option>
        </select>

        <button
          onClick={() => {
            setQ("");
            setStatut("En cours");
            setAnnee("2026");
            setPage(1);
          }}
          style={{
            padding: "10px 16px",
            border: "1px solid #111827",
            borderRadius: 8,
            background: "#111827",
            color: "white",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Tableau */}
      <div style={{ 
        overflowX: "auto",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12
      }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          fontSize: 13
        }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>N° FE</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Statut</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Date</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Code Article</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Désignation</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Lancement</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}>Détection</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Qté NC</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>Qté Produite</th>
            </tr>
          </thead>
          <tbody>
            {items.map((fe, idx) => (
              <tr 
                key={fe.numero_fe || idx} 
                style={{ 
                  borderBottom: "1px solid #f3f4f6",
                  background: idx % 2 === 0 ? "white" : "#fafafa"
                }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <Link 
                    to={`/fe/${fe.numero_fe}`}
                    style={{ 
                      color: "#2563eb", 
                      textDecoration: "none",
                      fontWeight: 600
                    }}
                  >
                    {fe.numero_fe || "(vide)"}
                  </Link>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: fe.statut === "Traitée" ? "#dcfce7" : "#fef3c7",
                    color: fe.statut === "Traitée" ? "#166534" : "#92400e"
                  }}>
                    {fe.statut || "—"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                  {fe.date_creation ? new Date(fe.date_creation).toLocaleDateString('fr-FR') : "—"}
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{fe.code_article || "—"}</td>
                <td style={{ padding: "12px 16px", maxWidth: 300 }}>
                  {fe.designation ? (
                    <span title={fe.designation}>
                      {fe.designation.length > 50 
                        ? fe.designation.slice(0, 50) + "..." 
                        : fe.designation}
                    </span>
                  ) : "—"}
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{fe.code_lancement || "—"}</td>
                <td style={{ padding: "12px 16px" }}>{fe.lieu_detection || "—"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
                  {fe.qte_estimee ? Number(fe.qte_estimee).toLocaleString('fr-FR') : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
                  {fe.qte_produite ? Number(fe.qte_produite).toLocaleString('fr-FR') : "—"}
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td 
                  colSpan="9" 
                  style={{ 
                    textAlign: "center", 
                    padding: 40,
                    color: "#9ca3af"
                  }}
                >
                  Aucune FE interne trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ 
        display: "flex", 
        gap: 10, 
        alignItems: "center", 
        justifyContent: "center",
        marginTop: 16 
      }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page <= 1}
          style={{
            padding: "8px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: page <= 1 ? "#f3f4f6" : "white",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          ← Précédent
        </button>
        
        <span style={{ color: "#6b7280", fontWeight: 600 }}>
          Page {page} / {pages} ({total} résultats)
        </span>
        
        <button 
          onClick={() => setPage(p => Math.min(pages, p + 1))} 
          disabled={page >= pages}
          style={{
            padding: "8px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: page >= pages ? "#f3f4f6" : "white",
            cursor: page >= pages ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}