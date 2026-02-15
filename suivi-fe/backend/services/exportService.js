// services/exportService.js - Gestion des exports sur disque réseau
import fs from "fs/promises";
import path from "path";
import { buildA3DmaicPptx } from "../exports/a3DmaicExport.js";
import { buildAlerteQualiteXlsx } from "../exports/alerteQualiteExport.js";
import { buildCliniqueQualitePpt } from "../exports/cliniqueQualiteExport.js";
import { buildDerogationXlsx } from "../exports/derogationExport.js";

// Chemin réseau depuis .env
const NETWORK_PATH = process.env.NETWORK_EXPORT_PATH || "\\\\serveur\\partage\\exports";

/**
 * Créer le dossier de destination si nécessaire
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Générer un nom de fichier unique avec timestamp
 */
function generateFileName(numeroFE, type, extension) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sanitizedNumero = String(numeroFE).replace(/[/\\:*?"<>|]/g, '_');
  return `FE_${sanitizedNumero}_${type}_${timestamp}.${extension}`;
}

/**
 * Sauvegarder un buffer sur le disque réseau
 */
async function saveToNetwork(buffer, numeroFE, type, extension) {
  // Créer la structure : NETWORK_PATH/YYYY/MM/
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const destDir = path.join(NETWORK_PATH, String(year), month);
  await ensureDirectory(destDir);
  
  const filename = generateFileName(numeroFE, type, extension);
  const filePath = path.join(destDir, filename);
  
  await fs.writeFile(filePath, buffer);
  
  return {
    filename,
    path: filePath,
    relativePath: `${year}/${month}/${filename}`,
    url: `file:///${filePath.replace(/\\/g, '/')}`
  };
}

/**
 * Exporter A3 DMAIC
 */
export async function exportA3Dmaic(fe) {
  const slide1PngAbs = path.resolve(process.env.SLIDE_BG_A3_DMAIC || "./templates/a3_dmaic_slide1.png");
  
  const buffer = await buildA3DmaicPptx({ fe, slide1PngAbs });
  return await saveToNetwork(buffer, fe.numero_fe, "A3_DMAIC", "pptx");
}

/**
 * Exporter Alerte Qualité
 */
export async function exportAlerteQualite(fe, imagePath = null) {
  const templatePathAbs = path.resolve(process.env.TEMPLATE_ALERTE_QUALITE || "./templates/alerte_qualite_template.xlsx");
  
  const buffer = await buildAlerteQualiteXlsx({ fe, templatePathAbs, imagePathAbs: imagePath });
  return await saveToNetwork(buffer, fe.numero_fe, "Alerte_Qualite", "xlsx");
}

/**
 * Exporter Clinique Qualité
 */
export async function exportCliniqueQualite(fe, qualiticien = "", participants = "") {
  const slide1PngAbs = path.resolve(process.env.SLIDE_BG_CLINIQUE || "./templates/clinique_slide1.png");
  
  const buffer = await buildCliniqueQualitePpt({ fe, slide1PngAbs, qualiticien, participants });
  return await saveToNetwork(buffer, fe.numero_fe, "Clinique_Qualite", "pptx");
}

/**
 * Exporter Dérogation
 */
export async function exportDerogation(fe) {
  const templatePathAbs = path.resolve(process.env.TEMPLATE_DEROGATION || "./templates/derogation_template.xlsx");
  
  const buffer = await buildDerogationXlsx({ fe, templatePathAbs });
  return await saveToNetwork(buffer, fe.numero_fe, "Derogation", "xlsx");
}

/**
 * Lister les exports existants pour une FE
 */
export async function listExports(numeroFE) {
  try {
    const sanitizedNumero = String(numeroFE).replace(/[/\\:*?"<>|]/g, '_');
    const pattern = `FE_${sanitizedNumero}_`;
    
    const exports = [];
    const currentYear = new Date().getFullYear();
    
    // Parcourir les 2 dernières années
    for (let year = currentYear; year >= currentYear - 1; year--) {
      const yearDir = path.join(NETWORK_PATH, String(year));
      
      try {
        const months = await fs.readdir(yearDir);
        
        for (const month of months) {
          const monthDir = path.join(yearDir, month);
          const files = await fs.readdir(monthDir);
          
          for (const file of files) {
            if (file.startsWith(pattern)) {
              const filePath = path.join(monthDir, file);
              const stats = await fs.stat(filePath);
              
              exports.push({
                filename: file,
                path: filePath,
                relativePath: `${year}/${month}/${file}`,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
              });
            }
          }
        }
      } catch (err) {
        // Ignorer les erreurs (dossier inexistant, etc.)
        continue;
      }
    }
    
    // Trier par date de création décroissante
    exports.sort((a, b) => b.created - a.created);
    
    return exports;
  } catch (error) {
    console.error("Erreur lors de la liste des exports:", error);
    return [];
  }
}

export default {
  exportA3Dmaic,
  exportAlerteQualite,
  exportCliniqueQualite,
  exportDerogation,
  listExports
};
