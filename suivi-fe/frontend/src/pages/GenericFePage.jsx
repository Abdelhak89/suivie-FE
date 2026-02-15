// src/pages/GenericFePage.jsx - VERSION ADAPTÉE POUR NOUVELLE API
import { useEffect, useMemo, useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import Analyse6MModal from "../components/Analyse6MModal.jsx";
import PlanActionModal from "../components/PlanActionModal.jsx";
import { PAGES } from "../config/fePages.js";
import { getFieldValue, getRawFieldValue } from "../utils/feFieldMapper.js";
import { getAllFE, getFEByNumero } from "../services/feApi.js";

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
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          statut: "En cours", // PAR DÉFAUT : FE EN COURS UNIQUEMENT
          annee: annee || null,
          limit: pageSize,
          offset: (page - 1) * pageSize
        });

        setItems(result.items || []);
        setTotal(result.total || 0);
      } catch (error) {
        console.error("Erreur chargement FE:", error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pageKey, page, q, annee]);

  const displayedRows = useMemo(() => {
    // Filtre par recherche
    let filtered = items;
    if (q.trim()) {
      const search = q.toLowerCase();
      filtered = items.filter(fe =>
        fe.numero_fe?.toLowerCase().includes(search) ||
        fe.code_article?.toLowerCase().includes(search) ||
        fe.designation?.toLowerCase().includes(search) ||
        fe.code_lancement?.toLowerCase().includes(search)
      );
    }

    // Filtre par champs manquants
    if (onlyMissing) {
      const cols = config.groups.flatMap((g) => g.columns);
      filtered = filtered.filter((r) => 
        cols.some((c) => {
          const value = getRawFieldValue(r, c);
          return !value || String(value).trim() === "";
        })
      );
    }

    return filtered;
  }, [onlyMissing, items, q, config]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openDetail = async (numeroFE) => {
    setDrawerOpen(true);
    setSelectedRecord({ 
      numero_fe: numeroFE, 
      statut: "", 
      data: { Chargement: "..." } 
    });

    try {
      const fe = await getFEByNumero(numeroFE);
      setSelectedRecord(fe);
    } catch (error) {
      setSelectedRecord({ 
        numero_fe: numeroFE, 
        statut: "", 
        data: { Erreur: "Impossible de charger le détail" } 
      });
    }
  };

  const openEditCell = (row, label, rawValue) => {
    const current = rawValue ?? getRawFieldValue(row, label) ?? "";

    if (label === "Analyse") {
      setEditCtx({ rowId: row.numero_fe, label, current });
      setEditOpen(true);
      return;
    }

    if (label === "Plan d'action") {
      const analyse = String(getRawFieldValue(row, "Analyse") || "");
      setEditCtx({ rowId: row.numero_fe, label, current, analyse });
      setEditOpen(true);
      return;
    }

    if (label === "D2R") {
      setEditCtx({ 
        rowId: row.numero_fe, 
        label, 
        current, 
        mode: "select", 
        options: D2R_OPTIONS 
      });
      setEditOpen(true);
      return;
    }

    setEditCtx({ 
      rowId: row.numero_fe, 
      label, 
      current, 
      mode: "text", 
      options: null 
    });
    setEditOpen(true);
  };

  const saveEditCell = async (newValue) => {
    const ctx = editCtx;
    if (!ctx) return;

    try {
      // TODO: Implémenter l'enregistrement via l'API
      // Pour l'instant, on simule la sauvegarde locale
      console.log("Sauvegarde:", ctx.label, "=", newValue, "pour FE", ctx.rowId);
      
      alert("Fonctionnalité à implémenter : sauvegarde des modifications");
      
      setEditOpen(false);
      setEditCtx(null);
    } catch (error) {
      alert(`Erreur enregistrement : ${error.message}`);
    }
  };

  const canCloseRow = (row) => {
    const planRaw = String(getRawFieldValue(row, "Plan d'action") || "");
    return planIsComplete(planRaw);
  };

  const onCloseRow = async (row) => {
    if (!canCloseRow(row)) {
      alert("Plan d'action non terminé : coche toutes les actions (fait / non réalisable + note).");
      return;
    }

    try {
      // TODO: Implémenter la clôture via l'API
      console.log("Clôture FE:", row.numero_fe);
      alert("Fonctionnalité à implémenter : clôture des FE");
    } catch (error) {
      alert(`Erreur clôture : ${error.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2>{config.title}</h2>
        <span style={{ color: "#6b7280" }}>
          {loading ? "chargement..." : `${total} lignes`}
        </span>
      </div>

      <div className="legend" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
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
            Astuce : clique sur une cellule pour afficher/éditer (Analyse ouvre le 6M)
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Année :</span>
          <select 
            value={annee} 
            onChange={(e) => setAnnee(e.target.value)} 
            style={selectStyle}
          >
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
        getValue={(row, colLabel) => getFieldValue(row, colLabel)}
        getRawValue={(row, colLabel) => getRawFieldValue(row, colLabel)}
        highlightMissing={true}
        onRowClick={(row) => openDetail(row.numero_fe)}
        onCellClick={(row, colLabel, rawValue) => openEditCell(row, colLabel, rawValue)}
        showCloseColumn={true}
        canCloseRow={canCloseRow}
        onCloseRow={onCloseRow}
      />

      <FeDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        record={selectedRecord} 
      />

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