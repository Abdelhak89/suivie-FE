// routes/clients.js
// Fournit les préfixes clients distincts depuis Diapason (LCTE.NomClient + LEFT(CodeArticle,3))
import { Router } from "express";
import { getPool } from "../db-sqlserver.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

const SITE_POOL_MAP = {
  soucy: "ktissoucy",
  sens:  "ktissoucy",
  laxou: "ktislaxou",
  kmtm:  "kmtm",
};

// GET /api/clients/prefixes?site=soucy
// Retourne [{prefixe, nom_client}] triés par nom_client
router.get("/prefixes", verifyToken, async (req, res) => {
  const site     = req.query.site?.toLowerCase() || "soucy";
  const poolKey  = SITE_POOL_MAP[site] || "ktissoucy";
  const pool     = getPool(poolKey);

  try {
    const result = await pool.request().query(`
      SELECT
        LEFT(LTRIM(RTRIM(n.CodeArticle)), 3) AS prefixe,
        COUNT(DISTINCT n.NonConformite)       AS nb_fe
      FROM dbo.NCONFORMITE n
      WHERE n.CodeArticle IS NOT NULL
        AND LEN(LTRIM(RTRIM(n.CodeArticle))) >= 3
      GROUP BY LEFT(LTRIM(RTRIM(n.CodeArticle)), 3)
      ORDER BY LEFT(LTRIM(RTRIM(n.CodeArticle)), 3)
    `);

    res.json({ success: true, data: result.recordset, site });

  } catch (err) {
    console.error("[clients GET /prefixes]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;