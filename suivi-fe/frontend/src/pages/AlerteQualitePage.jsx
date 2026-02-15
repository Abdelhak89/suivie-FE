// src/pages/AlerteQualitePage.jsx - VERSION ADAPTÉE
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero, exportAlerteQualite } from "../services/feApi.js";
import "../styles/app.css";

function getDescFromFe(fe) {
  const data = fe?.data;
  if (!data || typeof data !== "object") return "";
  return (
    data["Details de l'anomalie"] ||
    data["Détails de l'anomalie"] ||
    data["Detail de l'anomalie"] ||
    data["Détail de l'anomalie"] ||
    ""
  );
}

function toIsoShort(v) {
  if (!v) return "";
  const s = String(v).trim();
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

export default function AlerteQualitePage() {
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
          limit: 200,
          offset: 0
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

  const options = useMemo(
    () => filteredItems.filter(x => x?.numero_fe).map(x => ({ 
      numero_fe: x.numero_fe,
      designation: x.designation || ""
    })),
    [filteredItems]
  );

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

  const handleExport = async () => {
    if (!selectedNumero) return;
    
    setExportLoading(true);
    setExportSuccess(false);
    
    try {
      const result = await exportAlerteQualite(selectedNumero);
      
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

  const descPreview = selectedFe?.loading || selectedFe?.error ? "" : getDescFromFe(selectedFe);

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Alerte qualité</h2>
          <div className="sub">{loading ? "chargement..." : `${options.length} FE`}</div>
        </div>
        <span className="badge badgeBlue">Export XLSX</span>
      </div>

      <div className="toolbar">
        <div className="field">
          <span className="label">Année :</span>
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
          style={{ maxWidth: 520 }}
        />

        <select 
          className="selectWide select" 
          value={selectedNumero} 
          onChange={(e) => onSelectChange(e.target.value)}
        >
          <option value="">— Choisir une FE —</option>
          {options.map((o) => (
            <option key={o.numero_fe} value={o.numero_fe}>
              {o.numero_fe} {o.designation ? `— ${o.designation.slice(0, 40)}` : ""}
            </option>
          ))}
        </select>

        <button 
          className="btn btnDark" 
          onClick={handleExport} 
          disabled={!selectedNumero || exportLoading}
        >
          {exportLoading ? "Génération..." : exportSuccess ? "✅ Généré" : "Générer .xlsx"}
        </button>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedNumero ? (
          <div className="sub">Choisis une FE pour afficher l'aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div style={{ color: "#b91c1c", fontWeight: 800 }}>{selectedFe.error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>N° FE</div>
            <div>{selectedFe?.numero_fe || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>REF</div>
            <div>{selectedFe?.code_article || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Désignation</div>
            <div>{selectedFe?.designation || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Lancement</div>
            <div>{selectedFe?.code_lancement || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Date</div>
            <div>{toIsoShort(selectedFe?.date_creation || "") || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Lieu détection</div>
            <div>{selectedFe?.lieu_detection || "—"}</div>
            
            <div style={{ fontWeight: 900 }}>Description</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{descPreview || "—"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
