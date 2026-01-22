// src/exports/alerteQualiteExport.js
import path from "path";
import ExcelJS from "exceljs";

// Petite aide: format date en JJ/MM/AAAA
function formatDateFR(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date); // si déjà string
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * IMPORTANT :
 * Le template doit contenir des "noms" Excel (Named Ranges) pour éviter de dépendre des adresses.
 * Exemples de noms à créer dans Excel :
 *  - AQ_NUM_FE
 *  - AQ_CLIENT
 *  - AQ_LANCEMENT
 *  - AQ_REF
 *  - AQ_DESIGNATION
 *  - AQ_QTE_NC
 *  - AQ_LIEU_DETECTION
 *  - AQ_DATE_DETECTION
 *  - AQ_DESCRIPTION
 *
 * Si tu ne veux pas utiliser les noms, tu peux remplacer par ws.getCell("B3") etc.
 */
function setNamedCell(workbook, ws, name, value) {
  const ranges = workbook.definedNames.getRanges(name);
  if (!ranges || !ranges.length) return false;

  // Un nom peut pointer vers "Sheet1!$B$3"
  const first = ranges[0];
  const parts = String(first).split("!");
  if (parts.length !== 2) return false;

  const addr = parts[1].replace(/\$/g, "");
  ws.getCell(addr).value = value ?? "";
  return true;
}

export async function buildAlerteQualiteXlsx({ fe }) {
  const templatePath = path.resolve("templates/alerte_qualite_template.xlsx");

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);

  // soit tu récupères par nom
  const ws = wb.worksheets[0]; // 1ère feuille

  const data = fe?.data || {};

  // ⚠️ adapte selon tes champs réels
  const payload = {
    numero_fe: fe?.numero_fe || "",
    client: data?.Client || data?.client || "",
    lancement: fe?.code_lancement || "",
    ref: fe?.code_article || "",
    designation: fe?.designation || "",
    qte_nc: data?.["Qté Rebuts (pcs)"] || data?.Qte_NC || "", // adapte si besoin
    lieu_detection: fe?.lieu_detection || data?.["Lieu Detection"] || "",
    date_detection: formatDateFR(fe?.date_creation || data?.["Date de création"] || ""),
    description: data?.Description || data?.description || "",
  };

  // Remplissage via Named Ranges (recommandé)
  setNamedCell(wb, ws, "AQ_NUM_FE", payload.numero_fe);
  setNamedCell(wb, ws, "AQ_CLIENT", payload.client);
  setNamedCell(wb, ws, "AQ_LANCEMENT", payload.lancement);
  setNamedCell(wb, ws, "AQ_REF", payload.ref);
  setNamedCell(wb, ws, "AQ_DESIGNATION", payload.designation);
  setNamedCell(wb, ws, "AQ_QTE_NC", payload.qte_nc);
  setNamedCell(wb, ws, "AQ_LIEU_DETECTION", payload.lieu_detection);
  setNamedCell(wb, ws, "AQ_DATE_DETECTION", payload.date_detection);
  setNamedCell(wb, ws, "AQ_DESCRIPTION", payload.description);

  // Renvoie un buffer .xlsx
  const buf = await wb.xlsx.writeBuffer();
  return buf;
}
