// src/pages/ManagerPage.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const QUALITICIENS = [
  "BLANQUART Nicolas", "BRISDET Trystan", "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette", "SDRAULIG Florence",
];

export default function ManagerPage() {
  const [annee,      setAnnee]      = useState("2026");
  const [q,          setQ]          = useState("");
  const [target,     setTarget]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [items,      setItems]      = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const selected = useMemo(() => items.find((x) => x.id === selectedId) || null, [items, selectedId]);

  const load = async () => {
    const params = new URLSearchParams();
    if (annee)    params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    try {
      const r = await fetch(`${API}/manager/fe-unassigned?${params}`);
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Erreur");
      setItems(d.items || []);
      if (selectedId && !(d.items || []).some((x) => x.id === selectedId)) setSelectedId("");
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [annee, q]); // eslint-disable-line

  const assign = async () => {
    if (!selectedId) return alert("Sélectionne une FE.");
    if (!target)     return alert("Choisis un qualiticien.");
    try {
      const r = await fetch(`${API}/manager/assign-fe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feId: selectedId, animateur: target }),
      });
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Erreur");
      await load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Manager</h2>
          <div className="sub">Assigner des FE non assignées à un qualiticien</div>
        </div>
        <span className="badge badgeBlue">{loading ? "Chargement…" : `${items.length} FE non assignées`}</span>
      </div>

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

        <input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" />

        <div className="field">
          <span className="label">Assigner à</span>
          <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">— choisir —</option>
            {QUALITICIENS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="btn btnDark" onClick={assign} disabled={!selectedId || !target}>Assigner la FE</button>
        <button className="btn" onClick={load}>Rafraîchir</button>
      </div>

      {selected && (
        <div className="panel" style={{ marginBottom: 14, background: "var(--blueBg)", borderColor: "var(--primaryLight)" }}>
          <span style={{ fontWeight: 700, color: "var(--primary)" }}>FE sélectionnée : </span>
          {selected.numero_fe || "—"} — {selected.designation || ""}
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <div className="tableWrap" style={{ border: "none", borderRadius: "var(--r-xl)" }}>
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
                  key={r.id}
                  className="rowHover"
                  onClick={() => setSelectedId(r.id)}
                  style={{ background: r.id === selectedId ? "var(--primaryLight)" : undefined }}
                >
                  <td className="td"><b>{r.numero_fe || "—"}</b></td>
                  <td className="td">{r.statut || "—"}</td>
                  <td className="td mono">{r.code_article || "—"}</td>
                  <td className="td">{r.designation || "—"}</td>
                  <td className="td mono">{r.code_lancement || "—"}</td>
                  <td className="td">{String(r.date_creation || "").slice(0, 10) || "—"}</td>
                </tr>
              ))}
              {!loading && !items.length && (
                <tr><td className="td" colSpan={6} style={{ color: "var(--inkFaint)", textAlign: "center", padding: 24 }}>Aucune FE non assignée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
