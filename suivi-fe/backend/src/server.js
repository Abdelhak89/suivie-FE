import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import multer from "multer";
import { importExcelToDb } from "./importExcel.js";
import "dotenv/config";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import { buildAlerteQualiteXlsx } from "./exports/alerteQualiteExport.js";


const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_ALERT_QUALITE = path.join(
  __dirname,
  "../templates/alerte-qualite-template.xlsx"
);

app.get("/exports/alerte-qualite/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // 1) récupérer la FE
    const r = await pool.query(
      `SELECT id, numero_fe, code_article, designation, code_lancement,
              nom_fournisseur, type_nc, lieu_detection, date_creation, data
       FROM fe_records
       WHERE id = $1`,
      [id]
    );

    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "FE introuvable" });

    if (!fs.existsSync(TEMPLATE_ALERT_QUALITE)) {
      return res.status(500).json({
        ok: false,
        error: `Template introuvable: ${TEMPLATE_ALERT_QUALITE}`,
      });
    }

    // 2) charger template
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_ALERT_QUALITE);

    // 3) choisir la feuille
    // (adapte le nom si besoin)
    const ws = wb.getWorksheet("ALERTE") || wb.worksheets[0];

    // 4) remplir des cellules (exemples)
    // 👉 Ici tu dois mapper vers les cellules EXACTES de ton template.
    // Astuce: utilise des "cellules repères" fixes (ex: B4, C6...) ou des Named Ranges.
    ws.getCell("C3").value = fe.numero_fe || "";               // Réf NC
    ws.getCell("C4").value = (fe.data?.Client ?? fe.data?.client ?? "") || ""; // Client (selon ton excel)
    ws.getCell("C5").value = fe.code_lancement || "";          // Lancement
    ws.getCell("C6").value = fe.nom_fournisseur || "";         // Fournisseur
    ws.getCell("C7").value = fe.code_article || "";            // Référence
    ws.getCell("C8").value = fe.designation || "";             // Désignation
    ws.getCell("C9").value = (fe.data?.["Quantité incriminée"] ?? "") || "";   // Qté incriminée (si existe)
    ws.getCell("C10").value = fe.lieu_detection || "";         // Lieu de détection
    ws.getCell("C11").value = fmtDateFR(fe.date_creation);     // Date de détection

    ws.getCell("B13").value =
      (fe.data?.["Description du défaut"] ??
        fe.data?.Description ??
        fe.data?.description ??
        "") || "";

    // 5) envoyer le fichier généré
    const buffer = await wb.xlsx.writeBuffer();

    const filename = `Alerte_Qualite_${fe.numero_fe || fe.id}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error("EXPORT ALERTE QUALITE ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const EXCEL_PATH =
  process.env.EXCEL_PATH || "C:/Users/Abdel/Desktop/Suivi FE V2.xlsm";

/**
 * ✅ Dashboard Qualiticien
 * - Qualiticien = Animateur
 * - Date de référence = date_creation
 * - Relance = date_creation + 3 jours
 */
app.get("/dashboard", async (req, res) => {
  try {
    const user = (req.query.user || "").toString().trim();
    const annee = (req.query.annee || "").toString().trim();
    if (!user) return res.status(400).json({ ok: false, error: "user requis" });

    const sql = `
      WITH base AS (
        SELECT *
        FROM fe_records
        WHERE animateur = $1
          AND ($2 = '' OR annee = $2)
      ),
      bucketed AS (
        SELECT
          CASE
            WHEN COALESCE(statut,'') = '' THEN 'nouvelle'
            WHEN lower(statut) LIKE '%en cours%' THEN 'en_cours'
            WHEN lower(statut) LIKE '%clotur%' OR lower(statut) LIKE '%clôtur%' THEN 'cloturee'
            WHEN lower(statut) LIKE '%annul%' THEN 'annulee'
            ELSE 'en_cours'
          END AS bucket,
          statut,
          date_creation,
          (date_creation + INTERVAL '3 days')::date AS relance_due,
          id, numero_fe, code_article, designation, code_lancement, nom_fournisseur
        FROM base
      )
      SELECT
        (SELECT count(*) FROM bucketed WHERE bucket='nouvelle')  AS nouvelles,
        (SELECT count(*) FROM bucketed WHERE bucket='en_cours')  AS en_cours,
        (SELECT count(*) FROM bucketed WHERE bucket='cloturee')  AS cloturees,
        (SELECT count(*) FROM bucketed WHERE bucket='annulee')   AS annulees,
        (SELECT count(*) FROM bucketed
          WHERE bucket NOT IN ('cloturee','annulee')
            AND date_creation IS NOT NULL
            AND (date_creation + INTERVAL '3 days') < now()
        ) AS a_relancer,
        COALESCE(
          (SELECT json_agg(x) FROM (
            SELECT id, numero_fe, statut, relance_due, code_article, designation, code_lancement, nom_fournisseur
            FROM bucketed
            WHERE bucket NOT IN ('cloturee','annulee')
              AND date_creation IS NOT NULL
              AND (date_creation + INTERVAL '3 days') < now()
            ORDER BY relance_due ASC
            LIMIT 20
          ) x),
          '[]'::json
        ) AS relances
    `;

    const r = await pool.query(sql, [user, annee]);
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
// dans ton server.js
app.post("/fe/:id/close", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(
      `
      UPDATE fe_records
      SET
        statut = 'Clôturée',
        data = jsonb_set(COALESCE(data,'{}'::jsonb), '{Statut}', to_jsonb('Clôturée'::text), true)
      WHERE id = $1
      RETURNING id, statut, data
      `,
      [id],
    );

    if (!r.rows[0])
      return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.get("/exports/alerte-qualite/:id.xlsx", async (req, res) => {
  try {
    const id = req.params.id;

    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [id]);
    const fe = r.rows[0];
    if (!fe) return res.status(404).json({ ok: false, error: "Not found" });

    const buf = await buildAlerteQualiteXlsx({ fe });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Alerte_Qualite_${fe.numero_fe || id}.xlsx"`
    );

    return res.end(Buffer.from(buf));
  } catch (e) {
    console.error("EXPORT ALERTE QUALITE ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * ✅ Stats Manager : par animateur
 */
app.get("/manager/stats", async (req, res) => {
  try {
    const annee = (req.query.annee || "").toString().trim();

    const sql = `
      WITH base AS (
        SELECT *
        FROM fe_records
        WHERE ($1 = '' OR annee = $1)
      ),
      bucketed AS (
        SELECT
          COALESCE(animateur,'(Non affecté)') as animateur,
          CASE
            WHEN COALESCE(statut,'') = '' THEN 'nouvelle'
            WHEN lower(statut) LIKE '%en cours%' THEN 'en_cours'
            WHEN lower(statut) LIKE '%clotur%' OR lower(statut) LIKE '%clôtur%' THEN 'cloturee'
            WHEN lower(statut) LIKE '%annul%' THEN 'annulee'
            ELSE 'en_cours'
          END AS bucket,
          date_creation
        FROM base
      )
      SELECT
        animateur,
        SUM(CASE WHEN bucket='nouvelle' THEN 1 ELSE 0 END) as nouvelles,
        SUM(CASE WHEN bucket='en_cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN bucket='cloturee' THEN 1 ELSE 0 END) as cloturees,
        SUM(CASE WHEN bucket='annulee' THEN 1 ELSE 0 END) as annulees,
        SUM(CASE
          WHEN bucket NOT IN ('cloturee','annulee')
           AND date_creation IS NOT NULL
           AND (date_creation + INTERVAL '3 days') < now()
          THEN 1 ELSE 0 END
        ) as a_relancer,
        COUNT(*) as total
      FROM bucketed
      GROUP BY animateur
      ORDER BY total DESC
    `;
    const r = await pool.query(sql, [annee]);
    res.json({ ok: true, items: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/imports/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "Fichier manquant" });

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
      sheetName: "DATA", // adapte si besoin
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("IMPORT LOCAL ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/fe", async (req, res) => {
  const annee = (req.query.annee ?? "").toString();

  try {
    const q = (req.query.q ?? "").toString();
    const statut = (req.query.statut ?? "").toString();
    const fournisseur = (req.query.fournisseur ?? "").toString();
    const animateur = (req.query.animateur ?? "").toString();

    const page = Math.max(parseInt(req.query.page ?? "1", 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize ?? "25", 10) || 25, 1),
      100,
    );
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

    const totalR = await pool.query(
      `SELECT count(*)::int as total FROM fe_records ${whereSql}`,
      values,
    );
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
      [...values, pageSize, offset],
    );

    res.json({ items: listR.rows, page, pageSize, total });
  } catch (e) {
    console.error("LIST ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * ✅ Qualiticiens = Animateur (pas pilote_qse)
 */
app.get("/qualiticiens", async (req, res) => {
  try {
    const annee = (req.query.annee ?? "").toString().trim();

    const where = [
      `COALESCE(TRIM(animateur),'') <> ''`,
      `lower(TRIM(animateur)) NOT IN ('a prendre en charge', 'à prendre en charge')`,
    ];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    const r = await pool.query(
      `
      SELECT DISTINCT TRIM(animateur) as name
      FROM fe_records
      WHERE ${where.join(" AND ")}
      ORDER BY name ASC
      `,
      values,
    );

    res.json({ items: r.rows.map((x) => x.name) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/fe/:id/assign", async (req, res) => {
  try {
    const { assigned_to } = req.body || {};
    if (!assigned_to)
      return res.status(400).json({ ok: false, error: "assigned_to requis" });

    const r = await pool.query(
      `UPDATE fe_records
       SET assigned_to = $2, assigned_at = now()
       WHERE id = $1
       RETURNING id, assigned_to, assigned_at`,
      [req.params.id, assigned_to],
    );

    if (!r.rows[0])
      return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const cleanKey = (k) =>
  String(k || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\//g, "_")
    .replace(/[.]/g, "")
    .replace(/[%]/g, "pct");

// mapping label UI -> colonne DB top-level (optionnel)
const FIELD_TO_COLUMN = {
  "N° FE": "numero_fe",
  "Numéro de FE": "numero_fe",
  Statut: "statut",
  REF: "code_article",
  "Code Article": "code_article",
  Désignation: "designation",
  Designation: "designation",
  Lancement: "code_lancement",
  "Code Lancement": "code_lancement",
  "Nom Fournisseur": "nom_fournisseur",
  Fournisseur: "nom_fournisseur",
  Animateur: "animateur",
  Semaine: "semaine",
  Année: "annee",
  année: "annee",
  "Date de création": "date_creation",
  QUAND: "date_creation",
};

app.post("/fe/:id/field", async (req, res) => {
  try {
    const id = req.params.id;
    const { label, value } = req.body || {};

    if (!label)
      return res.status(400).json({ ok: false, error: "label requis" });

    const key = cleanKey(label);
    const val = value === undefined || value === null ? "" : String(value);

    // update JSONB data
    // jsonb_set(data, '{key}', to_jsonb(val), true)
    // NB: on stocke en texte (OK V1)
    const column = FIELD_TO_COLUMN[label] || null;

    if (column) {
      // on met à jour data + colonne SQL
      const r = await pool.query(
        `
        UPDATE fe_records
        SET
          data = jsonb_set(COALESCE(data,'{}'::jsonb), $2::text[], to_jsonb($3::text), true),
          ${column} = NULLIF($3::text,'')
        WHERE id = $1
        RETURNING id, data, ${column}
        `,
        [id, `{${key}}`, val],
      );

      if (!r.rows[0])
        return res.status(404).json({ ok: false, error: "Not found" });
      return res.json({ ok: true, item: r.rows[0] });
    } else {
      // seulement data
      const r = await pool.query(
        `
        UPDATE fe_records
        SET
          data = jsonb_set(COALESCE(data,'{}'::jsonb), $2::text[], to_jsonb($3::text), true)
        WHERE id = $1
        RETURNING id, data
        `,
        [id, `{${key}}`, val],
      );

      if (!r.rows[0])
        return res.status(404).json({ ok: false, error: "Not found" });
      return res.json({ ok: true, item: r.rows[0] });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/portfolio", async (req, res) => {
  try {
    const qualiticien = (req.query.qualiticien ?? "").toString();
    if (!qualiticien)
      return res.status(400).json({ ok: false, error: "qualiticien requis" });

    const r = await pool.query(
      `SELECT client FROM qualiticien_clients WHERE qualiticien = $1 ORDER BY client ASC`,
      [qualiticien],
    );
    res.json({ ok: true, items: r.rows.map((x) => x.client) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/portfolio/add", async (req, res) => {
  try {
    const { qualiticien, client } = req.body || {};
    if (!qualiticien || !client)
      return res
        .status(400)
        .json({ ok: false, error: "qualiticien + client requis" });

    await pool.query(
      `INSERT INTO qualiticien_clients (qualiticien, client)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [qualiticien, client],
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/portfolio/remove", async (req, res) => {
  try {
    const { qualiticien, client } = req.body || {};
    if (!qualiticien || !client)
      return res
        .status(400)
        .json({ ok: false, error: "qualiticien + client requis" });

    await pool.query(
      `DELETE FROM qualiticien_clients WHERE qualiticien = $1 AND client = $2`,
      [qualiticien, client],
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/fe/:id", async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM fe_records WHERE id = $1`, [
      req.params.id,
    ]);
    if (!r.rows[0])
      return res.status(404).json({ ok: false, error: "Not found" });
    res.json(r.rows[0]);
  } catch (e) {
    console.error("DETAIL ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// health check
app.get("/health", async (req, res) => {
  res.json({ ok: true });
});
app.get("/whoami", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        current_database() as db,
        current_schema() as schema,
        inet_server_addr() as server_addr,
        inet_server_port() as server_port,
        current_user as user
    `);
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/db", async (req, res) => {
  try {
    const who = await pool.query(`
      SELECT
        current_database() as db,
        current_schema() as schema,
        current_setting('search_path') as search_path,
        inet_server_addr() as server_addr,
        inet_server_port() as server_port,
        current_user as user
    `);

    // 1) Liste des tables visibles
    const tables = await pool.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE tablename ILIKE 'fe_records%'
      ORDER BY schemaname, tablename
    `);

    // 2) Test explicite public.fe_records (évite problème de search_path)
    let stats = null;
    try {
      const r = await pool.query(
        `SELECT now() as now, count(*)::int as total FROM public.fe_records`,
      );
      stats = r.rows[0];
    } catch (e) {
      stats = { now: null, total: null, table_error: e.message };
    }

    res.json({
      ok: true,
      whoami: who.rows[0],
      tables: tables.rows,
      stats,
    });
  } catch (e) {
    console.error("DB ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ Liste des numéros de FE (pour le menu déroulant)
app.get("/fe/numeros", async (req, res) => {
  try {
    const annee = (req.query.annee ?? "").toString().trim();

    const where = [];
    const values = [];
    let i = 1;

    if (annee) {
      where.push(`annee = $${i++}`);
      values.push(annee);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const r = await pool.query(
      `
  SELECT id, numero_fe
  FROM fe_records
  ${whereSql}
  AND COALESCE(numero_fe,'') <> ''
  ORDER BY numero_fe ASC
  `.replace("WHERE AND", "WHERE"),
      values,
    );

    res.json({ ok: true, items: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ Récupérer une FE par numéro (plus simple pour "taper le N° FE")
app.get("/fe/by-numero/:numero", async (req, res) => {
  try {
    const numero = (req.params.numero ?? "").toString().trim();
    if (!numero)
      return res.status(400).json({ ok: false, error: "numero requis" });

    const r = await pool.query(
      `SELECT * FROM fe_records WHERE numero_fe = $1 LIMIT 1`,
      [numero],
    );

    if (!r.rows[0])
      return res.status(404).json({ ok: false, error: "FE introuvable" });
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(3001, () => {
  console.log("API on http://localhost:3001");
});
