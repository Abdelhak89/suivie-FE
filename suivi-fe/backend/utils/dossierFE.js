// utils/dossierFE.js
// Gestion des dossiers FE sur le serveur K:\PROJETS-DEV\KEP_NC
import fs   from "fs";
import path from "path";

const BASE_PATH = process.env.FE_STORAGE_PATH || "K:\\PROJETS-DEV\\KEP_NC";

// Sous-dossiers créés automatiquement dans chaque FE
const SOUS_DOSSIERS = [
  "photos",
  "alerte_qualite",
  "derogation",
  "8D",
  "bons_retour_fournisseur",
];

/**
 * Construit le chemin d'un dossier FE
 * Ex: K:\PROJETS-DEV\KEP_NC\2026\SOUCY\SOU260001
 */
export function getDossierFEPath(numeroFE, site) {
  const annee   = numeroFE.match(/\d{2}(?=\d{4}$)/) 
    ? "20" + numeroFE.replace(/[^0-9]/g, "").slice(0, 2)
    : new Date().getFullYear().toString();
  const siteUp  = site.toUpperCase();
  return path.join(BASE_PATH, annee, siteUp, numeroFE);
}

/**
 * Crée le dossier FE et ses sous-dossiers
 * Retourne le chemin créé
 */
export function creerDossierFE(numeroFE, site) {
  const dossierPrincipal = getDossierFEPath(numeroFE, site);

  try {
    // Crée le dossier principal
    fs.mkdirSync(dossierPrincipal, { recursive: true });

    // Crée les sous-dossiers
    for (const sd of SOUS_DOSSIERS) {
      fs.mkdirSync(path.join(dossierPrincipal, sd), { recursive: true });
    }

    // Crée un fichier README.txt dans le dossier
    const readme = path.join(dossierPrincipal, "README.txt");
    if (!fs.existsSync(readme)) {
      fs.writeFileSync(readme,
        `Dossier FE : ${numeroFE}\n` +
        `Site       : ${site.toUpperCase()}\n` +
        `Créé le    : ${new Date().toLocaleString("fr-FR")}\n\n` +
        `Sous-dossiers :\n` +
        SOUS_DOSSIERS.map(s => `  - ${s}`).join("\n") + "\n"
      );
    }

    console.log(`[dossierFE] Dossier créé : ${dossierPrincipal}`);
    return { success: true, path: dossierPrincipal };

  } catch (err) {
    console.error(`[dossierFE] Erreur création dossier ${dossierPrincipal}:`, err.message);
    return { success: false, error: err.message, path: dossierPrincipal };
  }
}

/**
 * Sauvegarde un fichier (base64) dans le sous-dossier approprié
 * @param {string} numeroFE
 * @param {string} site
 * @param {string} sousType — "photos" | "alerte_qualite" | "derogation" | "8D" | "bons_retour_fournisseur"
 * @param {string} nomFichier
 * @param {string} base64Data — contenu base64 (avec ou sans préfixe data:...)
 */
export function sauvegarderFichier(numeroFE, site, sousType, nomFichier, base64Data) {
  const dossier = path.join(getDossierFEPath(numeroFE, site), sousType);

  try {
    fs.mkdirSync(dossier, { recursive: true });

    // Nettoyer le base64 si préfixe data:...
    const data = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(data, "base64");

    const filePath = path.join(dossier, nomFichier);
    fs.writeFileSync(filePath, buffer);

    console.log(`[dossierFE] Fichier sauvegardé : ${filePath}`);
    return { success: true, path: filePath };

  } catch (err) {
    console.error(`[dossierFE] Erreur sauvegarde fichier:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Liste les fichiers d'un dossier FE
 */
export function listerFichiersFE(numeroFE, site) {
  const dossierPrincipal = getDossierFEPath(numeroFE, site);
  const result = {};

  if (!fs.existsSync(dossierPrincipal)) {
    return { exists: false, path: dossierPrincipal, files: {} };
  }

  for (const sd of SOUS_DOSSIERS) {
    const sdPath = path.join(dossierPrincipal, sd);
    result[sd] = fs.existsSync(sdPath)
      ? fs.readdirSync(sdPath).filter(f => !f.startsWith("."))
      : [];
  }

  return { exists: true, path: dossierPrincipal, files: result };
}