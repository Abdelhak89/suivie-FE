// src/pages/GenericFePage.jsx
import { useEffect, useMemo, useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import Analyse6MModal from "../components/Analyse6MModal.jsx";
import PlanActionModal from "../components/PlanActionModal.jsx";
import { PAGES } from "../config/fePages.js";
import { getField, getRawField } from "../config/fieldMap.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const D2R_OPTIONS = ["ACCEPTE EN L'ETAT", "ANNULE", "DEROGATION", "N/A", "REBUT", "RETOUCHE"];

function safeJsonParse(s) {
  if (!s) return null;
  if (typeof s === "object") return s;
  try {
    return JSON.parse(String(s));
  } catch {
    return null;
  }
}

function planIsComplete(planRaw) {
  const arr = safeJsonParse(planRaw);
  if (!Array.isArray(arr) || arr.length === 0) return false;

  return arr.every((a) => {
    const textOk = String(a?.text || "").trim().length > 0;
    if (!textOk) return false;
    if (a?.done) return true;
    if (a?.notRealizable && String(a?.note || "").trim()) return true;
    return false;
  });
}

export default function GenericFePage({ pageKey, titleOverride }) {
  const config = PAGES[pageKey] || {
    title: titleOverride ?? pageKey,
    groups: [{ label: "Données", columns: [] }],
  };

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [annee, setAnnee] = useState("2026");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editCtx, setEditCtx] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (q.trim()) params.set("q", q.trim());
    if (annee) params.set("annee", annee);

    fetch(`${API}/fe?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("FETCH /fe ERROR:", e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [pageKey, page, q, annee]);

  const displayedRows = useMemo(() => {
    if (!onlyMissing) return items;
    const cols = config.groups.flatMap((g) => g.columns);
    return items.filter((r) => cols.some((c) => !String(getRawField(r, c) ?? "").trim()));
  }, [onlyMissing, items, config]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openDetail = async (id) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: "", statut: "", data: { Chargement: "..." } });

    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedRecord(d);
    } catch {
      setSelectedRecord({ numero_fe: "", statut: "", data: { Erreur: "Impossible de charger le détail" } });
    }
  };

  const openEditCell = (row, label, rawValue) => {
    const current = rawValue ?? getRawField(row, label) ?? "";

    if (label === "Analyse") {
      setEditCtx({ rowId: row.id, label, current });
      setEditOpen(true);
      return;
    }

    if (label === "Plan d'action") {
      const analyse = String(getRawField(row, "Analyse") || "");
      setEditCtx({ rowId: row.id, label, current, analyse });
      setEditOpen(true);
      return;
    }

    if (label === "D2R") {
      setEditCtx({ rowId: row.id, label, current, mode: "select", options: D2R_OPTIONS });
      setEditOpen(true);
      return;
    }

    setEditCtx({ rowId: row.id, label, current, mode: "text", options: null });
    setEditOpen(true);
  };

  const saveEditCell = async (newValue) => {
    const ctx = editCtx;
    if (!ctx) return;

    const r = await fetch(`${API}/fe/${ctx.rowId}/field`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: ctx.label, value: newValue }),
    });
    const d = await r.json();

    if (!d?.ok) {
      alert(d?.error || "Erreur enregistrement");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id !== ctx.rowId ? x : { ...x, ...d.item })));
    setSelectedRecord((prev) => (!prev || prev.id !== ctx.rowId ? prev : { ...prev, ...d.item }));

    setEditOpen(false);
    setEditCtx(null);
  };

  const canCloseRow = (row) => {
    const planRaw = String(getRawField(row, "Plan d'action") || "");
    return planIsComplete(planRaw);
  };

  const onCloseRow = async (row) => {
    if (!canCloseRow(row)) {
      alert("Plan d’action non terminé : coche toutes les actions (fait / non réalisable + note).");
      return;
    }

    const r = await fetch(`${API}/fe/${row.id}/close`, { method: "POST" });
    const d = await r.json();

    if (!d?.ok) {
      alert(d?.error || "Erreur clôture");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id !== row.id ? x : { ...x, ...d.item })));
    setSelectedRecord((prev) => (!prev || prev.id !== row.id ? prev : { ...prev, ...d.item }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2>{config.title}</h2>
        <span style={{ color: "#6b7280" }}>{loading ? "chargement..." : `${total} lignes`}</span>
      </div>

      <div className="legend" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span>
            <span className="pillMissing" /> Champ vide
          </span>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
            Afficher uniquement les FE incomplètes (page courante)
          </label>

          <span style={{ color: "#6b7280", fontSize: 13 }}>
            Astuce : clique sur une cellule pour afficher/éditer (Analyse ouvre le 6M)
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Année :</span>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={selectStyle}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>

          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Rechercher (FE, REF, désignation, lancement...)"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} style={btnStyle}>
              ←
            </button>

            <span style={{ color: "#6b7280", fontSize: 13 }}>
              Page <b>{page}</b> / {totalPages}
            </span>

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} style={btnStyle}>
              →
            </button>
          </div>
        </div>
      </div>

      <FeGrid
        config={config}
        rows={displayedRows}
        getValue={(row, colLabel) => getField(row, colLabel)}
        getRawValue={(row, colLabel) => getRawField(row, colLabel)}
        highlightMissing={true}
        onRowClick={(row) => openDetail(row.id)}
        onCellClick={(row, colLabel, rawValue) => openEditCell(row, colLabel, rawValue)}
        showCloseColumn={true}
        canCloseRow={canCloseRow}
        onCloseRow={onCloseRow}
      />

      <FeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />

      <Analyse6MModal
        open={editOpen && editCtx?.label === "Analyse"}
        initialValue={editCtx?.current ?? ""}
        onCancel={() => {
          setEditOpen(false);
          setEditCtx(null);
        }}
        onSave={saveEditCell}
      />

      <PlanActionModal
        open={editOpen && editCtx?.label === "Plan d'action"}
        analyseValue={editCtx?.analyse ?? ""}
        initialValue={editCtx?.current ?? ""}
        onCancel={() => {
          setEditOpen(false);
          setEditCtx(null);
        }}
        onSave={saveEditCell}
      />

      <EditCellModal
        open={editOpen && editCtx?.label !== "Analyse" && editCtx?.label !== "Plan d'action"}
        title={editCtx ? `Modifier : ${editCtx.label}` : "Modifier"}
        initialValue={editCtx?.current ?? ""}
        mode={editCtx?.mode ?? "text"}
        options={editCtx?.options ?? null}
        onCancel={() => {
          setEditOpen(false);
          setEditCtx(null);
        }}
        onSave={saveEditCell}
      />
    </div>
  );
}

const btnStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "white",
  cursor: "pointer",
};

const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  minWidth: 340,
  background: "white",
};

const selectStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "white",
};
