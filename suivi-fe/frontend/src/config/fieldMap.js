// src/config/fieldMap.js

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

const norm = (s) => cleanKey(s).toLowerCase();

const DIRECT = {
  "N° FE": "numero_fe",
  "Numéro de FE": "numero_fe",
  Statut: "statut",

  REF: "code_article",
  "Code Article": "code_article",

  "Désignation": "designation",
  Designation: "designation",

  Lancement: "code_lancement",
  "Code Lancement": "code_lancement",
  Lct: "code_lancement",

  Fournisseur: "nom_fournisseur",
  "Nom Fournisseur": "nom_fournisseur",

  Animateur: "animateur",
  Semaine: "semaine",
  année: "annee",
  Année: "annee",

  QUAND: "date_creation",
  "Date de création": "date_creation",
};

// ✅ tes réassignations Excel -> App (DATA jsonb)
const DATA_ALIASES = {
  // (si besoin, garde tes alias existants)
  "Qté NC": ["Qté Rebuts (pcs)", "Qte Rebuts (pcs)", "Qté Rebuts pcs"],
  "Qté Produite": ["Qte produite", "Qté produite", "Qte Produite"],
  "Détection": ["Lieu Detection", "Lieu détection", "Lieu detection"],
  "Ilot Générateur": ["ILOT GENERATEUR", "Ilot générateur", "Ilot generateur"],
  "Description": ["Details de l'anomalie"],
  "Qté NC":["Qte estimee"],
  "Qté Lct": ["Qte lancement"],
  "Lieu":["Lieu Detection"],
};

function getFromDataByLabel(data, label) {
  if (!data || typeof data !== "object") return "";

  // exact
  if (data[label] !== undefined && data[label] !== null) return data[label];

  // cleaned
  const k1 = cleanKey(label);
  if (data[k1] !== undefined && data[k1] !== null) return data[k1];

  // Plan d'action typographic apostrophe
  if (label === "Plan d'action") {
    const alt = "Plan d’action";
    if (data[alt] !== undefined && data[alt] !== null) return data[alt];
    const altCk = cleanKey(alt);
    if (data[altCk] !== undefined && data[altCk] !== null) return data[altCk];
  }

  // aliases
  const aliases = DATA_ALIASES[label] || [];
  for (const a of aliases) {
    if (data[a] !== undefined && data[a] !== null) return data[a];
    const ka = cleanKey(a);
    if (data[ka] !== undefined && data[ka] !== null) return data[ka];
  }

  // normalize fallback
  const wanted = norm(label);
  for (const [k, v] of Object.entries(data)) {
    if (norm(k) === wanted) return v;
  }

  return "";
}

function safeParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function planComplete(planRaw) {
  const arr = safeParse(planRaw);
  if (!Array.isArray(arr) || arr.length === 0) return false;

  return arr.every((a) => {
    const textOk = String(a?.text || "").trim().length > 0;
    if (!textOk) return false;
    if (a?.done) return true;
    if (a?.notRealizable && String(a?.note || "").trim()) return true;
    return false;
  });
}

// ✅ valeur brute (texte complet)
export function getRawField(row, label) {
  if (!row) return "";

  const directKey = DIRECT[label];
  if (directKey && row[directKey] !== undefined && row[directKey] !== null) {
    const v = row[directKey];
    if (String(v).trim() !== "") return v;
  }

  return getFromDataByLabel(row.data || null, label);
}
function formatDateFR(v) {
  if (!v) return "";

  // si déjà au format YYYY-MM-DD (stocké DB)
  const s = String(v).trim();
  if (!s) return "";

  // ex: "2026-01-22"
  const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) {
    const yyyy = mIso[1];
    const mm = mIso[2];
    const dd = mIso[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  // si Date JS ou string parsable
  const d = v instanceof Date ? v : new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // fallback
  return s;
}


// ✅ valeur affichée (icônes / pastilles)
export function getField(row, label) {
  const raw = getRawField(row, label);

  // Analyse : ✅ si rempli
  if (label === "Analyse") {
    return String(raw || "").trim() ? "✅" : "";
  }
  

  // Plan d'action : 🟢 si plan complet, 🟠 si analyse ok mais plan incomplet
  if (label === "Plan d'action") {
    const analyse = String(getRawField(row, "Analyse") || "").trim();
    const plan = String(raw || "").trim();

    if (plan && planComplete(plan)) return "🟢";
    if (analyse) return "🟠";
    return "";
  }

  if (label === "QUAND" || label === "Date de création") {
    // ta colonne SQL c’est date_creation
    const v = row?.date_creation ?? "";
    return formatDateFR(v);
  }

  return raw;
}
