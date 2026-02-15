// backend/src/exports/alerteQualiteExport.js
import ExcelJS from "exceljs";
import path from "path";
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

// exceljs: getRanges peut renvoyer Array OU {name,ranges}
function getNamedRanges(wb, name) {
  const got = wb.definedNames.getRanges(name);
  return Array.isArray(got) ? got : got?.ranges || [];
}

// ✅ set value in a named cell like AQ_NUM_FE
function setNamedCell(wb, name, value) {
  const ranges = getNamedRanges(wb, name);
  if (!ranges.length) return false;

  const first = ranges[0]; // ex: "Feuil1!$B$5" ou "'Feuil1'!$B$5"
  const [sheetPart, cellPart] = first.split("!");
  const sheetName = sheetPart.replace(/^'/, "").replace(/'$/, "");
  const addr = cellPart.replace(/\$/g, "");

  const ws = wb.getWorksheet(sheetName);
  if (!ws) return false;

  ws.getCell(addr).value = value ?? "";
  return true;
}

function getNamedRangeSheetAndRef(wb, name) {
  const ranges = getNamedRanges(wb, name);
  if (!ranges.length) return null;

  const first = ranges[0];
  const [sheetPart, refPart] = first.split("!");
  const sheetName = sheetPart.replace(/^'/, "").replace(/'$/, "");
  const ref = refPart.replace(/\$/g, ""); // ex: B5 ou A27:G43
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return null;

  return { ws, ref };
}

// ✅ 23/01/2026
function toDateFRShort(v) {
  if (!v) return "";
  const s = String(v).trim();
  const iso = s.slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return s;
}

function getClientCodeFromRef(ref) {
  const s = String(ref || "").trim();
  return s.slice(0, 3);
}

// Heuristique simple de hauteur (car ExcelJS ne “auto-fit” pas parfaitement)
function autoFitRowForText(ws, cellAddress, text, approxCharsPerLine = 55, lineHeight = 15) {
  const cell = ws.getCell(cellAddress);
  cell.alignment = { ...(cell.alignment || {}), wrapText: true, vertical: "top" };

  const t = String(text || "");
  const explicitLines = t.split(/\r?\n/);
  const estimatedLines = explicitLines.reduce((acc, line) => {
    const l = line.length;
    return acc + Math.max(1, Math.ceil(l / approxCharsPerLine));
  }, 0);

  const row = ws.getRow(cell.row);
  const minLines = 3; // évite trop petit
  const lines = Math.max(minLines, estimatedLines);
  row.height = lines * lineHeight;
}

function tryAddImageToRange(wb, ws, rangeA1, imagePathAbs) {
  if (!imagePathAbs) return false;

  const ext = path.extname(imagePathAbs).toLowerCase();
  const extension = ext === ".png" ? "png" : "jpeg"; // exceljs: png|jpeg

  const imageId = wb.addImage({ filename: imagePathAbs, extension });

  // ExcelJS supporte 'A27:G43' directement
  ws.addImage(imageId, rangeA1);
  return true;
}

export async function buildAlerteQualiteXlsx({ fe, templatePathAbs, imagePathAbs = null }) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePathAbs);

  const numeroFe = fe?.numero_fe || "";
  const ref = fe?.code_article || "";

  // ✅ client = 3 premiers chiffres de la REF (Code Article)
  const clientCode = getClientCodeFromRef(ref);
  const clientName = getClientNameFromCode(clientCode);

  // ✅ mapping template (defined names)
  setNamedCell(wb, "AQ_NUM_FE", numeroFe);
  setNamedCell(wb, "AQ_CLIENT", clientName || clientCode || "");
  setNamedCell(wb, "AQ_LANCEMENT", fe?.code_lancement || "");
  setNamedCell(wb, "AQ_REF", ref);
  setNamedCell(wb, "AQ_DESIGNATION", fe?.designation || "");

  const qteNc = getDataByKeys(
    fe,
    "Qte estimee",
    "Qte estimée",
    "Qté estimée",
    "Quantité estimée",
    "Qte NC",
    "Qté NC"
  );
  setNamedCell(wb, "AQ_QTE_NC", qteNc);

  const lieu = fe?.lieu_detection || getDataByKeys(fe, "Lieu Detection", "Lieu détection");
  setNamedCell(wb, "AQ_LIEU_DETECTION", lieu);

  setNamedCell(wb, "AQ_DATE_DETECTION", toDateFRShort(fe?.date_creation || ""));

  const desc =
    getDataByKeys(
      fe,
      "Details de l'anomalie",
      "Détails de l'anomalie",
      "Detail de l'anomalie",
      "Détail de l'anomalie"
    ) || "";
  setNamedCell(wb, "AQ_DESCRIPTION", desc);

  // ✅ wrap + hauteur auto sur AQ_DESCRIPTION
  const descInfo = getNamedRangeSheetAndRef(wb, "AQ_DESCRIPTION");
  if (descInfo?.ws && descInfo?.ref && !descInfo.ref.includes(":")) {
    autoFitRowForText(descInfo.ws, descInfo.ref, desc, 55, 15);
  }

  // ✅ image : zone A27:G43 (priorité: defined name AQ_IMAGE si c’est une plage)
  if (imagePathAbs) {
    const imgInfo = getNamedRangeSheetAndRef(wb, "AQ_IMAGE");
    if (imgInfo?.ws && imgInfo?.ref) {
      // si AQ_IMAGE est une plage type A27:G43 → on l'utilise
      const range = imgInfo.ref.includes(":") ? imgInfo.ref : "A27:G43";
      tryAddImageToRange(wb, imgInfo.ws, range, imagePathAbs);
    } else {
      // fallback: Feuil1 A27:G43
      const ws = wb.getWorksheet("Feuil1") || wb.worksheets?.[0];
      if (ws) tryAddImageToRange(wb, ws, "A27:G43", imagePathAbs);
    }
  }

  return await wb.xlsx.writeBuffer();
}
