import { useEffect, useMemo, useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import Analyse6MModal from "../components/Analyse6MModal.jsx";
import { PAGES } from "../config/fePages.js";
import { getField } from "../config/fieldMap.js";
import PlanActionModal from "../components/PlanActionModal.jsx";

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

const getDataValue = (row, label) => {
  const data = row?.data;
  if (!data || typeof data !== "object") return "";

  // label exact
  if (data[label] != null) return String(data[label]);

  // label nettoyé (au cas où)
  const ck = cleanKey(label);
  if (data[ck] != null) return String(data[ck]);

  // variante apostrophe typographique
  if (label === "Plan d'action") {
    const alt = "Plan d’action";
    if (data[alt] != null) return String(data[alt]);
    const altCk = cleanKey(alt);
    if (data[altCk] != null) return String(data[altCk]);
  }

  return "";
};


const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function GenericFePage({ pageKey, titleOverride }) {
  const config = PAGES[pageKey] || {
    title: titleOverride ?? pageKey,
    groups: [{ label: "Données", columns: [] }],
  };
console.log(config.groups.flatMap(g => g.columns));

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
  const [editCtx, setEditCtx] = useState(null); // { rowId, label, current }

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
    // ✅ en dev React 18, les effets sont doublés => abort normal
    if (e?.name !== "AbortError") {
      console.error("FETCH /fe ERROR:", e);
    }
  })
  .finally(() => setLoading(false));


    return () => ctrl.abort();
  }, [pageKey, page, q, annee]);

  const displayedRows = useMemo(() => {
    if (!onlyMissing) return items;
    const cols = config.groups.flatMap((g) => g.columns);
    return items.filter((r) =>
      cols.some((c) => !String(getField(r, c) ?? "").trim()),
    );
  }, [onlyMissing, items, config]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onChangeQ = (v) => {
    setPage(1);
    setQ(v);
  };

  const onChangeYear = (v) => {
    setPage(1);
    setAnnee(v);
  };

  const openDetail = async (id) => {
    setDrawerOpen(true);
    setSelectedRecord({
      numero_fe: "",
      statut: "",
      data: { Chargement: "..." },
    });

    try {
      const r = await fetch(`${API}/fe/${id}`);
      const d = await r.json();
      setSelectedRecord(d);
    } catch {
      setSelectedRecord({
        numero_fe: "",
        statut: "",
        data: { Erreur: "Impossible de charger le détail" },
      });
    }
  };

  const openEditCell = (row, label, current) => {
      if (label === "Plan d'action") {
    const rawAnalyse = getDataValue(row, "Analyse");
    const rawPlan = getDataValue(row, "Plan d'action"); // ✅ vraie valeur, pas le token
    setEditCtx({
      rowId: row.id,
      label,
      current: rawPlan,
      analyse: rawAnalyse,
      row,
    });
    setEditOpen(true);
    return;
  }


    if (label === "Plan d'action") {
      const rawAnalyse =
        (row?.data && (row.data["Analyse"] ?? row.data["analyse"])) || "";
      setEditCtx({
        rowId: row.id,
        label,
        current: current ?? "",
        analyse: rawAnalyse,
        row,
      });
      setEditOpen(true);
      return;
    }

    setEditCtx({ rowId: row.id, label, current: current ?? "", row });
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

    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== ctx.rowId) return x;
        if (d.item?.data) return { ...x, ...d.item };
        const data = { ...(x.data || {}) };
        data[ctx.label] = newValue;
        return { ...x, data };
      }),
    );

    setSelectedRecord((prev) => {
      if (!prev || prev.id !== ctx.rowId) return prev;
      if (d.item) return { ...prev, ...d.item };
      const data = { ...(prev.data || {}) };
      data[ctx.label] = newValue;
      return { ...prev, data };
    });

    setEditOpen(false);
    setEditCtx(null);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h2>{config.title}</h2>
        <span style={{ color: "#6b7280" }}>
          {loading ? "chargement..." : `${total} lignes`}
        </span>
      </div>

      <div
        className="legend"
        style={{ justifyContent: "space-between", flexWrap: "wrap" }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span>
            <span className="pillMissing" /> Champ vide
          </span>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
            />
            Afficher uniquement les FE incomplètes (page courante)
          </label>

          <span style={{ color: "#6b7280", fontSize: 13 }}>
            Astuce : clique sur une cellule vide pour remplir (Analyse ouvre le
            6M)
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: 13 }}>Année :</span>
          <select
            value={annee}
            onChange={(e) => onChangeYear(e.target.value)}
            style={selectStyle}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="">Toutes</option>
          </select>

          <input
            value={q}
            onChange={(e) => onChangeQ(e.target.value)}
            placeholder="Rechercher (FE, REF, désignation, lancement...)"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              style={btnStyle}
            >
              ←
            </button>

            <span style={{ color: "#6b7280", fontSize: 13 }}>
              Page <b>{page}</b> / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              style={btnStyle}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <FeGrid
        config={config}
        rows={displayedRows}
        getValue={(row, colLabel) => getField(row, colLabel)}
        highlightMissing={true}
        onRowClick={(row) => openDetail(row.id)}
        onCellClick={(row, colLabel, value) =>
          openEditCell(row, colLabel, value)
        }
      />

      <FeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
      />

      {/* ✅ Modal 6M pour Analyse */}
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

      {/* ✅ Modal simple pour le reste */}
      <EditCellModal
        open={
          editOpen &&
          editCtx?.label !== "Analyse" &&
          editCtx?.label !== "Plan d'action"
        }
        title={editCtx ? `Modifier : ${editCtx.label}` : "Modifier"}
        initialValue={editCtx?.current ?? ""}
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
