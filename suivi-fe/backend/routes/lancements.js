// routes/lancements.js
import express from "express";
import { getPool } from "../db-sqlserver.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const { code_article, statut, of_search } = req.query;

    const request = pool.request();
    request.timeout = 60000;

    // ── NOUVEAU CAS : Recherche rapide pour autocomplétion (Utilisé par le champ N° OF) ──
    if (of_search) {
      request.input("of", of_search.trim());
      
      const sqlSearch = `
        SELECT TOP 1
            l.CodeLancement,
            LTRIM(RTRIM(l.CodeArticle)) AS CodeArticle,
            l.DesignationLct1,
            -- Jointure avec CLI pour récupérer NomClient (confirmé dans ton export)
            LTRIM(RTRIM(c.NomClient)) AS NomClientTable,
            -- Calcul de la quantité totale disponible dans le lot (somme des stocks)
            ISNULL(lot.QteDansStock1, 0) + ISNULL(lot.QteDansStock2, 0) + 
            ISNULL(lot.QteDansStock3, 0) + ISNULL(lot.QteDansStock4, 0) + 
            ISNULL(lot.QteDansStock5, 0) AS QuantiteLancee
        FROM LCTE l
        LEFT JOIN ARTICLE a ON a.CodeArticle = l.CodeArticle
        LEFT JOIN CLI c     ON c.CodeClient  = a.CodeClient
        LEFT JOIN LOT lot   ON RTRIM(lot.CodeLot) = RTRIM(l.CodeLancement)
        WHERE RTRIM(l.CodeLancement) = @of
      `;
      
      const result = await request.query(sqlSearch);
      
      if (result.recordset.length > 0) {
        let data = result.recordset[0];
        
        // ── LOGIQUE MÉTIER CLIENT ──
        if (data.NomClientTable) {
          data.NomClient = data.NomClientTable;
        } else if (data.CodeArticle && data.CodeArticle.startsWith('141')) {
          data.NomClient = "SAE SAFRAN";
        } else {
          data.NomClient = "";
        }

        return res.json({ success: true, data: data });
      } else {
        return res.json({ success: true, data: null });
      }
    }

    // ── CAS 1 : prochains lancements d'un article précis ─────────────────────
    if (code_article) {
      request.input("code_article", code_article);
      const sql = `
        SELECT
            l.CodeLancement,
            LTRIM(RTRIM(l.CodeArticle)) AS CodeArticle,
            l.DesignationLct1           AS DesignationArt1,
            l.DateSoldeLancement,
            ISNULL(LTRIM(RTRIM(lot.Localisation)), 'NON LOCALISÉ') AS EmplacementStock,
            ISNULL(lot.QteDansStock1, 0) AS QuantiteLancee,
            l.LctTermine,
            l.LancementSolde,
            NULL AS CodePosteEnCours,
            NULL AS DateFinPlanifiee
        FROM LCTE l
        LEFT JOIN LOT lot ON RTRIM(lot.CodeLot) = RTRIM(l.CodeLancement)
        WHERE RTRIM(l.CodeArticle) = @code_article
        ORDER BY l.LctTermine ASC, l.DateSoldeLancement DESC
      `;
      const result = await request.query(sql);
      const data = (result.recordset || []).map((r) => ({
        ...r,
        StatutCalcule: r.LctTermine === "O" || r.LancementSolde === "O" ? "Terminé" : "En cours",
      }));
      return res.json({ success: true, data, count: data.length });
    }

    // ── CAS 2 : lancements terminés bloqués DVI / FAB SUP ────────────────────
    if (statut === "termine_dvi") {
      const sqlHisto = `
        SELECT h.Codearticle, h.Motif
        FROM _KepAbArtBlocQualite h
        INNER JOIN (
          SELECT Codearticle, MAX(DateType) AS LastDate
          FROM _KepAbArtBlocQualite
          GROUP BY Codearticle
        ) mx ON h.Codearticle = mx.Codearticle AND h.DateType = mx.LastDate
        WHERE LTRIM(RTRIM(h.Bloque)) = 'O'
          AND (h.Motif LIKE '%DVI%' OR h.Motif LIKE '%FAB%SUP%')
      `;
      const res1 = await pool.request().query(sqlHisto);
      const histoRows = res1.recordset || [];
      if (histoRows.length === 0)
        return res.json({ success: true, data: [], count: 0 });

      const codes = histoRows
        .map((h) => `'${h.Codearticle.trim().replace(/'/g, "''")}'`)
        .join(",");

      const sqlLcte = `
        SELECT TOP (${limit})
          lcte.CodeLancement,
          LTRIM(RTRIM(lcte.CodeArticle))  AS CodeArticle,
          lcte.DesignationLct1            AS DesignationArt1,
          lcte.DateSoldeLancement,
          art.VarAlphaUtil8               AS CommentaireBlocage,
          ISNULL(lot.QteDansStock1,  0) + ISNULL(lot.QteDansStock2,  0) + 
          ISNULL(lot.QteDansStock3,  0) + ISNULL(lot.QteDansStock4,  0) + 
          ISNULL(lot.QteDansStock5,  0) + ISNULL(lot.QteDansStock6,  0) + 
          ISNULL(lot.QteDansStock7,  0) + ISNULL(lot.QteDansStock8,  0) + 
          ISNULL(lot.QteDansStock9,  0) + ISNULL(lot.QteDansStock10, 0)  AS QuantiteLancee,
          LTRIM(RTRIM(ISNULL(lot.Localisation, ''))) AS LocalisationLot,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock1,  ''))) AS D1,  ISNULL(lot.QteDansStock1,  0) AS Q1,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock2,  ''))) AS D2,  ISNULL(lot.QteDansStock2,  0) AS Q2,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock3,  ''))) AS D3,  ISNULL(lot.QteDansStock3,  0) AS Q3,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock4,  ''))) AS D4,  ISNULL(lot.QteDansStock4,  0) AS Q4,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock5,  ''))) AS D5,  ISNULL(lot.QteDansStock5,  0) AS Q5,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock6,  ''))) AS D6,  ISNULL(lot.QteDansStock6,  0) AS Q6,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock7,  ''))) AS D7,  ISNULL(lot.QteDansStock7,  0) AS Q7,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock8,  ''))) AS D8,  ISNULL(lot.QteDansStock8,  0) AS Q8,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock9,  ''))) AS D9,  ISNULL(lot.QteDansStock9,  0) AS Q9,
          LTRIM(RTRIM(ISNULL(lot.DesignationStock10, ''))) AS D10, ISNULL(lot.QteDansStock10, 0) AS Q10
        FROM LCTE lcte
        INNER JOIN ARTICLE art ON RTRIM(art.CodeArticle) = RTRIM(lcte.CodeArticle)
        LEFT  JOIN LOT lot     ON RTRIM(lot.CodeLot)     = RTRIM(lcte.CodeLancement)
        WHERE RTRIM(lcte.CodeArticle) IN (${codes})
          AND (lcte.LancementSolde = 'O' OR lcte.LctTermine = 'O')
          AND lcte.DateSoldeLancement > DATEADD(MONTH, -18, GETDATE())
        ORDER BY lcte.DateSoldeLancement DESC
      `;

      const res2 = await pool.request().query(sqlLcte);
      const histoMap = {};
      histoRows.forEach((h) => { histoMap[h.Codearticle.trim()] = h; });

      const data = res2.recordset
        .filter((r) => Number(r.QuantiteLancee) > 0)
        .map((r) => {
          const zone = r.LocalisationLot || null;
          const pills = [];
          for (let i = 1; i <= 10; i++) {
            const label = (r[`D${i}`] || "").trim();
            const qte   = Number(r[`Q${i}`]) || 0;
            if (label && qte > 0) pills.push({ label, qte });
          }
          pills.sort((a, b) => b.qte - a.qte);

          const emplacementDetail  = pills.length
            ? pills.map((p) => `${p.label} (${Math.round(p.qte)})`).join(" | ")
            : zone || "NON LOCALISÉ";
          const emplacementPrincipal = pills.length ? pills[0].label : zone || "NON LOCALISÉ";

          const clean = { ...r };
          for (let i = 1; i <= 10; i++) { delete clean[`D${i}`]; delete clean[`Q${i}`]; }

          return {
            ...clean,
            AdressePrecise:   emplacementPrincipal,
            EmplacementStock: emplacementDetail,
            ZoneMagasin:      zone,
            MotifBlocage:     (histoMap[r.CodeArticle]?.Motif || "DVI").trim(),
            StatutCalcule:    "Terminé",
          };
        });

      return res.json({ success: true, data, count: data.length });
    }

    // ── CAS 3 : fallback (Liste globale) ─────────────────────────────────────
    const result = await pool.request().query(`
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
    `);
    const data = (result.recordset || []).map((r) => ({
      ...r,
      StatutCalcule: "Terminé",
    }));
    res.json({ success: true, data, count: data.length });

  } catch (err) {
    console.error("Erreur GET /api/lancements:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;