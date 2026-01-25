// backend/src/exports/a3DmaicExport.js
import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
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

function getClientCodeFromRef(ref) {
  const s = String(ref || "").trim();
  return s.length >= 3 ? s.slice(0, 3) : "";
}

/**
 * Génère un PPTX A3 DMAIC avec la slide 1 en fond image + champs dynamiques
 * @param {object} opts
 * @param {object} opts.fe
 * @param {string} opts.slide1PngAbs chemin absolu vers l'image de fond (slide 1 exportée)
 */
export async function buildA3DmaicPptx({ fe, slide1PngAbs }) {
  if (!slide1PngAbs || !fs.existsSync(slide1PngAbs)) {
    throw new Error(`Image de fond introuvable: ${slide1PngAbs}`);
  }

  // 16:9 par défaut. Si ton PPT est en A3 paysage, on peut rester en wide :
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5

  const slide = pptx.addSlide();

  // Fond = image exportée de la slide PowerPoint
  slide.addImage({ path: slide1PngAbs, x: 0, y: 0, w: 13.333, h: 7.5 });

  // --- Données FE ---
  const numeroFe = fe?.numero_fe || "";
  const ref = fe?.code_article || "";
  const clientCode = getClientCodeFromRef(ref);
  const clientName = getClientNameFromCode(clientCode) || clientCode || "";
  const dateISO = toISODate(fe?.date_creation || "");

  const description =
    getDataByKeys(
      fe,
      "Details de l'anomalie",
      "Détails de l'anomalie",
      "Detail de l'anomalie",
      "Détail de l'anomalie",
      "Description"
    ) ||
    fe?.designation ||
    "";

  // --- Placement (à ajuster 1 fois) ---
  // ✅ Astuce: tu ajustes les x/y/w/h UNE fois, après c’est parfait.
  // Les coordonnées ci-dessous sont une base; tu peux les micro-ajuster.
  const styleSmall = { fontFace: "Calibri", fontSize: 12, color: "000000" };
  const styleBold = { fontFace: "Calibri", fontSize: 14, bold: true, color: "000000" };

  // Zone haut (Date / N°FE / Client) — adapte les coords à tes cases
  slide.addText(dateISO,     { x: 1.10, y: 0.55, w: 2.20, h: 0.35, ...styleSmall });
  slide.addText(numeroFe,    { x: 4.05, y: 0.55, w: 3.00, h: 0.35, ...styleBold });
  slide.addText(clientName,  { x: 8.80, y: 0.55, w: 4.30, h: 0.35, ...styleSmall });

  // Description FE (la zone que tu as montré)
  slide.addText(description, {
    x: 1.10, y: 1.20, w: 12.10, h: 0.85,
    fontFace: "Calibri",
    fontSize: 12,
    color: "000000",
    valign: "top",
    // wrap (PptxGenJS wrap automatiquement si la box est bonne)
  });

  // Qualiticien + Participants (tu peux remplir à la main ensuite)
  const qualiticien = fe?.animateur || "";
  slide.addText(qualiticien, { x: 1.10, y: 2.15, w: 5.80, h: 0.35, ...styleSmall });

  // Participants : vide au départ (tu pourras écrire à la main dans PPT)
  slide.addText("", { x: 7.20, y: 2.15, w: 6.00, h: 0.60, ...styleSmall });

  // Retour buffer
  const buf = await pptx.write("nodebuffer");
  return buf;
}
