// src/pages/AllFePage.jsx - VERSION ADAPTÉE
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import FeDrawer from "../components/FeDrawer.jsx";
import "../styles/app.css";

export default function AllFePage() {
  const [sp] = useSearchParams();
  const annee = sp.get("annee") ?? "2026";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          annee: annee || null,
          limit: 200
        });
        
        if (!ctrl.signal.aborted) {
          setItems(result.items || []);
          setTotal(result.total || 0);
        }
      } catch (error) {
        if (!ctrl.signal.aborted) {
          console.error("Erreur chargement FE:", error);
          setItems([]);
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => ctrl.abort();
  }, [annee]);

  const openDetail = async (numeroFE) => {
    setDrawerOpen(true);
    setSelectedRecord({ 
      numero_fe: numeroFE, 
      statut: "", 
      data: { Chargement: "..." } 
    });
    
    try {
      const fe = await getFEByNumero(numeroFE);
      setSelectedRecord(fe);
    } catch (error) {
      setSelectedRecord({ 
        numero_fe: numeroFE, 
        statut: "", 
        data: { Erreur: String(error) } 
      });
    }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Toutes les FE</h2>
          <div className="sub">Année : <b>{annee || "toutes"}</b></div>
        </div>
        <span className="badge badgeBlue">
          {loading ? "Chargement…" : `${total} FE`}
        </span>
      </div>

      <div className="panel">
        {loading ? (
          <div className="sub">Chargement…</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">N° FE</th>
                  <th className="th">Statut</th>
                  <th className="th">REF</th>
                  <th className="th">Désignation</th>
                  <th className="th">Lancement</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr 
                    key={r.numero_fe} 
                    className="rowHover" 
                    onMouseDown={() => openDetail(r.numero_fe)} 
                    style={{ cursor: "pointer" }}
                  >
                    <td className="td"><b>{r.numero_fe || "—"}</b></td>
                    <td className="td">
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: r.statut === "Traitée" ? "#dcfce7" : "#fef3c7",
                        color: r.statut === "Traitée" ? "#166534" : "#92400e"
                      }}>
                        {r.statut || "—"}
                      </span>
                    </td>
                    <td className="td">{r.code_article || "—"}</td>
                    <td className="td">{r.designation || "—"}</td>
                    <td className="td">{r.code_lancement || "—"}</td>
                    <td className="td">
                      {r.date_creation 
                        ? new Date(r.date_creation).toLocaleDateString('fr-FR')
                        : "—"}
                    </td>
                  </tr>
                ))}
                {!items.length && !loading && (
                  <tr>
                    <td className="td" colSpan={6} style={{ textAlign: "center", color: "#9ca3af" }}>
                      Aucune FE trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        record={selectedRecord} 
      />
    </div>
  );
}
