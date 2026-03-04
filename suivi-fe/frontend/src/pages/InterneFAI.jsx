// src/pages/InterneFAI.jsx
import { useEffect, useMemo, useState } from "react";
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import PlanActionModal from "../components/PlanActionModal.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { ANIMATEURS, SUPPORTS, D2R_OPTIONS, planIsComplete } from "../hooks/useGridPage.js";
import { PAGES } from "../config/fePages.js";
import { getFieldValue, getRawFieldValue } from "../utils/feFieldMapper.js";
import { getAllFE, getFEByNumero } from "../services/feApi.js";
import "../styles/app.css";

const selectStyle = (bg) => ({
  padding: "4px 6px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  fontSize: 12,
  width: "100%",
  cursor: "pointer",
  background: bg,
});

export default function InterneFAI() {
  const config = PAGES["interne-fai"] || {
    title: "Interne FAI",
    groups: [{ label: "Données", columns: [] }],
  };

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

  // Chargement FAI (filtre is_dvi)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAllFE({
          q: q.trim() || null,
          statut: statut === "Tous" ? null : statut,
          annee,
          limit: 2000,
        });
        const faiItems = (result.items || []).filter((fe) => fe.is_dvi === true);
        setItems(faiItems);
        setAssignments((prev) => {
          const next = { ...prev };
          faiItems.forEach((fe) => {
            if (!next[fe.numero_fe])
              next[fe.numero_fe] = { animateur: fe.animateur || "", support: "", mesure_efficacite: false };
          });
          return next;
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q, statut, annee]);

  const displayedRows = useMemo(() => {
    if (!onlyMissing) return items;
    const cols = config.groups.flatMap((g) => g.columns);
    return items.filter((r) => cols.some((c) => { const v = getRawFieldValue(r, c); return !v || !String(v).trim(); }));
  }, [onlyMissing, items, config]);

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / pageSize));
  const pagedRows  = useMemo(() => displayedRows.slice((page - 1) * pageSize, page * pageSize), [displayedRows, page]);

  // Détail drawer
  const openDetail = async (numeroFE) => {
    setDrawerOpen(true);
    setSelectedRecord({ numero_fe: numeroFE, statut: "", data: {} });
    try { setSelectedRecord(await getFEByNumero(numeroFE)); }
    catch { setSelectedRecord({ numero_fe: numeroFE, statut: "", data: { Erreur: "Impossible de charger" } }); }
  };

  // Ouverture des modals selon la colonne cliquée
  const openEditCell = (row, label, rawValue) => {
    if (["Animateur", "Support", "Mesure Eff.", "Type NC"].includes(label)) return;
    const current = rawValue ?? getRawFieldValue(row, label) ?? "";

    if (label === "Analyse 8D") {
      setEditCtx({ rowId: row.numero_fe, label: "Analyse 8D", current, row });
    } else if (label === "Plan d'action") {
      setEditCtx({
        rowId: row.numero_fe,
        label: "Plan d'action",
        current,
        analyse: String(getRawFieldValue(row, "Analyse 8D") || ""),
      });
    } else if (label === "D2R") {
      setEditCtx({ rowId: row.numero_fe, label, current, mode: "select", options: D2R_OPTIONS });
    } else {
      setEditCtx({ rowId: row.numero_fe, label, current, mode: "text" });
    }
    setEditOpen(true);
  };

  const closeEdit = () => { setEditOpen(false); setEditCtx(null); };

  const saveEditCell = async (v) => {
    console.log("Save:", editCtx?.label, "→", editCtx?.rowId, v);
    // TODO: appel API de sauvegarde
    closeEdit();
  };

  const setAssign = (fid, field, val) =>
    setAssignments((p) => ({ ...p, [fid]: { ...p[fid], [field]: val } }));

  const canCloseRow = (row) => planIsComplete(String(getRawFieldValue(row, "Plan d'action") || ""));
  const onCloseRow  = (row) => {
    if (!canCloseRow(row)) { alert("Plan d'action incomplet."); return; }
    alert(`Clôture FE ${row.numero_fe}`);
  };

  // Renderer cellules spéciales
  const getValue = (row, col) => {
    const ass = assignments[row.numero_fe] || { animateur: "", support: "", mesure_efficacite: false };

    if (col === "Type NC")
      return <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.dvi_label || getFieldValue(row, col)}</span>;

    if (col === "Animateur")
      return (
        <select value={ass.animateur} onChange={(e) => setAssign(row.numero_fe, "animateur", e.target.value)} onClick={(e) => e.stopPropagation()} style={selectStyle(ass.animateur ? "var(--blueBg)" : "white")}>
          {ANIMATEURS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );

    if (col === "Support")
      return (
        <select value={ass.support} onChange={(e) => setAssign(row.numero_fe, "support", e.target.value)} onClick={(e) => e.stopPropagation()} style={selectStyle(ass.support ? "var(--amberBg)" : "white")}>
          {SUPPORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );

    if (col === "Mesure Eff.") {
      const on = ass.mesure_efficacite;
      return (
        <select value={on ? "Oui" : "Non"} onChange={(e) => setAssign(row.numero_fe, "mesure_efficacite", e.target.value === "Oui")} onClick={(e) => e.stopPropagation()} style={{ ...selectStyle(on ? "var(--greenBg)" : "var(--redBg)"), color: on ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
          <option value="Non">Non</option>
          <option value="Oui">Oui</option>
        </select>
      );
    }

    // Badge avancement 8D
    if (col === "Analyse 8D") {
      const raw = getRawFieldValue(row, col);
      if (!raw) return <span className="badge badgeGray">Vide</span>;
      try {
        const p = JSON.parse(raw);
        const d = p?.responsable_qualite ? 8
          : p?.resultat_verif           ? 7
          : p?.actions?.length          ? 6
          : p?.why_apparition?.some(Boolean) ? 5
          : p?.ilot                     ? 4
          : p?.defauts?.length          ? 2
          : 1;
        const cls = d >= 8 ? "badgeGreen" : d >= 5 ? "badgeAmber" : "badgeBlue";
        return <span className={`badge ${cls}`}>D{d}/D8</span>;
      } catch {
        return <span className="badge badgeGray">Saisie</span>;
      }
    }

    return getFieldValue(row, col);
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Interne FAI</h2>
          <div className="sub">{loading ? "Chargement…" : `${items.length} FE`}</div>
        </div>
      </div>

      <GridToolbar
        q={q} setQ={setQ}
        statut={statut} setStatut={setStatut}
        annee={annee} setAnnee={setAnnee}
        onlyMissing={onlyMissing} setOnlyMissing={setOnlyMissing}
        onPageReset={() => setPage(1)}
      />

      <FeGrid
        config={config}
        rows={pagedRows}
        getValue={getValue}
        getRawValue={(row, col) => getRawFieldValue(row, col)}
        highlightMissing
        onRowClick={(row) => openDetail(row.numero_fe)}
        onCellClick={(row, col, raw) => openEditCell(row, col, raw)}
        showCloseColumn
        canCloseRow={canCloseRow}
        onCloseRow={onCloseRow}
      />

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      {/* Drawer détail */}
      <FeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />

      {/* Modal 8D complet — s'ouvre quand on clique la colonne "Analyse 8D" */}
      <Analyse8DModal
        open={editOpen && editCtx?.label === "Analyse 8D"}
        fe={editCtx?.row}
        initialValue={editCtx?.current ?? ""}
        onCancel={closeEdit}
        onSave={saveEditCell}
      />

      {/* Plan d'action */}
      <PlanActionModal
        open={editOpen && editCtx?.label === "Plan d'action"}
        analyseValue={editCtx?.analyse ?? ""}
        initialValue={editCtx?.current ?? ""}
        onCancel={closeEdit}
        onSave={saveEditCell}
      />

      {/* Édition générique (texte / select) */}
      <EditCellModal
        open={editOpen && !["Analyse 8D", "Plan d'action"].includes(editCtx?.label)}
        title={editCtx?.label ? `Modifier : ${editCtx.label}` : "Modifier"}
        initialValue={editCtx?.current ?? ""}
        mode={editCtx?.mode ?? "text"}
        options={editCtx?.options ?? null}
        onCancel={closeEdit}
        onSave={saveEditCell}
      />
    </div>
  );
}