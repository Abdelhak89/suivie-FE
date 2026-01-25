// src/exports/alerteQualiteExport.js
import path from "path";
import ExcelJS from "exceljs";

// --- mapping client par 3 premiers chiffres du N° FE
// tu complètes cette table
const CLIENT_BY_CODE = {
  "141": "SAFRAN AIRCRAFT ENGINES",
  "154": "EXOSENS / PHOTONIS",
  "393": "SED Cockpit Solutions",
  // ...
};

function formatDateFR(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return String(dateLike);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// ExcelJS: écrire dans une cellule nommée
function setNamedCell(workbook, name, value) {
  const ranges = workbook.definedNames.getRanges(name);
  if (!ranges || ranges.length === 0) return false;

  // on prend le 1er range
  const addr = ranges[0]; // ex: "Alerte!B4" ou "Sheet1!C10"
  const [sheetName, cellAddr] = addr.split("!");
  const ws = workbook.getWorksheet(sheetName);
  if (!ws) return false;

  ws.getCell(cellAddr).value = value ?? "";
  return true;
}

// Option image: placer dans une zone fixe (simple et fiable)
function insertImage(workbook, ws, buffer, ext = "png") {
  const imageId = workbook.addImage({ buffer, extension: ext });
  // adapte la zone à TON template
  ws.addImage(imageId, {
    tl: { col: 1, row: 18 },  // B19
    br: { col: 8, row: 35 },  // I36
    editAs: "oneCell",
  });
}

export async function buildAlerteQualiteXlsx({ feRecord, imageBuffer, imageExt }) {
  const templatePath = path.resolve("templates/alerte-qualite-template.xlsx");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);

  // IMPORTANT: si ton template a 1 seule feuille, on la prend
  const ws = wb.worksheets[0];

  const numeroFe = feRecord?.numero_fe || "";
  const clientCode = String(numeroFe).slice(0, 3);
  const clientName = CLIENT_BY_CODE[clientCode] || clientCode || "";

  // ⚠️ champs venant du JSONB data (selon les vrais intitulés Excel)
  const data = feRecord?.data || {};
  const qteEstimee =
    data["Qte estimee"] ?? data["Qté estimée"] ?? data["Qte estimee "] ?? "";
  const detailsAnomalie =
    data["Details de l'anomalie"] ??
    data["Détails de l'anomalie"] ??
    data["Details anomalie"] ??
    "";

  // Remplissage (cellules nommées)
  setNamedCell(wb, "AQ_NUM_FE", numeroFe);
  setNamedCell(wb, "AQ_CLIENT", clientName);
  setNamedCell(wb, "AQ_LANCEMENT", feRecord?.code_lancement || "");
  setNamedCell(wb, "AQ_REF", feRecord?.code_article || "");
  setNamedCell(wb, "AQ_DESIGNATION", feRecord?.designation || "");
  setNamedCell(wb, "AQ_QTE_NC", qteEstimee || "");
  setNamedCell(wb, "AQ_LIEU_DETECTION", feRecord?.lieu_detection || "");
  setNamedCell(wb, "AQ_DATE_DETECTION", formatDateFR(feRecord?.date_creation));
  setNamedCell(wb, "AQ_DESCRIPTION", detailsAnomalie || "");

  // Image si fournie
  if (imageBuffer && ws) {
    insertImage(wb, ws, imageBuffer, imageExt || "png");
  }

  // Retour buffer
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
