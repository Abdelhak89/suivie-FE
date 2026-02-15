// src/pages/DerogationPage.jsx - VERSION ADAPTÉE
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero, exportDerogation } from "../services/feApi.js";
import "../styles/app.css";

export default function DerogationPage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedNumero, setSelectedNumero] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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
        }
      } catch (error) {
        if (!ctrl.signal.aborted) {
          console.error("Erreur chargement FE:", error);
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => ctrl.abort();
  }, [annee, q]);

  const filteredItems = useMemo(() => {
    if (!q.trim()) return items;
    const search = q.toLowerCase();
    return items.filter(fe => 
      fe.numero_fe?.toLowerCase().includes(search) ||
      fe.code_article?.toLowerCase().includes(search) ||
      fe.designation?.toLowerCase().includes(search) ||
      fe.code_lancement?.toLowerCase().includes(search)
    );
  }, [items, q]);

  const options = useMemo(() => {
    return filteredItems
      .filter((x) => x?.numero_fe)
      .map((x) => ({
        numero_fe: x.numero_fe,
        desc: (x?.data && (x.data["Details de l'anomalie"] || x.data["Détails de l'anomalie"])) || x.designation || "",
      }));
  }, [filteredItems]);

  const loadFe = async (numeroFE) => {
    if (!numeroFE) return;
    setSelectedFe({ loading: true });
    setExportSuccess(false);
    
    try {
      const fe = await getFEByNumero(numeroFE);
      setSelectedFe(fe);
    } catch (error) {
      setSelectedFe({ error: "Impossible de charger la FE" });
    }
  };

  const onSelectChange = (val) => {
    setSelectedNumero(val);
    loadFe(val);
  };

  const openXlsx = async () => {
    if (!selectedNumero) return;
    
    setExportLoading(true);
    setExportSuccess(false);
    
    try {
      const result = await exportDerogation(selectedNumero);
      
      setExportSuccess(true);
      alert(`Export créé avec succès !\n\nFichier : ${result.filename}\nChemin : ${result.path}`);
      
      // Auto-reset après 3 secondes
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Erreur export:", error);
      alert(`Erreur lors de l'export : ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Dérogation</h2>
          <div className="sub">{loading ? "Chargement…" : `${options.length} FE`}</div>
        </div>
        <span className="badge badgeBlue">Export XLSX</span>
      </div>

      <div className="panel">
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

          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (N° FE / REF / désignation / lancement...)"
            style={{ minWidth: 320 }}
          />

          <select 
            className="selectWide" 
            value={selectedNumero} 
            onChange={(e) => onSelectChange(e.target.value)}
          >
            <option value="">— Choisir une FE —</option>
            {options.map((o) => (
              <option key={o.numero_fe} value={o.numero_fe}>
                {o.numero_fe}{o.desc ? ` — ${o.desc.slice(0, 40)}${o.desc.length > 40 ? "…" : ""}` : ""}
              </option>
            ))}
          </select>

          <button 
            className="btn btnDark" 
            onClick={openXlsx} 
            disabled={!selectedNumero || exportLoading}
          >
            {exportLoading ? "Génération..." : exportSuccess ? "✅ Généré" : "Générer .xlsx"}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedNumero ? (
          <div className="sub">Choisis une FE pour afficher l'aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div className="sub" style={{ color: "#b91c1c" }}>{selectedFe.error}</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <tbody>
                <tr>
                  <td className="th">N° FE</td>
                  <td className="td">{selectedFe?.numero_fe || "—"}</td>
                </tr>
                <tr>
                  <td className="th">REF</td>
                  <td className="td">{selectedFe?.code_article || "—"}</td>
                </tr>
                <tr>
                  <td className="th">Désignation</td>
                  <td className="td">{selectedFe?.designation || "—"}</td>
                </tr>
                <tr>
                  <td className="th">Lancement</td>
                  <td className="td">{selectedFe?.code_lancement || "—"}</td>
                </tr>
                <tr>
                  <td className="th">Date (ISO)</td>
                  <td className="td">{selectedFe?.date_creation || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
