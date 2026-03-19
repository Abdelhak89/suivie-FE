// routes/groupe.js
import { Router }  from "express";
import { getPool } from "../db-sqlserver.js";

const router = Router();

// ── GET /api/fe/groupe — liste toutes les NC groupe ──────────
router.get("/", async (req, res) => {
  try {
    const pool = getPool("groupe");

    const result = await pool.request().query(`
      SELECT
        g.id, g.ref, g.site_detecteur, g.fournisseur,
        g.code_article, g.description, g.statut, g.priorite,
        g.analyse_8d, g.date_creation, g.updated_at,
        (
          SELECT c.id, c.auteur, c.site, c.texte,
                 FORMAT(c.date, 'dd/MM/yy HH:mm') as date
          FROM   nc_groupe_commentaires c
          WHERE  c.nc_id = g.id
          ORDER  BY c.date
          FOR JSON PATH
        ) as commentaires_json
      FROM nc_groupe g
      ORDER BY
        CASE g.priorite
          WHEN 'Critique' THEN 0
          WHEN 'Haute'    THEN 1
          ELSE 2
        END,
        g.date_creation DESC
    `);

    const data = result.recordset.map(row => ({
      ...row,
      commentaires: row.commentaires_json
        ? JSON.parse(row.commentaires_json)
        : [],
      commentaires_json: undefined,
    }));

    res.json({ success: true, data });

  } catch (err) {
    console.error("[groupe GET /]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/fe/groupe — créer une NC groupe ────────────────
router.post("/", async (req, res) => {
  const { site_detecteur, fournisseur, code_article, description, priorite = "Normale" } = req.body;
  if (!site_detecteur || !description)
    return res.status(400).json({ success: false, message: "site_detecteur et description requis." });

  try {
    const pool  = getPool("groupe");
    const annee = new Date().getFullYear();

    // Génère ref FEG-YYYY-XXXX
    const last = await pool.request()
      .input("prefix", `FEG-${annee}-%`)
      .query(`SELECT TOP 1 ref FROM nc_groupe WHERE ref LIKE @prefix ORDER BY ref DESC`);

    const num = last.recordset.length
      ? parseInt(last.recordset[0].ref.split("-").pop(), 10) + 1
      : 1;
    const ref = `FEG-${annee}-${String(num).padStart(3, "0")}`;

    await pool.request()
      .input("ref",            ref)
      .input("site_detecteur", site_detecteur)
      .input("fournisseur",    fournisseur    || null)
      .input("code_article",   code_article   || null)
      .input("description",    description)
      .input("priorite",       priorite)
      .query(`
        INSERT INTO nc_groupe (ref, site_detecteur, fournisseur, code_article, description, priorite)
        VALUES (@ref, @site_detecteur, @fournisseur, @code_article, @description, @priorite)
      `);

    res.status(201).json({ success: true, ref });

  } catch (err) {
    console.error("[groupe POST /]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/fe/groupe/:id/commentaire ──────────────────────
router.post("/:id/commentaire", async (req, res) => {
  const { auteur, site, texte } = req.body;
  if (!auteur || !texte)
    return res.status(400).json({ success: false, message: "auteur et texte requis." });

  try {
    const pool = getPool("groupe");
    await pool.request()
      .input("nc_id",  parseInt(req.params.id))
      .input("auteur", auteur)
      .input("site",   site || "SOUCY")
      .input("texte",  texte)
      .query(`INSERT INTO nc_groupe_commentaires (nc_id, auteur, site, texte) VALUES (@nc_id, @auteur, @site, @texte)`);

    res.json({ success: true });
  } catch (err) {
    console.error("[groupe POST commentaire]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── PATCH /api/fe/groupe/:id — update statut / priorité / 8D ─
router.patch("/:id", async (req, res) => {
  const { statut, priorite, analyse_8d } = req.body;
  const sets = [];
  const r    = getPool("groupe").request().input("id", parseInt(req.params.id));

  if (statut)     { sets.push("statut = @statut");         r.input("statut",     statut); }
  if (priorite)   { sets.push("priorite = @priorite");     r.input("priorite",   priorite); }
  if (analyse_8d !== undefined) { sets.push("analyse_8d = @analyse_8d"); r.input("analyse_8d", analyse_8d); }
  if (!sets.length) return res.status(400).json({ success: false, message: "Rien à mettre à jour." });

  sets.push("updated_at = GETDATE()");

  try {
    await r.query(`UPDATE nc_groupe SET ${sets.join(", ")} WHERE id = @id`);
    res.json({ success: true });
  } catch (err) {
    console.error("[groupe PATCH]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;