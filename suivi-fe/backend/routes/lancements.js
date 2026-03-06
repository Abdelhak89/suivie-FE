// routes/lancements.js
import express from "express";
import { getPool } from "../db-sqlserver.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pool  = await getPool();
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const { code_article, statut } = req.query;

    const request = pool.request();
    request.timeout = 30000;

    // ── CAS 1 : prochains lancements d'un article précis ─────────────────────
    if (code_article) {
      request.input("code_article", code_article);
      const sql = `
        SELECT TOP (${limit})
          lcte.CodeLancement,
          LTRIM(RTRIM(lcte.CodeArticle))     AS CodeArticle,
          LTRIM(RTRIM(lcte.DesignationArt1)) AS DesignationArt1,
          LTRIM(RTRIM(lcte.DesignationLct1)) AS DesignationLct1,
          lcte.DateFinPlanifiee,
          lcte.DateDebutPlanifiee,
          lcte.QuantiteLancee,
          lcte.LancementSolde,
          lcte.LctTermine,
          NULL AS CodePosteEnCours
        FROM LCTE lcte
        WHERE LTRIM(RTRIM(lcte.CodeArticle)) = LTRIM(RTRIM(@code_article))
        ORDER BY lcte.DateFinPlanifiee ASC, lcte.CodeLancement ASC
      `;
      const result = await request.query(sql);
      const data = (result.recordset || []).map(r => ({
        ...r,
        StatutCalcule: r.LctTermine === "O" || r.LancementSolde === "O" ? "Terminé" : "Non démarré",
      }));
      return res.json({ success: true, data, count: data.length });
    }

    // ── CAS 2 : lancements terminés bloqués DVI / FAB SUP ────────────────────
    // Stratégie 2 requêtes pour éviter timeout sur _KepAbArtBlocQualite
    if (statut === "termine_dvi") {

      // Étape 1 : dernier statut blocage par article → seulement bloqués DVI/FAB SUP
      const sqlHisto = `
        SELECT h.Codearticle, h.Bloque, h.Motif
        FROM _KepAbArtBlocQualite h
        INNER JOIN (
          SELECT Codearticle, MAX(DateType) AS LastDate
          FROM _KepAbArtBlocQualite
          GROUP BY Codearticle
        ) mx ON h.Codearticle = mx.Codearticle AND h.DateType = mx.LastDate
        WHERE LTRIM(RTRIM(h.Bloque)) = 'O'
          AND (LTRIM(RTRIM(h.Motif)) LIKE '%DVI%' OR LTRIM(RTRIM(h.Motif)) LIKE '%FAB%SUP%')
      `;
      const req1 = pool.request();
      req1.timeout = 60000;
      const res1 = await req1.query(sqlHisto);
      const histoRows = res1.recordset || [];

      if (histoRows.length === 0) {
        return res.json({ success: true, data: [], count: 0 });
      }

      // Map CodeArticle → histo
      const histoMap = {};
      histoRows.forEach(h => { histoMap[(h.Codearticle || "").trim()] = h; });

      // Étape 2 : lancements terminés pour ces articles (IN list)
      const codes = histoRows
        .map(h => `'${(h.Codearticle || "").trim().replace(/'/g, "''")}'`)
        .join(",");

      const sqlLcte = `
        SELECT TOP (${limit})
          lcte.CodeLancement,
          LTRIM(RTRIM(lcte.CodeArticle))      AS CodeArticle,
          LTRIM(RTRIM(lcte.DesignationArt1))  AS DesignationArt1,
          LTRIM(RTRIM(lcte.DesignationLct1))  AS DesignationLct1,
          lcte.DateFinPlanifiee,
          lcte.DateSoldeLancement,
          lcte.QuantiteLancee,
          lcte.LancementSolde,
          lcte.LctTermine,
          LTRIM(RTRIM(art.VarAlphaUtil8))     AS CommentaireBlocage,
          LTRIM(RTRIM(art.Localisation))      AS Localisation,
          NULL AS CodePosteEnCours
        FROM LCTE lcte
        INNER JOIN ARTICLE art
          ON LTRIM(RTRIM(art.CodeArticle)) = LTRIM(RTRIM(lcte.CodeArticle))
        WHERE (lcte.LctTermine = 'O' OR lcte.LancementSolde = 'O')
          AND LTRIM(RTRIM(lcte.CodeArticle)) IN (${codes})
          AND LTRIM(RTRIM(ISNULL(art.Localisation, ''))) <> ''
        ORDER BY lcte.DateSoldeLancement DESC, lcte.CodeLancement ASC
      `;
      const req2 = pool.request();
      req2.timeout = 30000;
      const res2 = await req2.query(sqlLcte);
      const lctes = res2.recordset || [];

      const data = lctes.map(r => {
        const h = histoMap[(r.CodeArticle || "").trim()] || {};
        return {
          ...r,
          BlocageON: "O",
          MotifBlocage: (h.Motif || "").trim(),
          StatutCalcule: "Terminé",
          BlocageDVI: true,
        };
      });

      return res.json({ success: true, data, count: data.length });
    }

    // ── CAS 3 : tous terminés (fallback) ─────────────────────────────────────
    const sql = `
      SELECT TOP (${limit})
        CodeLancement,
        LTRIM(RTRIM(CodeArticle))     AS CodeArticle,
        LTRIM(RTRIM(DesignationArt1)) AS DesignationArt1,
        LTRIM(RTRIM(DesignationLct1)) AS DesignationLct1,
        DateFinPlanifiee,
        DateSoldeLancement,
        QuantiteLancee,
        LancementSolde,
        LctTermine,
        NULL AS CodePosteEnCours
      FROM LCTE
      WHERE (LctTermine = 'O' OR LancementSolde = 'O')
      ORDER BY DateSoldeLancement DESC, CodeLancement ASC
    `;
    const result = await request.query(sql);
    const data = (result.recordset || []).map(r => ({ ...r, StatutCalcule: "Terminé" }));
    res.json({ success: true, data, count: data.length });

  } catch (err) {
    console.error("Erreur GET /api/lancements:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;