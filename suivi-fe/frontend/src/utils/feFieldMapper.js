// src/utils/feFieldMapper.js
// Mapper les champs de la table NCONFORMITE vers l'affichage

/**
 * Décoder le type NC depuis OrigineNonConf
 */
function decodeTypeNC(code) {
  if (!code) return null;
  
  const mapping = {
    "CINT": "Interne",
    "DFOU": "Fournisseur", 
    "RCLI": "Client",
    "CEXT": "Client Externe"
  };
  
  return mapping[code.trim()] || code;
}

/**
 * Extraire la valeur d'un champ d'une FE
 */
export function getFieldValue(fe, fieldName) {
  if (!fe) return null;
  
  // Mapping des champs principaux
  const fieldMap = {
    // Identifiants
    "N° FE": fe.numero_fe,
    "Numéro FE": fe.numero_fe,
    "REF": fe.code_article,
    "Code Article": fe.code_article,
    "Article": fe.code_article,
    "Lancement": fe.code_lancement,
    "Code Lancement": fe.code_lancement,
    
    // Dates
    "Date": formatDate(fe.date_creation),
    "Date Création": formatDate(fe.date_creation),
    "Date NC": formatDate(fe.date_creation),
    "Date Découverte": formatDate(fe.date_decouverte),
    "Date Décision": formatDate(fe.date_decision),
    "Date Action": formatDate(fe.date_action),
    "QUAND": formatDate(fe.date_creation),
    
    // Informations générales
    "Désignation": fe.designation,
    "Description": getDescription(fe),
    "Statut": fe.statut,
    "Origine": fe.origine,
    "Type NC": decodeTypeNC(fe.origine), // ✅ CORRIGÉ: décode CINT/DFOU/RCLI
    "Type": decodeTypeNC(fe.origine),
    "Sous-Origine": fe.sous_origine,
    "Sous-Type": fe.sous_type_nc,
    
    // Quantités
    "Qté NC": formatNumber(fe.qte_estimee), // ✅ CORRIGÉ: utilise qte_estimee
    "Qte NC": formatNumber(fe.qte_estimee),
    "Qté Non Conforme": formatNumber(fe.qte_non_conforme),
    "Qté Acceptée": formatNumber(fe.qte_acceptee),
    "Qté Remise Conf": formatNumber(fe.qte_remise_conf),
    "Qté Rebutée": formatNumber(fe.qte_rebutee),
    "Qté Produite": formatNumber(fe.qte_produite), // ✅ CORRIGÉ
    "Qte Produite": formatNumber(fe.qte_produite),
    "Qté Lancement": formatNumber(fe.qte_lancement),
    "Qté Estimée": formatNumber(fe.qte_estimee),
    
    // Détection
    "Détection": fe.lieu_detection, // ✅ CORRIGÉ: uniquement lieu_detection (catégorisé)
    "Lieu Détection": fe.lieu_detection,
    "Lieu": fe.lieu_detection,
    "Découvert Par": fe.decouvert_par,
    "Ilot Générateur": fe.ilot_generateur, // ✅ AJOUTÉ
    "Phase": fe.ilot_generateur,
    
    // Responsabilités
    "Fournisseur Resp": fe.fournisseur_resp,
    "Opérateur Resp": fe.operateur_resp,
    "Machine Resp": fe.machine_resp,
    "Pilote NC": "", // À mapper
    "Pilote QSE": "", // À mapper
    "Animateur": "", // À mapper depuis data
    
    // Avancements
    "Avancement": formatPercent(fe.avancement_global),
    "Avancement Global": formatPercent(fe.avancement_global),
    "Avancement Analyse": formatPercent(fe.avancement_analyse),
    "Avancement Traitement": formatPercent(fe.avancement_traitement),
    
    // Coûts
    "Coût Gestion": formatCurrency(fe.cout_gestion),
    "Coût Remise Conf": formatCurrency(fe.cout_remise_conf),
    "Coût Rebut": formatCurrency(fe.cout_rebut),
    
    // Client/Affaire
    "Client": fe.client_fourn,
    "N° Commande": fe.no_commande,
    "Commande": fe.no_commande,
    "Affaire": fe.numero_affaire,
    "N° Affaire": fe.numero_affaire,
    
    // Analyse et actions
    "Analyse": getFromData(fe, ["Analyse", "Analyse 6M"]),
    "D2R": getFromData(fe, ["D2R", "Decision 2R"]),
    "Plan d'action": getFromData(fe, ["Plan d'action", "Plan action"]),
    "Mesure efficacité": getFromData(fe, ["Mesure efficacité", "Mesure efficacite"]),
    "Actions correctives": getFromData(fe, ["Actions correctives"]),
    "Actions préventives": getFromData(fe, ["Actions préventives"]),
    
    // Autres champs spécifiques
    "Type de défaut": getFromData(fe, ["Type de défaut", "Type defaut"]),
    "Typologie défaut": getFromData(fe, ["Typologie défaut", "Type de défaut"]),
    "NC client": getFromData(fe, ["NC client", "N° rapport client"]),
    "Fournisseur": getFromData(fe, ["Fournisseur", "Nom fournisseur"]),
    
    // Priorité et gravité
    "Priorité": fe.priorite,
    "Gravité": fe.gravite,
  };
  
  // Si le champ est mappé, le retourner
  if (fieldName in fieldMap) {
    return fieldMap[fieldName];
  }
  
  // Sinon, chercher dans data
  return getFromData(fe, [fieldName]);
}

/**
 * Obtenir la description depuis plusieurs sources possibles
 */
function getDescription(fe) {
  // D'abord chercher dans les champs principaux
  if (fe.designation) return fe.designation;
  
  // Puis chercher dans data
  return getFromData(fe, [
    "Details de l'anomalie",
    "Détails de l'anomalie", 
    "Detail de l'anomalie",
    "Description",
    "Anomalie"
  ]);
}

/**
 * Chercher une valeur dans fe.data par plusieurs clés possibles
 */
function getFromData(fe, keys) {
  if (!fe?.data || typeof fe.data !== "object") return null;
  
  for (const key of keys) {
    // Recherche exacte
    if (key in fe.data && fe.data[key] != null) {
      return fe.data[key];
    }
    
    // Recherche insensible à la casse
    const lowerKey = key.toLowerCase();
    for (const [dataKey, value] of Object.entries(fe.data)) {
      if (dataKey.toLowerCase() === lowerKey && value != null) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Formater une date
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

/**
 * Formater un nombre
 */
function formatNumber(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('fr-FR');
}

/**
 * Formater un pourcentage
 */
function formatPercent(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (isNaN(num)) return value;
  return `${num}%`;
}

/**
 * Formater une devise
 */
function formatCurrency(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (isNaN(num)) return value;
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/**
 * Obtenir la valeur brute (non formatée) d'un champ
 */
export function getRawFieldValue(fe, fieldName) {
  if (!fe) return null;
  
  // Mapping des champs bruts (sans formatage)
  const rawFieldMap = {
    "N° FE": fe.numero_fe,
    "REF": fe.code_article,
    "Lancement": fe.code_lancement,
    "Date": fe.date_creation,
    "Date Création": fe.date_creation,
    "Désignation": fe.designation,
    "Statut": fe.statut,
    "Origine": fe.origine,
    "Type NC": fe.origine, // ✅ CORRIGÉ: retourne le code brut (CINT, DFOU, RCLI)
    "Qté NC": fe.qte_estimee,
    "Qté Produite": fe.qte_produite,
    "Détection": fe.lieu_detection,
    "Avancement": fe.avancement_global,
    "Coût Gestion": fe.cout_gestion,
  };
  
  if (fieldName in rawFieldMap) {
    return rawFieldMap[fieldName];
  }
  
  return getFromData(fe, [fieldName]);
}

export default {
  getFieldValue,
  getRawFieldValue
};