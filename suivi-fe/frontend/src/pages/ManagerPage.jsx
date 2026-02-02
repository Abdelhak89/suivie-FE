// src/pages/ManagerPage.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/app.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// tu peux aussi importer ta liste depuis data/portfolio.js si tu veux
const QUALITICIENS = [
  "BLANQUART Nicolas",
  "BRISDET Trystan",
  "DOBY Sandrine",
  "SANCHEZ WRIGHT Juliette",
  "SDRAULIG Florence",
];

export default function ManagerPage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");

  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [selectedId, setSelectedId] = useState("");

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  );

  const load = async () => {
    const params = new URLSearchParams();
    if (annee) params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    try {
      const r = await fetch(`${API}/manager/fe-unassigned?${params.toString()}`);
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Erreur chargement");
      setItems(d.items || []);
      // si la FE sélectionnée n’existe plus, on reset
      if (selectedId && !(d.items || []).some((x) => x.id === selectedId)) setSelectedId("");
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee, q]);

  const assignSelected = async () => {
    if (!selectedId) return alert("Sélectionne une FE d’abord.");
    if (!target) return alert("Choisis un qualiticien cible.");

    try {
      const r = await fetch(`${API}/manager/assign-fe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feId: selectedId, animateur: target }),
      });
      const d = await r.json();
      if (!d?.ok) throw new Error(d?.error || "Assignation impossible");

      // refresh liste non assignées
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Manager</h2>
          <div className="sub">Assigner une FE à un qualiticien (sans modifier les clients)</div>
        </div>

        <span className="badge badgeBlue">
          {loading ? "Chargement…" : `${items.length} FE non assignées`}
        </span>
      </div>

      <div className="panel">
        <div className="panelTitle">FE non assignées</div>

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
            placeholder="Recherche (N° FE / REF / désignation / lancement...)"
            style={{ minWidth: 320 }}
          />

          <div className="field">
            <span className="label">Assigner à</span>
            <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">— choisir —</option>
              {QUALITICIENS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btnPrimary" onClick={assignSelected} disabled={!selectedId || !target}>
            Assigner la FE sélectionnée
          </button>

          <button className="btn" onClick={load}>
            Rafraîchir
          </button>
        </div>

        <div className="sub" style={{ marginTop: 10 }}>
          {selected ? (
            <>
              FE sélectionnée : <b>{selected.numero_fe || "—"}</b> — {selected.designation || ""}
            </>
          ) : (
            "Clique sur une ligne pour sélectionner une FE."
          )}
        </div>

        <div className="tableWrap" style={{ marginTop: 12 }}>
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
              {items.map((r) => {
                const active = r.id === selectedId;
                return (
                  <tr
                    key={r.id}
                    className={`rowHover ${active ? "rowActive" : ""}`}
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: "pointer" }}
                    title="Cliquer pour sélectionner"
                  >
                    <td className="td">
                      <b>{r.numero_fe || "—"}</b>
                    </td>
                    <td className="td">{r.statut || "—"}</td>
                    <td className="td">{r.code_article || "—"}</td>
                    <td className="td">{r.designation || "—"}</td>
                    <td className="td">{r.code_lancement || "—"}</td>
                    <td className="td">{String(r.date_creation || "").slice(0, 10) || "—"}</td>
                  </tr>
                );
              })}

              {!loading && items.length === 0 ? (
                <tr>
                  <td className="td" colSpan={6}>
                    Aucune FE non assignée (avec ces filtres).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
