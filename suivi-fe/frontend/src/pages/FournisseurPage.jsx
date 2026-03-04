// src/pages/FournisseurPage.jsx
import FeGrid from "../components/FeGrid.jsx";
import FeDrawer from "../components/FeDrawer.jsx";
import Analyse6MModal from "../components/Analyse6MModal.jsx";
import PlanActionModal from "../components/PlanActionModal.jsx";
import EditCellModal from "../components/EditCellModal.jsx";
import { GridToolbar, Pagination } from "../components/GridPageShared.jsx";
import { useGridPage } from "../hooks/useGridPage.js";
import { makeCustomRenderer } from "../utils/gridCustomRenderer.jsx";
import { PAGES } from "../config/fePages.js";
import { getRawFieldValue } from "../utils/feFieldMapper.js";
import "../styles/app.css";

export default function FournisseurPage() {
  const config = PAGES["fournisseur"];
  const gp = useGridPage({ origine: "DFOU", config });
  const getValue = makeCustomRenderer(gp.assignments, gp.setAssign);

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <h2 className="h1">Fournisseur</h2>
          <div className="sub">{gp.loading ? "Chargement…" : `${gp.items.length} FE`}</div>
        </div>
      </div>

      <GridToolbar
        q={gp.q} setQ={gp.setQ}
        statut={gp.statut} setStatut={gp.setStatut}
        annee={gp.annee} setAnnee={gp.setAnnee}
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

      <Analyse6MModal
        open={gp.editOpen && gp.editCtx?.label === "Analyse"}
        initialValue={gp.editCtx?.current ?? ""}
        onCancel={() => { gp.setEditOpen(false); gp.setEditCtx(null); }}
        onSave={gp.saveEditCell}
      />
      <PlanActionModal
        open={gp.editOpen && gp.editCtx?.label === "Plan d'action"}
        analyseValue={gp.editCtx?.analyse ?? ""}
        initialValue={gp.editCtx?.current ?? ""}
        onCancel={() => { gp.setEditOpen(false); gp.setEditCtx(null); }}
        onSave={gp.saveEditCell}
      />
      <EditCellModal
        open={gp.editOpen && !["Analyse","Plan d'action"].includes(gp.editCtx?.label)}
        title={gp.editCtx?.label ? `Modifier : ${gp.editCtx.label}` : "Modifier"}
        initialValue={gp.editCtx?.current ?? ""}
        mode={gp.editCtx?.mode ?? "text"}
        options={gp.editCtx?.options ?? null}
        onCancel={() => { gp.setEditOpen(false); gp.setEditCtx(null); }}
        onSave={gp.saveEditCell}
      />
    </div>
  );
}
