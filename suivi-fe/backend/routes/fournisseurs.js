// routes/fournisseurs.js
import express from "express";
import { getPool } from "../db-sqlserver.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        LTRIM(RTRIM(CodeFournisseur)) AS code,
        LTRIM(RTRIM(NomFournisseur))  AS label
      FROM FOU
      WHERE NomFournisseur IS NOT NULL
        AND LTRIM(RTRIM(NomFournisseur)) <> ''
        AND BlocageCde <> 'O'
      ORDER BY NomFournisseur
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Erreur GET /api/fournisseurs:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;