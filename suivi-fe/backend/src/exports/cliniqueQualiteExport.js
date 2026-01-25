// backend/src/exports/cliniqueQualiteExport.js
import PptxGenJS from "pptxgenjs";
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
      if (v !== null && v !== undefined && String(v).trim() !== "")
        return String(v);
    }
  }
  return "";
}

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

function clientFromRef(ref) {
  const code = String(ref || "").trim().slice(0, 3);
  const name = getClientNameFromCode(code);
  return { code, name };
}

/**
 * Génère le PPTX Clinique Qualité (A3 DMAIC)
 * On garde la mise en forme via une image de fond du slide.
 */
export async function buildCliniqueQualitePptx({
  fe,
  backgroundPngAbs,
  qualiticien = "",
  participants = "",
}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

  const slide = pptx.addSlide();

  // Fond = ton slide exporté en PNG
  slide.addImage({ path: backgroundPngAbs, x: 0, y: 0, w: 13.33, h: 7.5 });

  // Données FE
  const numeroFe = fe?.numero_fe || "";
  const dateISO = toISODate(fe?.date_creation || "");
  const ref = fe?.code_article || "";
  const { name: clientName, code: clientCode } = clientFromRef(ref);

  const descriptionFE =
    getDataByKeys(
      fe,
      "Details de l'anomalie",
      "Détails de l'anomalie",
      "Detail de l'anomalie",
      "Détail de l'anomalie",
      "Description",
      "Description du défaut"
    ) || fe?.designation || "";

  // ⚙️ Positions (à ajuster une fois si besoin)
  // Astuce: tu ajustes x/y/w/h à la main jusqu’à ce que ça tombe pile.
  const common = {
    fontFace: "Calibri",
    color: "000000",
  };

  // Date FE (zone en haut)
  slide.addText(dateISO, {
    ...common,
    x: 9.9,
    y: 0.45,
    w: 3.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    align: "right",
  });

  // Numéro FE
  slide.addText(numeroFe, {
    ...common,
    x: 1.05,
    y: 0.45,
    w: 3.6,
    h: 0.35,
    fontSize: 14,
    bold: true,
  });

  // Client
  slide.addText(clientName || clientCode || "", {
    ...common,
    x: 4.9,
    y: 0.45,
    w: 4.8,
    h: 0.35,
    fontSize: 14,
    bold: true,
    align: "center",
  });

  // Qualiticien
  slide.addText(String(qualiticien || ""), {
    ...common,
    x: 1.05,
    y: 1.08,
    w: 5.7,
    h: 0.5,
    fontSize: 13,
  });

  // Participants (multiligne)
  slide.addText(String(participants || ""), {
    ...common,
    x: 6.9,
    y: 1.08,
    w: 6.0,
    h: 0.9,
    fontSize: 12,
    valign: "top",
  });

  // Description FE (zone que tu as pointée)
  slide.addText(String(descriptionFE || ""), {
    ...common,
    x: 1.05,
    y: 2.05,
    w: 11.85,
    h: 1.1,
    fontSize: 12,
    valign: "top",
  });

  const buf = await pptx.write("nodebuffer");
  return buf;
}
