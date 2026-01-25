// src/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { buildDerogationXlsx } from "./exports/derogationExport.js";
import { CLIENTS_BY_CODE } from "./data/clients.js";
import { getClientNameFromCode } from "./data/clients.js";
import { pool } from "./db.js";
import { importExcelToDb } from "./importExcel.js";
import { buildAlerteQualiteXlsx } from "./exports/alerteQualiteExport.js";
import { buildA3DmaicPptx } from "./exports/a3DmaicExport.js";
import { buildCliniqueQualitePptx } from "./exports/cliniqueQualiteExport.js";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================
// Config chemins
// =====================
const EXCEL_PATH = process.env.EXCEL_PATH || "C:/Users/Abdel/Desktop/Suivi FE V2.xlsm";

const TEMPLATE_ALERT_QUALITE = path.join(__dirname, "../templates/alerte-qualite-template.xlsx");

// dossier images Alerte Qualité
const AQ_IMG_DIR = path.join(__dirname, "../uploads/aq_images");
fs.mkdirSync(AQ_IMG_DIR, { recursive: true });

// =====================
// Multer
// =====================
const upload = multer({ dest: "uploads/" });

const aqImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AQ_IMG_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || "").toLowerCase() || ".jpg").replace(/\s/g, "");
    cb(null, `${req.params.id}${ext}`);
  },
});
const uploadAqImage = multer({ storage: aqImageStorage });


function clientNameFromRef(codeArticle) {
  const ref = String(codeArticle || "").trim();
  const code = ref.slice(0, 3);
  return CLIENTS_BY_CODE[code] || code || "";
}

function buildPareto(items) {
  const total = items.reduce((s, x) => s + (x.count || 0), 0) || 1;
  let cum = 0;
  return items.map((x) => {
    cum += x.count || 0;
    return {
      ...x,
      pct: Math.round(((x.count || 0) * 10000) / total) / 100,       // %
      cumPct: Math.round((cum * 10000) / total) / 100,             // cumul %
      total,
    };
  });
}

// =====================
// Routes Alerte Qualité
// =====================
app.get("/exports/derogation/:id.xlsx", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [id]);
    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "Not found" });

    const templatePathAbs = path.join(__dirname, "../templates/derogation-template.xlsx");
    const buf = await buildDerogationXlsx({ fe, templatePathAbs });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Demande_Derogation_${fe.numero_fe || id}.xlsx"`
    );
    return res.end(Buffer.from(buf));
  } catch (e) {
    console.error("EXPORT DEROGATION ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ upload image liée à une FE
app.post("/exports/alerte-qualite/:id/image", uploadAqImage.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "image manquante" });
    return res.json({ ok: true, file: req.file.filename });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ export .xlsx (insère l'image si existante)
app.get("/exports/alerte-qualite/:id.xlsx", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [id]);
    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "Not found" });

    // cherche une image uploadée (png/jpg/jpeg) pour cet id
    const candidates = [".png", ".jpg", ".jpeg", ".webp"].map((ext) =>
      path.join(AQ_IMG_DIR, `${id}${ext}`)
    );
    const imagePathAbs = candidates.find((p) => fs.existsSync(p)) || null;

    const buf = await buildAlerteQualiteXlsx({
      fe,
      templatePathAbs: TEMPLATE_ALERT_QUALITE,
      imagePathAbs,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Alerte_Qualite_${fe.numero_fe || id}.xlsx"`);
    return res.end(Buffer.from(buf));
  } catch (e) {
    console.error("EXPORT ALERTE QUALITE ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// =====================
// Le reste de tes routes
// =====================

// health
app.get("/health", async (req, res) => res.json({ ok: true }));

// import excel
app.post("/imports/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "Fichier manquant" });

    const result = await importExcelToDb({
      filePath: req.file.path,
      originalName: req.file.originalname,
      sheetName: "DATA",
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("IMPORT ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/imports/excel/local", async (req, res) => {
  try {
    const result = await importExcelToDb({
      filePath: EXCEL_PATH,
      sheetName: "DATA",
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("IMPORT LOCAL ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// liste FE
app.get("/fe", async (req, res) => {
  const annee = (req.query.annee ?? "").toString();

  try {
    const q = (req.query.q ?? "").toString();
    const statut = (req.query.statut ?? "").toString();
    const fournisseur = (req.query.fournisseur ?? "").toString();
    const animateur = (req.query.animateur ?? "").toString();

    const page = Math.max(parseInt(req.query.page ?? "1", 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize ?? "25", 10) || 25, 1), 100);
    const offset = (page - 1) * pageSize;

    const where = [];
    const values = [];
    let i = 1;

    if (statut) {
      where.push(`statut ILIKE $${i++}`);
      values.push(`%${statut}%`);
    }
    if (fournisseur) {
      where.push(`nom_fournisseur ILIKE $${i++}`);
      values.push(`%${fournisseur}%`);
    }
    if (animateur) {
      where.push(`animateur ILIKE $${i++}`);
      values.push(`%${animateur}%`);
    }
    if (q) {
      where.push(`(
        COALESCE(numero_fe,'') ILIKE $${i} OR
        COALESCE(code_article,'') ILIKE $${i} OR
        COALESCE(designation,'') ILIKE $${i} OR
        COALESCE(code_lancement,'') ILIKE $${i}
      )`);
      values.push(`%${q}%`);
      i++;
    }
    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalR = await pool.query(`SELECT count(*)::int as total FROM fe_records ${whereSql}`, values);
    const total = totalR.rows[0]?.total ?? 0;

    const listR = await pool.query(
      `SELECT
        id, numero_fe, statut,
        code_article, designation, code_lancement,
        nom_fournisseur,
        animateur,
        date_creation,
        annee, semaine,
        imported_at,
        data
      FROM fe_records
      ${whereSql}
      ORDER BY imported_at DESC
      LIMIT $${i++} OFFSET $${i++}`,
      [...values, pageSize, offset]
    );

    res.json({ items: listR.rows, page, pageSize, total });
  } catch (e) {
    console.error("LIST ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// détail
app.get("/fe/:id", async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ ok: false, error: "Not found" });
    res.json(r.rows[0]);
  } catch (e) {
    console.error("DETAIL ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.get("/kpi/pareto", async (req, res) => {
  try {
    const annee = (req.query.annee ?? "").toString().trim();
    const axis = (req.query.axis ?? "origine").toString().trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? "15", 10) || 15, 1), 100);

    const where = [];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Axes dispo
    if (axis === "origine") {
      const r = await pool.query(
        `
        SELECT COALESCE(NULLIF(TRIM(origine),''),'(Vide)') as label,
               count(*)::int as count
        FROM fe_records
        ${whereSql}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT ${limit}
        `,
        values
      );
      return res.json({ ok: true, axis, items: buildPareto(r.rows) });
    }

    if (axis === "ilot") {
      const r = await pool.query(
        `
        SELECT COALESCE(NULLIF(TRIM(ilot_generateur),''),'(Vide)') as label,
               count(*)::int as count
        FROM fe_records
        ${whereSql}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT ${limit}
        `,
        values
      );
      return res.json({ ok: true, axis, items: buildPareto(r.rows) });
    }

    if (axis === "ref") {
      const r = await pool.query(
        `
        SELECT COALESCE(NULLIF(TRIM(code_article),''),'(Vide)') as label,
               count(*)::int as count
        FROM fe_records
        ${whereSql}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT ${limit}
        `,
        values
      );
      return res.json({ ok: true, axis, items: buildPareto(r.rows) });
    }

    // ✅ Type défaut : on privilégie type_nc (colonne), sinon data->Type défaut 1 / Type defaut 1 / Type NC
    if (axis === "type_defaut") {
      const r = await pool.query(
        `
        SELECT COALESCE(
                 NULLIF(TRIM(type_nc),''),
                 NULLIF(TRIM(data->>'Type défaut 1'),''),
                 NULLIF(TRIM(data->>'Type defaut 1'),''),
                 NULLIF(TRIM(data->>'Type NC'),''),
                 '(Vide)'
               ) as label,
               count(*)::int as count
        FROM fe_records
        ${whereSql}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT ${limit}
        `,
        values
      );
      return res.json({ ok: true, axis, items: buildPareto(r.rows) });
    }

    // ✅ Client : basé sur les 3 premiers chiffres de la REF (code_article)
    if (axis === "client") {
      const r = await pool.query(
        `
        SELECT COALESCE(NULLIF(TRIM(code_article),''),'') as ref,
               count(*)::int as count
        FROM fe_records
        ${whereSql}
        GROUP BY 1
        ORDER BY count DESC
        `,
        values
      );

      // regroupe par code client (3 premiers chiffres)
      const map = new Map();
      for (const row of r.rows) {
        const ref = row.ref || "";
        const code = String(ref).slice(0, 3);
        const name = CLIENTS_BY_CODE[code] || code || "(Vide)";
        map.set(name, (map.get(name) || 0) + row.count);
      }

      const items = [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return res.json({ ok: true, axis, items: buildPareto(items) });
    }

    return res.status(400).json({ ok: false, error: "axis invalide" });
  } catch (e) {
    console.error("KPI PARETO ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
function axisSql(axis) {
  switch (axis) {
    case "type_nc":
      return `NULLIF(TRIM(type_nc), '')`;
    case "ilot":
      return `NULLIF(TRIM(ilot_generateur), '')`;
    case "ref":
      return `NULLIF(TRIM(code_article), '')`;
    case "defaut":
      // adapte les clés selon ton Excel (Type defaut 1 / Type Défaut 1 / etc)
      return `NULLIF(TRIM(COALESCE(data->>'Type defaut 1', data->>'Type Défaut 1', data->>'Type Defaut 1')), '')`;
    case "client":
      // client = 3 premiers chiffres de REF (code_article)
      return `LEFT(COALESCE(code_article,''), 3)`;
    default:
      return null;
  }
}

// Pareto : retourne {label, count, cumCount, cumPct}
app.get("/kpi/pareto", async (req, res) => {
  try {
    const axis = (req.query.axis || "").toString().trim(); // type_nc|client|defaut|ilot|ref
    const annee = (req.query.annee || "").toString().trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10) || 12, 3), 50);

    const expr = axisSql(axis);
    if (!expr) return res.status(400).json({ ok: false, error: "axis invalide" });

    const where = [];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    // optionnel: filtre FE annulées/clôturées etc (si tu veux)
    // where.push(`COALESCE(statut,'') NOT ILIKE '%annul%'`);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 1) top items
    const sql = `
      WITH base AS (
        SELECT ${expr} AS label
        FROM fe_records
        ${whereSql}
      ),
      agg AS (
        SELECT
          COALESCE(NULLIF(label,''), '(Vide)') AS label,
          COUNT(*)::int AS count
        FROM base
        GROUP BY 1
      ),
      ranked AS (
        SELECT *
        FROM agg
        ORDER BY count DESC, label ASC
        LIMIT ${limit}
      ),
      tot AS (
        SELECT SUM(count)::int AS total FROM agg
      )
      SELECT
        r.label,
        r.count,
        SUM(r.count) OVER (ORDER BY r.count DESC, r.label ASC)::int AS cumCount,
        ROUND(
          (SUM(r.count) OVER (ORDER BY r.count DESC, r.label ASC)::numeric / NULLIF((SELECT total FROM tot),0)) * 100
        , 1) AS cumPct,
        (SELECT total FROM tot)::int AS total
      FROM ranked r
      ORDER BY r.count DESC, r.label ASC
    `;

    const r = await pool.query(sql, values);
    let items = r.rows || [];

    // 2) si axis=client -> convertir code->nom (mapping JS)
    if (axis === "client") {
      items = items.map((x) => {
        const code = String(x.label || "").trim();
        const name = getClientNameFromCode ? getClientNameFromCode(code) : "";
        return { ...x, label: name ? `${code} - ${name}` : code };
      });
    }

    res.json({ ok: true, axis, annee, items, total: items[0]?.total ?? 0 });
  } catch (e) {
    console.error("KPI PARETO ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// KPI "cartes" (total, par statut, etc.)
app.get("/kpi/summary", async (req, res) => {
  try {
    const annee = (req.query.annee || "").toString().trim();
    const where = [];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN COALESCE(statut,'') = '' THEN 1 ELSE 0 END)::int AS nouvelles,
        SUM(CASE WHEN lower(COALESCE(statut,'')) LIKE '%en cours%' THEN 1 ELSE 0 END)::int AS en_cours,
        SUM(CASE WHEN lower(COALESCE(statut,'')) LIKE '%clotur%' OR lower(COALESCE(statut,'')) LIKE '%clôtur%' THEN 1 ELSE 0 END)::int AS cloturees,
        SUM(CASE WHEN lower(COALESCE(statut,'')) LIKE '%annul%' THEN 1 ELSE 0 END)::int AS annulees
      FROM fe_records
      ${whereSql}
    `;

    const r = await pool.query(sql, values);
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    console.error("KPI SUMMARY ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

function cleanKey(k) {
  return String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");
}

function getDataByKeys(row, ...keys) {
  const data = row?.data;
  if (!data || typeof data !== "object") return "";
  const wanted = new Set(keys.map(cleanKey));
  for (const [k, v] of Object.entries(data)) {
    if (wanted.has(cleanKey(k))) {
      if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
    }
  }
  return "";
}

function inc(map, key, label) {
  const k = key || "(Vide)";
  if (!map[k]) map[k] = { key: k, label: label || k, count: 0 };
  map[k].count += 1;
}

app.get("/kpi", async (req, res) => {
  try {
    const annee = (req.query.annee ?? "").toString().trim();
    const scope = (req.query.scope ?? "all").toString().trim(); // all|interne|client|fournisseur

    const where = [];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    // on récupère le minimum
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const r = await pool.query(
      `
      SELECT
        id, type_nc, code_article, ilot_generateur, date_creation, data
      FROM fe_records
      ${whereSql}
      `,
      values
    );

    const rows = r.rows || [];

    // scope filter (type_nc)
    const filtered = scope === "all"
      ? rows
      : rows.filter(x => String(x.type_nc || "").toLowerCase().includes(scope));

    // totals
    const totals = {
      total: filtered.length,
      interne: filtered.filter(x => String(x.type_nc || "").toLowerCase().includes("interne")).length,
      client: filtered.filter(x => String(x.type_nc || "").toLowerCase().includes("client")).length,
      fournisseur: filtered.filter(x => String(x.type_nc || "").toLowerCase().includes("fourn")).length,
    };

    // group maps
    const byClients = {};
    const byTypeDefaut = {};
    const byIlot = {};
    const byRef = {};

    // timeseries (par jour)
    const byDay = {};

    for (const x of filtered) {
      const ref = String(x.code_article || "").trim();
      const clientCode = ref.slice(0, 3);
      const clientName = getClientNameFromCode(clientCode) || clientCode || "(Client inconnu)";
      inc(byClients, clientCode || "(Vide)", clientName);

      const ilot = String(x.ilot_generateur || "").trim() || "(Vide)";
      inc(byIlot, ilot, ilot);

      inc(byRef, ref || "(Vide)", ref || "(Vide)");

      const typeDefaut =
        getDataByKeys(x, "Type defaut 1", "Type Defaut 1", "Type défaut 1") ||
        getDataByKeys(x, "Type defaut 2", "Type Defaut 2", "Type défaut 2") ||
        getDataByKeys(x, "Type defaut 3", "Type Defaut 3", "Type défaut 3") ||
        "(Vide)";
      inc(byTypeDefaut, typeDefaut, typeDefaut);

      const d = x.date_creation ? String(x.date_creation).slice(0, 10) : "";
      if (d) byDay[d] = (byDay[d] || 0) + 1;
    }

    const toArr = (m) => Object.values(m).sort((a, b) => b.count - a.count);

    const timeseries = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      ok: true,
      totals,
      axes: {
        clients: toArr(byClients),
        typeDefaut: toArr(byTypeDefaut),
        ilot: toArr(byIlot),
        ref: toArr(byRef),
      },
      timeseries,
    });
  } catch (e) {
    console.error("KPI ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /exports/a3-dmaic/:id.pptx
app.get("/exports/a3-dmaic/:id.pptx", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [id]);
    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "Not found" });

    // ✅ image de fond (export PowerPoint de la slide 1)
    const slide1PngAbs = path.join(__dirname, "../templates/a3_dmaic_slide1.png");

    const buf = await buildA3DmaicPptx({ fe, slide1PngAbs });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="A3_DMAIC_${fe.numero_fe || id}.pptx"`
    );
    return res.end(Buffer.from(buf));
  } catch (e) {
    console.error("EXPORT A3 DMAIC ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.get("/exports/clinique-qualite/:id.pptx", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [id]);
    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "Not found" });

    // Tu mets ton image de fond ici (copiée dans backend/templates/)
    const backgroundPngAbs = path.join(__dirname, "../templates/A3_DMAIC-rev3-slide1.png");

    const qualiticien = (req.query.qualiticien || "").toString();
    const participants = (req.query.participants || "").toString();

    const buf = await buildCliniqueQualitePptx({
      fe,
      backgroundPngAbs,
      qualiticien,
      participants,
    });

    const fileName = `Clinique_Qualite_${fe.numero_fe || id}.pptx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.end(Buffer.from(buf));
  } catch (e) {
    console.error("EXPORT CLINIQUE QUALITE ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.listen(3001, () => {
  console.log("API on http://localhost:3001");
});
