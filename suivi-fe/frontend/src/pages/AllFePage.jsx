import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FeDrawer from "../components/FeDrawer.jsx";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AllFePage() {
  const [sp] = useSearchParams();
  const annee = sp.get("annee") ?? "2026";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee]);

  const openDetail = async (id) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: "", statut: "", data: { Chargement: "..." } });
    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedRecord(d);
    } catch (e) {
      setSelectedRecord({ numero_fe: "", statut: "", data: { Erreur: String(e) } });
    }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Toutes les FE</h2>
          <div className="sub">Année : <b>{annee || "toutes"}</b></div>
        </div>
        <span className="badge badgeBlue">{loading ? "Chargement…" : `${items.length} FE`}</span>
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
                  <tr key={r.id} className="rowHover" onMouseDown={() => openDetail(r.id)} style={{ cursor: "pointer" }}>
                    <td className="td"><b>{r.numero_fe || "—"}</b></td>
                    <td className="td">{r.statut || "—"}</td>
                    <td className="td">{r.code_article || "—"}</td>
                    <td className="td">{r.designation || "—"}</td>
                    <td className="td">{r.code_lancement || "—"}</td>
                    <td className="td">{String(r.date_creation || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </div>
  );
}
