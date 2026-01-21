import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ManagerPage() {
  const [loading, setLoading] = useState(true);

  // ✅ filtre année
  const [annee, setAnnee] = useState("2026");

  const [stats, setStats] = useState([]); // /manager/stats
  const [qualiticiens, setQualiticiens] = useState([]); // /qualiticiens

  const [selectedQualiticien, setSelectedQualiticien] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [clientToAdd, setClientToAdd] = useState("");

  // V1 affectation FE : on affiche quelques FE à affecter
  const [feSample, setFeSample] = useState([]);
  const [loadingFe, setLoadingFe] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [q, s] = await Promise.all([
        fetch(`${API}/qualiticiens?annee=${encodeURIComponent(annee)}`).then((r) => r.json()),
        fetch(`${API}/manager/stats?annee=${encodeURIComponent(annee)}`).then((r) => r.json()),
      ]);

      setQualiticiens(q.items || []);
      setStats(s.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  // portefeuille client (indépendant de l'année, mais on le garde ici)
  useEffect(() => {
    if (!selectedQualiticien) {
      setPortfolio([]);
      return;
    }
    fetch(`${API}/portfolio?qualiticien=${encodeURIComponent(selectedQualiticien)}`)
      .then((r) => r.json())
      .then((d) => setPortfolio(d.items || []))
      .catch(() => setPortfolio([]));
  }, [selectedQualiticien]);

  const addClient = async () => {
    if (!selectedQualiticien || !clientToAdd.trim()) return;

    await fetch(`${API}/portfolio/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qualiticien: selectedQualiticien,
        client: clientToAdd.trim(),
      }),
    });

    setClientToAdd("");
    const d = await fetch(
      `${API}/portfolio?qualiticien=${encodeURIComponent(selectedQualiticien)}`
    ).then((r) => r.json());
    setPortfolio(d.items || []);
  };

  const removeClient = async (client) => {
    await fetch(`${API}/portfolio/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qualiticien: selectedQualiticien,
        client,
      }),
    });

    const d = await fetch(
      `${API}/portfolio?qualiticien=${encodeURIComponent(selectedQualiticien)}`
    ).then((r) => r.json());
    setPortfolio(d.items || []);
  };

  // sample FE (filtré par année)
  const loadFeSample = async () => {
    setLoadingFe(true);
    try {
      const d = await fetch(
        `${API}/fe?page=1&pageSize=30&annee=${encodeURIComponent(annee)}`
      ).then((r) => r.json());
      setFeSample(d.items || []);
    } finally {
      setLoadingFe(false);
    }
  };

  useEffect(() => {
    loadFeSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  const assignFe = async (feId, assigned_to) => {
    if (!assigned_to) return;

    await fetch(`${API}/fe/${feId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to }),
    });

    // refresh stats + sample
    await Promise.all([loadAll(), loadFeSample()]);
  };

  const selectedStats = useMemo(() => {
    if (!selectedQualiticien) return null;
    return stats.find((x) => x.animateur === selectedQualiticien) || null;
  }, [selectedQualiticien, stats]);

  const onChangeYear = (v) => {
    // ✅ reset selection pour éviter mismatch
    setAnnee(v);
    setSelectedQualiticien("");
    setPortfolio([]);
    setClientToAdd("");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Manager</h2>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            {loading ? "Chargement..." : `${stats.length} qualiticiens (année ${annee || "toutes"})`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280" }}>Année :</span>
          <select value={annee} onChange={(e) => onChangeYear(e.target.value)} style={selectStyle}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>

          <button onClick={loadAll} style={btnStyle} disabled={loading}>
            ↻ Rafraîchir
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14, marginTop: 16 }}>
        {/* Stats */}
        <Panel title="Stats par qualiticien">
          {loading ? (
            <div style={{ color: "#6b7280" }}>Chargement...</div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <span style={{ color: "#6b7280" }}>Filtrer :</span>
                <select
                  value={selectedQualiticien}
                  onChange={(e) => setSelectedQualiticien(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">— tous —</option>
                  {qualiticiens.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>

                {selectedStats ? (
                  <span style={{ color: "#6b7280", fontSize: 13 }}>
                    Total sélectionné : <b>{selectedStats.total}</b> — À relancer :{" "}
                    <b>{selectedStats.a_relancer}</b>
                  </span>
                ) : null}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280" }}>
                      <th style={th}>Qualiticien</th>
                      <th style={th}>Nouvelles</th>
                      <th style={th}>En cours</th>
                      <th style={th}>Clôturées</th>
                      <th style={th}>Annulées</th>
                      <th style={th}>À relancer</th>
                      <th style={th}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedQualiticien ? stats.filter((s) => s.animateur === selectedQualiticien) : stats).map(
                      (s) => (
                        <tr key={s.animateur}>
                          <td style={td}>
                            <b>{s.animateur}</b>
                          </td>
                          <td style={td}>{s.nouvelles}</td>
                          <td style={td}>{s.en_cours}</td>
                          <td style={td}>{s.cloturees}</td>
                          <td style={td}>{s.annulees}</td>
                          <td style={td}>
                            <b>{s.a_relancer}</b>
                          </td>
                          <td style={td}>{s.total}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>

        {/* Portefeuille */}
        <Panel title="Portefeuille client">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedQualiticien}
              onChange={(e) => setSelectedQualiticien(e.target.value)}
              style={selectStyle}
            >
              <option value="">— choisir un qualiticien —</option>
              {qualiticiens.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            <input
              value={clientToAdd}
              onChange={(e) => setClientToAdd(e.target.value)}
              placeholder="Ajouter un client"
              style={inputStyle}
              disabled={!selectedQualiticien}
            />
            <button onClick={addClient} style={btnStyle} disabled={!selectedQualiticien}>
              + Ajouter
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            {!selectedQualiticien ? (
              <div style={{ color: "#6b7280" }}>Sélectionne un qualiticien.</div>
            ) : portfolio.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucun client affecté.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {portfolio.map((c) => (
                  <div key={c} style={chipRow}>
                    <span>{c}</span>
                    <button style={chipBtn} onClick={() => removeClient(c)}>
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Affectation FE */}
      <div style={{ marginTop: 14 }}>
        <Panel title="Affecter une FE">
          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
            V1 : affectation simple FE → qualiticien. (Année : {annee || "toutes"})
          </div>

          {loadingFe ? (
            <div style={{ color: "#6b7280" }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280" }}>
                    <th style={th}>N° FE</th>
                    <th style={th}>Statut</th>
                    <th style={th}>Animateur</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feSample.map((r) => (
                    <AssignRow key={r.id} row={r} qualiticiens={qualiticiens} onAssign={assignFe} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function AssignRow({ row, qualiticiens, onAssign }) {
  const [to, setTo] = useState("");

  return (
    <tr>
      <td style={td}>
        <b>{row.numero_fe || "—"}</b>
      </td>
      <td style={td}>{row.statut || "—"}</td>
      <td style={td}>{row.animateur || "—"}</td>
      <td style={td}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={to} onChange={(e) => setTo(e.target.value)} style={selectStyle}>
            <option value="">— choisir —</option>
            {qualiticiens.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          <button style={btnStyle} onClick={() => onAssign(row.id, to)} disabled={!to}>
            Affecter
          </button>
        </div>
      </td>
    </tr>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 14 }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

const th = { padding: "10px 8px", borderBottom: "1px solid var(--border)" };
const td = { padding: "10px 8px", borderBottom: "1px solid #f0f0f3" };

const btnStyle = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  cursor: "pointer",
};

const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  minWidth: 220,
  background: "white",
};

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
  minWidth: 180,
};

const chipRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "8px 10px",
};

const chipBtn = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "white",
  cursor: "pointer",
};
