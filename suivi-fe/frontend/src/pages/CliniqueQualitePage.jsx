import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function CliniqueQualitePage() {
  const [annee, setAnnee] = useState("2026");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedFe, setSelectedFe] = useState(null);

  // champs manuels (V1)
  const [qualiticien, setQualiticien] = useState("");
  const [participants, setParticipants] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ page: "1", pageSize: "200" });
    if (annee) params.set("annee", annee);
    if (q.trim()) params.set("q", q.trim());

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((e) => {
        if (e?.name !== "AbortError") console.error(e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee, q]);

  const options = useMemo(() => {
    return (items || [])
      .filter((x) => x?.numero_fe)
      .map((x) => ({ id: x.id, numero_fe: x.numero_fe }));
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

  const downloadPptx = () => {
    if (!selectedId) return;
    const params = new URLSearchParams();
    if (qualiticien.trim()) params.set("qualiticien", qualiticien.trim());
    if (participants.trim()) params.set("participants", participants.trim());

    window.open(
      `${API}/exports/clinique-qualite/${selectedId}.pptx?${params.toString()}`,
      "_blank"
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Clinique Qualité (A3 DMAIC)</h2>
        <span style={{ color: "#6b7280" }}>
          {loading ? "chargement..." : `${options.length} FE`}
        </span>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Année :</span>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={selectStyle}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>
        </label>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (N° FE / REF / désignation / lancement...)"
          style={inputStyle}
        />

        <select value={selectedId} onChange={(e) => onSelectChange(e.target.value)} style={selectStyleWide}>
          <option value="">— Choisir une FE —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.numero_fe}
            </option>
          ))}
        </select>

        <button
          onClick={downloadPptx}
          disabled={!selectedId}
          style={{
            ...btnStyle,
            background: selectedId ? "#111827" : "#e5e7eb",
            color: selectedId ? "white" : "#6b7280",
            borderColor: selectedId ? "#111827" : "#e5e7eb",
          }}
        >
          Générer .pptx
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}>
          <div style={label}>Qualiticien</div>
          <input
            value={qualiticien}
            onChange={(e) => setQualiticien(e.target.value)}
            placeholder="Ex: Abdel, Safia..."
            style={inputStyleFull}
          />
        </div>

        <div style={card}>
          <div style={label}>Participants (une ligne = une personne)</div>
          <textarea
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder={"Nom Prénom\nNom Prénom\n..."}
            style={textareaStyle}
          />
        </div>
      </div>

      {/* Aperçu FE */}
      <div style={{ marginTop: 12, ...card }}>
        {!selectedId ? (
          <div style={{ color: "#6b7280" }}>Choisis une FE pour voir l’aperçu (date / client / description).</div>
        ) : selectedFe?.loading ? (
          <div style={{ color: "#6b7280" }}>Chargement FE…</div>
        ) : selectedFe?.error ? (
          <div style={{ color: "#b91c1c" }}>{selectedFe.error}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>N° FE</div><div>{selectedFe?.numero_fe || "—"}</div>
            <div style={{ fontWeight: 700 }}>REF</div><div>{selectedFe?.code_article || "—"}</div>
            <div style={{ fontWeight: 700 }}>Date création</div><div>{String(selectedFe?.date_creation || "").slice(0, 10) || "—"}</div>
            <div style={{ fontWeight: 700 }}>Désignation</div><div>{selectedFe?.designation || "—"}</div>
            <div style={{ fontWeight: 700 }}>Description FE</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {selectedFe?.data?.["Details de l'anomalie"] ||
               selectedFe?.data?.["Détails de l'anomalie"] ||
               selectedFe?.designation ||
               "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "white",
  cursor: "pointer",
};

const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  minWidth: 320,
  background: "white",
};

const inputStyleFull = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  width: "100%",
  background: "white",
};

const textareaStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  width: "100%",
  background: "white",
  minHeight: 90,
  resize: "vertical",
};

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
};

const selectStyleWide = {
  ...selectStyle,
  minWidth: 220,
};

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  background: "white",
};

const label = {
  color: "#6b7280",
  fontSize: 12,
  marginBottom: 6,
};
