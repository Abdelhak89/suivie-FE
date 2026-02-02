import { useEffect, useMemo, useState } from "react";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DerogationPage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee, q]);

  const options = useMemo(() => {
    return (items || [])
      .filter((x) => x?.numero_fe)
      .map((x) => ({
        id: x.id,
        numero_fe: x.numero_fe,
        desc: (x?.data && (x.data["Details de l'anomalie"] || x.data["Détails de l'anomalie"])) || "",
      }));
  }, [items]);

  const loadFe = async (id) => {
    if (!id) return;
    setSelectedFe({ loading: true });
    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedFe(d);
    } catch {
      setSelectedFe({ error: "Impossible de charger la FE" });
    }
  };

  const onSelectChange = (val) => {
    setSelectedId(val);
    loadFe(val);
  };

  const openXlsx = () => {
    if (!selectedId) return;
    window.open(`${API}/exports/derogation/${selectedId}.xlsx`, "_blank");
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

          <select className="selectWide" value={selectedId} onChange={(e) => onSelectChange(e.target.value)}>
            <option value="">— Choisir une FE —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero_fe}{o.desc ? ` — ${o.desc.slice(0, 40)}${o.desc.length > 40 ? "…" : ""}` : ""}
              </option>
            ))}
          </select>

          <button className="btn btnDark" onClick={openXlsx} disabled={!selectedId}>
            Générer .xlsx
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {!selectedId ? (
          <div className="sub">Choisis une FE pour afficher l’aperçu.</div>
        ) : selectedFe?.loading ? (
          <div className="sub">Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div className="sub" style={{ color: "#b91c1c" }}>{selectedFe.error}</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <tbody>
                <tr><td className="th">N° FE</td><td className="td">{selectedFe?.numero_fe || "—"}</td></tr>
                <tr><td className="th">REF</td><td className="td">{selectedFe?.code_article || "—"}</td></tr>
                <tr><td className="th">Désignation</td><td className="td">{selectedFe?.designation || "—"}</td></tr>
                <tr><td className="th">Lancement</td><td className="td">{selectedFe?.code_lancement || "—"}</td></tr>
                <tr><td className="th">Date (ISO)</td><td className="td">{selectedFe?.date_creation || "—"}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
