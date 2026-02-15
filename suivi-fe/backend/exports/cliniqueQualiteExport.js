// backend/src/exports/cliniqueQualiteExport.js
import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import { getClientNameFromCode } from "../data/clients.js";

function getClientFromRef(ref) {
  const s = String(ref || "").trim();
  const code = s.slice(0, 3);
  return getClientNameFromCode(code) || code || "";
}

function toISODate(v) {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  // si déjà YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function getDescriptionFE(fe) {
  const d =
    fe?.data?.["Détails de l'anomalie"] ??
    fe?.data?.["Details de l'anomalie"] ??
    fe?.data?.["Detail de l'anomalie"] ??
    fe?.data?.["Description"] ??
    fe?.designation ??
    "";
  return String(d || "").trim();
}

/**
 * Génère un PPTX 1 slide en gardant le design via une image de fond.
 * @param {object} args
 * @param {object} args.fe
 * @param {string} args.slide1PngAbs   chemin ABS vers l'image de fond de la slide 1
 * @param {string} [args.qualiticien]
 * @param {string} [args.participants]  multi-lignes OK
 */
export async function buildCliniqueQualitePpt({ fe, slide1PngAbs, qualiticien = "", participants = "" }) {
  if (!slide1PngAbs || !fs.existsSync(slide1PngAbs)) {
    throw new Error(`Slide background PNG not found: ${slide1PngAbs}`);
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5

  const slide = pptx.addSlide();

  // 1) Background (mise en forme identique)
  slide.addImage({ path: slide1PngAbs, x: 0, y: 0, w: 13.333, h: 7.5 });

  // 2) Datas FE
  const client = getClientFromRef(fe?.code_article);
  const dateFe = toISODate(fe?.date_creation);
  const numeroFe = String(fe?.numero_fe || "").trim();
  const description = getDescriptionFE(fe);

  // 3) === POSITIONS (à ajuster 1 fois si besoin) ===
  // Astuce: on ajuste ensuite au pixel près.
  // Unités = pouces (inch) en layout wide
  const POS = {
    FE_DATE:        { x: 1.05, y: 0.58, w: 2.2,  h: 0.35 },
    FE_NUMERO:      { x: 1.05, y: 0.95, w: 2.2,  h: 0.35 },
    CLIENT:         { x: 3.55, y: 0.58, w: 5.4,  h: 0.35 },

    QUALITICIEN:    { x: 9.35, y: 0.58, w: 3.7,  h: 0.35 },
    PARTICIPANTS:   { x: 9.35, y: 0.95, w: 3.7,  h: 0.95 },

    DESCRIPTION_FE: { x: 1.05, y: 1.55, w: 12.0, h: 0.90 }, // zone description
  };

  const common = {
    fontFace: "Calibri",
    color: "000000",
  };

  // 4) Ajout textes (par-dessus l'image)
  slide.addText(dateFe || "", {
    ...POS.FE_DATE,
    ...common,
    fontSize: 12,
    bold: true,
    valign: "top",
  });

  slide.addText(numeroFe || "", {
    ...POS.FE_NUMERO,
    ...common,
    fontSize: 12,
    bold: true,
    valign: "top",
  });

  slide.addText(client || "", {
    ...POS.CLIENT,
    ...common,
    fontSize: 12,
    bold: true,
    valign: "top",
  });

  slide.addText(String(qualiticien || fe?.animateur || "").trim(), {
    ...POS.QUALITICIEN,
    ...common,
    fontSize: 12,
    bold: true,
    valign: "top",
  });

  slide.addText(String(participants || "").trim(), {
    ...POS.PARTICIPANTS,
    ...common,
    fontSize: 10,
    valign: "top",
  });

  slide.addText(description, {
    ...POS.DESCRIPTION_FE,
    ...common,
    fontSize: 10,
    valign: "top",
    // wrap automatique dans la box
  });

  // buffer node
  return await pptx.write("nodebuffer");
}
