import xlsx from "xlsx";
import { pool } from "./db.js";

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

const get = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return null;
};
function formatDateFR(v) {
  if (!v) return "";

  // si c’est déjà YYYY-MM-DD
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  // si c’est une date JS ou autre format parseable
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  return s; // fallback
}



// ✅ robuste : cherche une valeur par "clé nettoyée" (tolère espaces/accents/casse)
const getByCleanKey = (obj, ...wantedKeys) => {
  const wanted = new Set(wantedKeys.map(cleanKey));
  for (const [k, v] of Object.entries(obj || {})) {
    if (wanted.has(cleanKey(k))) {
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
  }
  return null;
};

// ✅ Excel date helpers
function excelSerialToDate(serial) {
  const ms = (Number(serial) - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function toDateOnly(v) {
  if (v === null || v === undefined) return null;

  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }

  if (typeof v === "number" && isFinite(v)) {
    const d = excelSerialToDate(v);
    return d ? d.toISOString().slice(0, 10) : null;
  }

  const s = String(v).trim();
  if (!s) return null;

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yy = m[3];
    if (yy.length === 2) yy = "20" + yy;
    const iso = `${yy}-${mm}-${dd}`;
    const d2 = new Date(iso);
    if (!isNaN(d2.getTime())) return iso;
  }

  return null;
}

function pickIndexables(raw) {
  const animateur = getByCleanKey(raw, "Animateur");
  const dateCreationRaw = getByCleanKey(
    raw,
    "Date de création",
    "Date de creation",
    "Date creation",
    "Creee le",
    "Créée le",
    "Cree le",
  );

  return {
    numero_fe:
      String(
        getByCleanKey(raw, "Numéro de FE", "Numero de FE", "N° FE") ?? "",
      ).trim() || null,
    statut: String(getByCleanKey(raw, "Statut") ?? "").trim() || null,

    creee_le:
      String(
        getByCleanKey(raw, "Creee le", "Créée le", "Cree le") ?? "",
      ).trim() || null,

    date_creation: toDateOnly(dateCreationRaw), // ✅ DATE

    code_article:
      String(getByCleanKey(raw, "Code Article", "Code article") ?? "").trim() ||
      null,
    designation:
      String(
        getByCleanKey(raw, "Designation", "Désignation") ??
          getByCleanKey(
            raw,
            "Details de l'anomalie",
            "Détails de l'anomalie",
          ) ??
          "",
      ).trim() || null,

    code_lancement:
      String(
        getByCleanKey(raw, "Code Lancement", "Code lancement") ?? "",
      ).trim() || null,

    animateur:
      animateur !== null && animateur !== undefined
        ? String(animateur).trim() || null
        : null,

    origine: String(getByCleanKey(raw, "Origine") ?? "").trim() || null,
    type_nc: String(getByCleanKey(raw, "Type NC") ?? "").trim() || null,
    lieu_detection:
      String(
        getByCleanKey(raw, "Lieu Detection", "Lieu détection") ?? "",
      ).trim() || null,

    code_fournisseur:
      String(
        getByCleanKey(raw, "Code Fournisseur", "Code fournisseur") ?? "",
      ).trim() || null,
    nom_fournisseur:
      String(
        getByCleanKey(raw, "Nom Fournisseur", "Nom fournisseur") ?? "",
      ).trim() || null,

    pilote_qse: String(getByCleanKey(raw, "Pilote QSE") ?? "").trim() || null,
    ilot_generateur:
      String(
        getByCleanKey(
          raw,
          "ILOT GENERATEUR",
          "Ilot générateur",
          "Ilot generateur",
        ) ?? "",
      ).trim() || null,

    semaine:
      String(getByCleanKey(raw, "Semaine", "semaine") ?? "").trim() || null,
    annee:
      String(getByCleanKey(raw, "Année", "annee", "année") ?? "").trim() ||
      null,
  };
}

function toYMD(v) {
  if (!v) return null;

  const d = new Date(v);
  if (isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return {
    annee: String(yyyy),
    mois: mm,
    jour: dd,
    iso: `${yyyy}-${mm}-${dd}`,
  };
}


// ✅ Trouver la vraie ligne d'en-tête (celle qui contient Animateur/Statut/Code Article)
function findHeaderRow(ws, sheetName) {
  const ref = ws["!ref"];
  if (!ref) throw new Error(`Onglet "${sheetName}" vide (!ref manquant)`);

  const range = xlsx.utils.decode_range(ref);

  const mustHave = ["statut", "code article", "animateur"]; // on peut ajuster
  let bestRow = null;
  let bestScore = -1;

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 200); r++) {
    let score = 0;

    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 60); c++) {
      const addr = xlsx.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || cell.v === undefined || cell.v === null) continue;

      const v = String(cell.v).trim().toLowerCase();
      if (!v) continue;

      if (v.includes("statut")) score++;
      if (v.includes("code article")) score++;
      if (v.includes("animateur")) score++;
      if (v.includes("designation") || v.includes("désignation")) score++;
      if (v.includes("code lancement")) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }

  // On veut au moins 2 hits pour être sûr qu'on est bien sur la ligne header
  if (bestRow === null || bestScore < 2) {
    throw new Error(
      `Impossible de détecter la ligne d'en-tête (score=${bestScore}). Vérifie les titres de colonnes.`,
    );
  }

  return bestRow;
}

export async function importExcelToDb({
  filePath,
  originalName,
  sheetName = "DATA",
}) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Onglet "${sheetName}" introuvable`);

  // ✅ détecter le header
  const headerRow = findHeaderRow(ws, sheetName);

  // ✅ lire à partir du header
  // range: headerRow..end
  const ref = ws["!ref"];
  const range = xlsx.utils.decode_range(ref);
  const newRange = {
    s: { r: headerRow, c: range.s.c },
    e: { r: range.e.r, c: range.e.c },
  };
  const a1Range = xlsx.utils.encode_range(newRange);

  const rows = xlsx.utils.sheet_to_json(ws, {
    defval: null,
    range: a1Range, // ✅ start at header row
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE fe_records");

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      // JSONB complet
      const cleaned = {};
      for (const [k, v] of Object.entries(raw)) cleaned[cleanKey(k)] = v;

      const idx = pickIndexables(raw);

      await client.query(
        `INSERT INTO fe_records (
          source_file, source_sheet, source_row,
          numero_fe, statut, creee_le, date_creation,
          code_article, designation, code_lancement,
          animateur, origine, type_nc, lieu_detection,
          code_fournisseur, nom_fournisseur, pilote_qse, ilot_generateur,
          semaine, annee,
          data
        )
        VALUES (
          $1, $2, $3,
          $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20,
          $21
        )`,
        [
          originalName,
          sheetName,
          // ✅ source_row = ligne excel réelle (headerRow + 2 + i)
          // +1 car excel est 1-indexed, +1 pour passer header => +2
          headerRow + 2 + i,

          idx.numero_fe,
          idx.statut,
          idx.creee_le,
          idx.date_creation,

          idx.code_article,
          idx.designation,
          idx.code_lancement,

          idx.animateur,
          idx.origine,
          idx.type_nc,
          idx.lieu_detection,

          idx.code_fournisseur,
          idx.nom_fournisseur,
          idx.pilote_qse,
          idx.ilot_generateur,

          idx.semaine,
          idx.annee,

          cleaned,
        ],
      );
    }

    await client.query("COMMIT");
    return { inserted: rows.length, headerRow: headerRow + 1 }; // +1 pour Excel (1-indexed)
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
