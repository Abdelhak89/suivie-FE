// src/config/fieldMap.js

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

const norm = (s) => cleanKey(s).toLowerCase();

/**
 * Colonnes SQL directes
 */
const DIRECT = {
  "N° FE": "numero_fe",
  "Numéro de FE": "numero_fe",
  "Statut": "statut",

  "REF": "code_article",
  "Code Article": "code_article",

  "Désignation": "designation",
  "Designation": "designation",

  "Lancement": "code_lancement",
  "Code Lancement": "code_lancement",

  "Animateur": "animateur",
  "Semaine": "semaine",
  "Année": "annee",
  "année": "annee",

  "QUAND": "date_creation",
  "Date de création": "date_creation",
};

/**
 * 🔁 ALIAS Excel → UI (LA CLÉ DU PROBLÈME)
 */
const DATA_ALIASES = {
  // 🔴 quantités
  "Qté NC": ["Qté Rebuts (pcs)", "Qte Rebuts (pcs)"],
  "Qté Produite": ["Qte produite", "Qté produite"],

  // 🔴 détection
  "Détection": ["Lieu Detection", "Lieu détection"],

  // 🔴 ilot
  "Ilot Générateur": ["ILOT GENERATEUR", "Ilot générateur", "Ilot generateur"],

  // 🔴 désignation fallback
  "Désignation": ["Details de l'anomalie", "Détails de l'anomalie"],
};

/**
 * Lecture générique dans data JSON
 */
function getFromData(data, label) {
  if (!data || typeof data !== "object") return "";

  const key = cleanKey(label);
  if (data[key] != null) return data[key];

  const aliases = DATA_ALIASES[label] || [];
  for (const a of aliases) {
    const ka = cleanKey(a);
    if (data[ka] != null) return data[ka];
  }

  const wanted = norm(label);
  for (const [k, v] of Object.entries(data)) {
    if (norm(k) === wanted) return v;
  }

  return "";
}

/**
 * ✅ Fonction centrale utilisée PARTOUT
 */
export function getField(row, label) {
  if (!row) return "";

  /**
   * 🟠 Analyse
   * - vide → ""
   * - remplie → 🟠
   */
  if (label === "Analyse") {
    const v = row.data?.[cleanKey("Analyse")];
    return String(v || "").trim() ? "🟠" : "";
  }

  /**
   * 🟢 Plan d'action
   * - vide → ""
   * - rempli → 🟢
   */
  if (label === "Plan d'action") {
    const v = row.data?.[cleanKey("Plan d'action")];
    return String(v || "").trim() ? "🟢" : "";
  }

  /**
   * Champs SQL directs
   */
  const direct = DIRECT[label];
  if (direct && row[direct] != null && String(row[direct]).trim() !== "") {
    return row[direct];
  }

  /**
   * Fallback JSON
   */
  return getFromData(row.data, label);
}
