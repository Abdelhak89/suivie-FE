// src/pages/InterneSeriePage.jsx
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import Analyse8DModal from "../components/Analyse8DModal.jsx";
import PlanActionModal from "../components/PlanActionModal.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage } from "../hooks/useGridPage.js";
import { makeCustomRenderer } from "../utils/gridCustomRenderer.jsx";
import { getRawFieldValue } from "../utils/feFieldMapper.js";
import { PAGES } from "../config/fePages.js";
import "../styles/app.css";

export default function InterneSeriePage() {
  const config = PAGES["interne-serie"];
  const gp     = useGridPage({ origine: "CINT", config });

  const closeEdit = () => { gp.setEditOpen(false); gp.setEditCtx(null); };

  // Badge avancement 8D + renderer de base
  const baseRenderer = makeCustomRenderer(gp.assignments, gp.setAssign);
  const getValue = (row, col) => {
    if (col === "Analyse 8D" || col === "Analyse") {
      const raw = getRawFieldValue(row, col);
      if (!raw) return <span className="badge badgeGray">Vide</span>;
      try {
        const p   = JSON.parse(raw);
        const d   = p?.responsable_qualite     ? 8
          : p?.resultat_verif                  ? 7
          : p?.actions?.length                 ? 6
          : p?.why_apparition?.some(Boolean)   ? 5
          : p?.ilot                            ? 4
          : p?.defauts?.length                 ? 2
          : 1;
        const cls = d >= 8 ? "badgeGreen" : d >= 5 ? "badgeAmber" : "badgeBlue";
        return <span className={`badge ${cls}`}>D{d}/D8</span>;
      } catch {
        return <span className="badge badgeGray">Saisie</span>;
      }
    }
    return baseRenderer(row, col);
  };

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Interne Série</h2>
          <div className="sub">{gp.loading ? "Chargement…" : `${gp.items.length} FE`}</div>
        </div>
      </div>

      <GridToolbar
        q={gp.q}           setQ={gp.setQ}
        statut={gp.statut} setStatut={gp.setStatut}
        annee={gp.annee}   setAnnee={gp.setAnnee}
        onlyMissing={gp.onlyMissing} setOnlyMissing={gp.setOnlyMissing}
        onPageReset={() => gp.setPage(1)}
      />

      <FeGrid
        config={config}
        rows={gp.pagedRows}
        getValue={getValue}
        getRawValue={(row, col) => getRawFieldValue(row, col)}
        highlightMissing
        onRowClick={(row) => gp.openDetail(row.numero_fe)}
        onCellClick={(row, col, raw) => gp.openEditCell(row, col, raw)}
        showCloseColumn
        canCloseRow={gp.canCloseRow}
        onCloseRow={gp.onCloseRow}
      />

      <Pagination page={gp.page} totalPages={gp.totalPages} setPage={gp.setPage} />

      <FeDrawer open={gp.drawerOpen} onClose={() => gp.setDrawerOpen(false)} record={gp.selectedRecord} />

      {/* 8D — s'ouvre pour "Analyse 8D" ET l'ancien "Analyse" */}
      <Analyse8DModal
        open={gp.editOpen && gp.editCtx?.label === "Analyse 8D"}
        fe={gp.editCtx?.row}
        initialValue={gp.editCtx?.current ?? ""}
        onCancel={closeEdit}
        onSave={gp.saveEditCell}
      />

      {/* Plan d'action */}
      <PlanActionModal
        open={gp.editOpen && gp.editCtx?.label === "Plan d'action"}
        analyseValue={gp.editCtx?.analyse ?? ""}
        initialValue={gp.editCtx?.current ?? ""}
        onCancel={closeEdit}
        onSave={gp.saveEditCell}
      />

      {/* Édition générique — texte libre ou select (Îlot, D2R, Type défaut…) */}
      <EditCellModal
        open={gp.editOpen && !["Analyse 8D", "Plan d'action"].includes(gp.editCtx?.label)}
        title={gp.editCtx?.label ? `Modifier : ${gp.editCtx.label}` : "Modifier"}
        initialValue={gp.editCtx?.current ?? ""}
        mode={gp.editCtx?.mode ?? "text"}
        options={gp.editCtx?.options ?? null}
        onCancel={closeEdit}
        onSave={gp.saveEditCell}
      />
    </div>
  );
}