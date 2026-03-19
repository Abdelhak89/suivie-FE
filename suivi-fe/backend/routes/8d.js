// routes/8d.js
// Sauvegarde et lecture des analyses 8D pour les FE SILOG et App
import { Router }          from "express";
import { verifyToken }     from "../middlewares/verifyToken.js";
import { getWritePoolBySite } from "../db-sqlserver.js";

const router = Router();

// ── GET /api/8d/:site/:numero_fe ─────────────────────────────
router.get("/:site/:numero_fe", verifyToken, async (req, res) => {
  const { site, numero_fe } = req.params;
  try {
    const pool   = getWritePoolBySite(site);
    const result = await pool.request()
      .input("numero_fe", numero_fe)
      .query(`
        SELECT id, numero_fe, source, site, data_json, statut_fe, created_at, updated_at
        FROM   dbo.analyses_8d
        WHERE  numero_fe = @numero_fe
      `);

    if (!result.recordset.length)
      return res.json({ success: true, data: null });

    const row = result.recordset[0];
    res.json({
      success: true,
      data: {
        ...row,
        data_json: JSON.parse(row.data_json || "{}"),
      },
    });
  } catch (err) {
    console.error(`[8d GET /${site}/${numero_fe}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/8d/:site/:numero_fe ────────────────────────────
// Crée ou met à jour le 8D (UPSERT)
router.post("/:site/:numero_fe", verifyToken, async (req, res) => {
  const { site, numero_fe } = req.params;
  const { data_json, source = "SILOG", statut_fe = "en_cours" } = req.body;

  if (!data_json)
    return res.status(400).json({ success: false, message: "data_json requis." });

  try {
    const pool      = getWritePoolBySite(site);
    const jsonStr   = typeof data_json === "string" ? data_json : JSON.stringify(data_json);
    const userId    = req.user?.userId || null;

    // UPSERT — SQL Server MERGE
    await pool.request()
      .input("numero_fe",  numero_fe)
      .input("source",     source)
      .input("site",       site.toUpperCase())
      .input("data_json",  jsonStr)
      .input("statut_fe",  statut_fe)
      .input("created_by", userId)
      .query(`
        MERGE dbo.analyses_8d AS target
        USING (SELECT @numero_fe AS numero_fe) AS src ON target.numero_fe = src.numero_fe
        WHEN MATCHED THEN
          UPDATE SET
            data_json  = @data_json,
            statut_fe  = @statut_fe,
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (numero_fe, source, site, data_json, statut_fe, created_by)
          VALUES (@numero_fe, @source, @site, @data_json, @statut_fe, @created_by);
      `);

    res.json({ success: true, message: "8D sauvegardé." });

  } catch (err) {
    console.error(`[8d POST /${site}/${numero_fe}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── PATCH /api/8d/:site/:numero_fe/statut ────────────────────
// Change statut : en_cours → traite → cloture_demandee
router.patch("/:site/:numero_fe/statut", verifyToken, async (req, res) => {
  const { site, numero_fe } = req.params;
  const { statut_fe } = req.body;

  const VALID = ["en_cours", "traite", "cloture_demandee"];
  if (!VALID.includes(statut_fe))
    return res.status(400).json({ success: false, message: `statut_fe invalide. Valeurs : ${VALID.join(", ")}` });

  try {
    await getWritePoolBySite(site).request()
      .input("numero_fe", numero_fe)
      .input("statut_fe", statut_fe)
      .query(`
        UPDATE dbo.analyses_8d
        SET statut_fe = @statut_fe, updated_at = GETDATE()
        WHERE numero_fe = @numero_fe
      `);
    res.json({ success: true });
  } catch (err) {
    console.error(`[8d PATCH statut]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── GET /api/8d/:site — liste les 8D du site ─────────────────
router.get("/:site", verifyToken, async (req, res) => {
  const { site } = req.params;
  const { statut_fe } = req.query;
  try {
    const pool = getWritePoolBySite(site);
    let where  = "WHERE 1=1";
    const r    = pool.request();
    if (statut_fe) { where += " AND statut_fe = @statut_fe"; r.input("statut_fe", statut_fe); }

    const result = await r.query(`
      SELECT id, numero_fe, source, site, statut_fe, created_at, updated_at
      FROM   dbo.analyses_8d
      ${where}
      ORDER  BY updated_at DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(`[8d GET /${site}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;