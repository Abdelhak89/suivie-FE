// src/hooks/useGridPage.js
import { useEffect, useMemo, useState } from "react";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import { getRawFieldValue } from "../utils/feFieldMapper.js";
import { ILOTS, TYPES_DEFAUT, DETECTE_PAR } from "../data/ncData.js";

export const ANIMATEURS = [
  { value: "",                        label: "— Non assigné —" },
  { value: "BLANQUART Nicolas",       label: "BLANQUART Nicolas" },
  { value: "BRISDET Trystan",         label: "BRISDET Trystan" },
  { value: "DOBY Sandrine",           label: "DOBY Sandrine" },
  { value: "SANCHEZ WRIGHT Juliette", label: "SANCHEZ WRIGHT Juliette" },
  { value: "SDRAULIG Florence",       label: "SDRAULIG Florence" },
];

export const SUPPORTS = [
  { value: "",                 label: "— Aucun support —" },
  { value: "MARTIN Sophie",   label: "MARTIN Sophie" },
  { value: "DURAND Thomas",   label: "DURAND Thomas" },
  { value: "CLEMENT Mathieu", label: "CLEMENT Mathieu" },
  { value: "BERNARD Julie",   label: "BERNARD Julie" },
];

export const D2R_OPTIONS = ["ACCEPTE EN L'ETAT", "ANNULE", "DEROGATION", "N/A", "REBUT", "RETOUCHE"];

// ── Mapping colonnes → type de modal ────────────────────────────
// "8d"     → Analyse8DModal
// "plan"   → PlanActionModal
// "select" → EditCellModal mode select (avec options)
// "text"   → EditCellModal mode texte libre
// "skip"   → rien (colonne non éditable via modal)

const COLUMN_MODAL = {
  // Colonnes non éditables (selects inline dans la grille)
  "Animateur":          "skip",
  "Support":            "skip",
  "Mesure Eff.":        "skip",
  "Type NC":            "skip",

  // Modals spécialisés
  "Analyse 8D":         "8d",
  "Analyse":            "8d",   // ancien nom → même modal
  "Plan d'action":      "plan",

  // Selects avec options fixes
  "D2R":                "select:d2r",
  "Îlot Générateur":    "select:ilots",
  "ILOT GENERATEUR":    "select:ilots",
  "Ilot générateur":    "select:ilots",
  "Ilot generateur":    "select:ilots",
  "Type de défaut":     "select:types_defaut",
  "Type défaut":        "select:types_defaut",
  "Type de defaut":     "select:types_defaut",
  "Détecté par":        "select:detecte_par",
  "Détectée par":       "select:detecte_par",
};

function resolveModal(label) {
  // Cherche d'abord exact match
  if (COLUMN_MODAL[label]) return COLUMN_MODAL[label];
  // Cherche case-insensitive
  const low = label.toLowerCase();
  for (const [k, v] of Object.entries(COLUMN_MODAL)) {
    if (k.toLowerCase() === low) return v;
  }
  // Défaut : texte libre
  return "text";
}

function getSelectOptions(key) {
  switch (key) {
    case "d2r":          return D2R_OPTIONS;
    case "ilots":        return ILOTS;
    case "types_defaut": return TYPES_DEFAUT;
    case "detecte_par":  return DETECTE_PAR;
    default:             return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────

export function safeJsonParse(s) {
  if (!s) return null;
  if (typeof s === "object") return s;
  try { return JSON.parse(String(s)); } catch { return null; }
}

export function planIsComplete(planRaw) {
  const arr = safeJsonParse(planRaw);
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.every((a) => {
    if (!String(a?.text || "").trim()) return false;
    return a?.done || (a?.notRealizable && String(a?.note || "").trim());
  });
}

// ── Hook principal ───────────────────────────────────────────────

export function useGridPage({ origine, config }) {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [q,           setQ]           = useState("");
  const [statut,      setStatut]      = useState("En cours");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [annee,       setAnnee]       = useState("2026");
  const [page,        setPage]        = useState(1);
  const pageSize = 50;

  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editOpen,       setEditOpen]       = useState(false);
  const [editCtx,        setEditCtx]        = useState(null);
  const [assignments,    setAssignments]    = useState({});

  // Chargement
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          q: q.trim() || null,
          statut: statut === "Tous" ? null : statut,
          origine: origine || null,
          annee,
          limit: 1000,
        });
        const data = result.items || [];
        setItems(data);
        setAssignments((prev) => {
          const next = { ...prev };
          data.forEach((fe) => {
            if (!next[fe.numero_fe]) {
              next[fe.numero_fe] = { animateur: fe.animateur || "", support: "", mesure_efficacite: false };
            }
          });
          return next;
        });
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q, statut, annee, origine]);

  // Filtrage
  const displayedRows = useMemo(() => {
    if (!onlyMissing) return items;
    const cols = config.groups.flatMap((g) => g.columns);
    return items.filter((r) =>
      cols.some((c) => { const v = getRawFieldValue(r, c); return !v || !String(v).trim(); })
    );
  }, [onlyMissing, items, config]);

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [displayedRows, page, pageSize]);

  // Détail
  const openDetail = async (numeroFE) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: numeroFE, statut: "", data: { "": "Chargement…" } });
    try { setSelectedRecord(await getFEByNumero(numeroFE)); }
    catch { setSelectedRecord({ numero_fe: numeroFE, statut: "", data: { Erreur: "Impossible de charger" } }); }
  };

  // Dispatch modal selon colonne cliquée
  const openEditCell = (row, label, rawValue) => {
    const modalType = resolveModal(label);
    if (modalType === "skip") return;

    const current = rawValue ?? getRawFieldValue(row, label) ?? "";

    if (modalType === "8d") {
      setEditCtx({ rowId: row.numero_fe, label: "Analyse 8D", current, row });

    } else if (modalType === "plan") {
      // Passe le JSON 8D en contexte pour le rappel dans PlanActionModal
      const analyse8d = String(
        getRawFieldValue(row, "Analyse 8D") ||
        getRawFieldValue(row, "Analyse")    ||
        ""
      );
      setEditCtx({ rowId: row.numero_fe, label: "Plan d'action", current, analyse: analyse8d });

    } else if (modalType.startsWith("select:")) {
      const key = modalType.split(":")[1];
      setEditCtx({ rowId: row.numero_fe, label, current, mode: "select", options: getSelectOptions(key) });

    } else {
      setEditCtx({ rowId: row.numero_fe, label, current, mode: "text" });
    }

    setEditOpen(true);
  };

  const saveEditCell = async (newValue) => {
    console.log("Sauvegarde:", editCtx?.label, "=", newValue, "FE:", editCtx?.rowId);
    // TODO: appel API
    setEditOpen(false);
    setEditCtx(null);
  };

  const setAssign = (numeroFE, field, value) => {
    setAssignments((prev) => ({ ...prev, [numeroFE]: { ...prev[numeroFE], [field]: value } }));
  };

  const canCloseRow = (row) => planIsComplete(String(getRawFieldValue(row, "Plan d'action") || ""));
  const onCloseRow  = (row) => {
    if (!canCloseRow(row)) { alert("Plan d'action incomplet."); return; }
    alert(`Clôture FE ${row.numero_fe}`);
  };

  return {
    items, loading, q, setQ, statut, setStatut,
    onlyMissing, setOnlyMissing, annee, setAnnee,
    page, setPage, pageSize, totalPages, pagedRows, displayedRows,
    drawerOpen, setDrawerOpen, selectedRecord,
    editOpen, setEditOpen, editCtx, setEditCtx,
    assignments, setAssign,
    openDetail, openEditCell, saveEditCell,
    canCloseRow, onCloseRow,
  };
}