// src/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { buildDerogationXlsx } from "./exports/derogationExport.js";

import { pool } from "./db.js";
import { importExcelToDb } from "./importExcel.js";
import { buildAlerteQualiteXlsx } from "./exports/alerteQualiteExport.js";

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

app.listen(3001, () => {
  console.log("API on http://localhost:3001");
});
