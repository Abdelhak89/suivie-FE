// backend/src/exports/derogationExport.js
import ExcelJS from "exceljs";
import { getClientNameFromCode } from "../data/clients.js";

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

function getDataByKeys(fe, ...keys) {
  const data = fe?.data;
  if (!data || typeof data !== "object") return "";

  const wanted = new Set(keys.map(cleanKey));
  for (const [k, v] of Object.entries(data)) {
    if (wanted.has(cleanKey(k))) {
      if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
    }
  }
  return "";
}

// exceljs getRanges peut renvoyer array OU {name, ranges}
function getNamedRanges(wb, name) {
  const got = wb.definedNames.getRanges(name);
  return Array.isArray(got) ? got : got?.ranges;
}

function setNamedCell(wb, name, value) {
  const ranges = getNamedRanges(wb, name);
  if (!ranges?.length) return false;

  const first = ranges[0]; // ex: "Feuil1!$B$5" ou "'Feuil1'!$B$5"
  const [sheetPart, cellPart] = first.split("!");
  const sheetName = sheetPart.replace(/^'/, "").replace(/'$/, "");
  const addr = cellPart.replace(/\$/g, "");

  const ws = wb.getWorksheet(sheetName);
  if (!ws) return false;

  ws.getCell(addr).value = value ?? "";
  return true;
}

// Retourne { ws, cell, rowIndex } à partir d'un nom défini
function getNamedCell(wb, name) {
  const ranges = getNamedRanges(wb, name);
  if (!ranges?.length) return null;

  const [sheetPart, cellPart] = ranges[0].split("!");
  const sheetName = sheetPart.replace(/^'/, "").replace(/'$/, "");
  const addr = cellPart.replace(/\$/g, "");

  const ws = wb.getWorksheet(sheetName);
  if (!ws) return null;

  const cell = ws.getCell(addr);
  return { ws, cell, rowIndex: cell.row };
}

// YYYY-MM-DD
function toISODate(v) {
  if (!v) return "";
  const s = String(v).trim();
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

// 3 premiers caractères de la REF (Code Article)
function getClientCodeFromRef(ref) {
  const s = String(ref || "").trim();
  return s.length >= 3 ? s.slice(0, 3) : "";
}

function formatPlanAction(planRaw) {
  if (!planRaw) return "";
  try {
    const arr = typeof planRaw === "string" ? JSON.parse(planRaw) : planRaw;
    if (!Array.isArray(arr)) return String(planRaw);

    return arr
      .filter((a) => a && String(a.text || "").trim())
      .map((a, idx) => {
        const status = a.done
          ? "FAIT"
          : a.notRealizable
            ? `NON RÉALISABLE${a.note ? ` (${a.note})` : ""}`
            : "À FAIRE";
        return `${idx + 1}. ${String(a.text).trim()} — ${status}`;
      })
      .join("\n");
  } catch {
    return String(planRaw);
  }
}

/**
 * Fit texte dans la cellule :
 * - wrapText + shrinkToFit (évite débordement)
 * - ajuste hauteur de ligne si le texte est multi-lignes / long
 * - ne supprime pas le style existant (on merge avec l’alignement existant)
 */
function fitTextInNamedCell(wb, name, text, { autoHeight = true, maxLines = 20 } = {}) {
  const got = getNamedCell(wb, name);
  if (!got) return;

  const { ws, cell, rowIndex } = got;

  // garde l’existant + ajoute wrap/shrink
  const prev = cell.alignment || {};
  cell.alignment = {
    ...prev,
    wrapText: true,
    shrinkToFit: true,
    vertical: prev.vertical || "top",
  };

  if (!autoHeight) return;

  const t = String(text ?? "");
  const lineCount = Math.max(1, t.split("\n").length);

  // estimation : plus le texte est long, plus on augmente la hauteur
  const approxExtra = Math.ceil(t.length / 35);
  const approxLines = Math.min(maxLines, Math.max(lineCount, approxExtra));

  const row = ws.getRow(rowIndex);
  const base = row.height || 15;
  const wanted = Math.max(base, approxLines * 14);

  // limite haute raisonnable
  row.height = Math.min(500, wanted);
}

function setText(wb, name, text, fitOpts) {
  setNamedCell(wb, name, text);
  fitTextInNamedCell(wb, name, text, fitOpts);
}

export async function buildDerogationXlsx({ fe, templatePathAbs }) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePathAbs);

  // ✅ Sources
  const numeroFe = fe?.numero_fe || "";
  const ref = fe?.code_article || "";
  const designation = fe?.designation || "";
  const lancement = fe?.code_lancement || "";
  const dateCreationISO = toISODate(fe?.date_creation || "");

  // ✅ client via 3 premiers de la REF
  const clientCode = getClientCodeFromRef(ref);
  const clientName = getClientNameFromCode(clientCode);

  // ✅ Non conforme = Qte estimée
  const qteNc = getDataByKeys(
    fe,
    "Qte estimee",
    "Qte estimée",
    "Qté estimée",
    "Quantité estimée",
    "Qte NC",
    "Qté NC",
    "Non conforme",
    "Non-Conforme"
  );

  // ✅ Quantité commandée = Qte lancement
  const qteCommandee = getDataByKeys(
    fe,
    "Qte lancement",
    "Qté lancement",
    "Quantité lancement",
    "Quantite lancement",
    "Quantité Commandée",
    "Quantité commandée"
  );

  // ✅ Description du défaut
  const descriptionDefaut =
    getDataByKeys(
      fe,
      "Details de l'anomalie",
      "Détails de l'anomalie",
      "Detail de l'anomalie",
      "Détail de l'anomalie",
      "Description",
      "Description du défaut"
    ) || "";

  // ✅ Analyse des causes
  const analyseCauses = getDataByKeys(fe, "Analyse", "Analyse des causes") || "";

  // ✅ Action envisagée = plan d’action
  const planRaw = getDataByKeys(fe, "Plan d'action", "Plan d’action", "Plan d action") || "";
  const actionEnvisagee = formatPlanAction(planRaw);

  // ✅ MAPPING (noms définis dans le template)
  setNamedCell(wb, "DG_NUM_FE", numeroFe);
  setNamedCell(wb, "DG_DATE", dateCreationISO);
  setNamedCell(wb, "DG_REF", ref);
  setNamedCell(wb, "DG_DESIGNATION", designation);
  setNamedCell(wb, "DG_LANCEMENT", lancement);

  // ✅ petites cases (empêche débordement)
  // (DG_CLIENT et DG_QTE_NC doivent exister dans le template)
  setText(wb, "DG_CLIENT", clientName || clientCode || "", { autoHeight: false });
  setText(wb, "DG_QTE_COMMANDEE", qteCommandee || "", { autoHeight: false });
  setText(wb, "DG_QTE_NC", qteNc || "", { autoHeight: false });

  // ✅ grandes zones : libellé + retour ligne
  const txtAnalyse = `Analyse des causes :\n${analyseCauses || ""}`;
  const txtAction = `Action envisagée :\n${actionEnvisagee || ""}`;
  const txtDesc = `Description du défaut :\n${descriptionDefaut || ""}`;

  setText(wb, "DG_ANALYSE_CAUSES", txtAnalyse, { autoHeight: true, maxLines: 25 });
  setText(wb, "DG_ACTION_ENVISAGEE", txtAction, { autoHeight: true, maxLines: 25 });
  setText(wb, "DG_DESCRIPTION_DEFAUT", txtDesc, { autoHeight: true, maxLines: 35 });

  return await wb.xlsx.writeBuffer();
}
