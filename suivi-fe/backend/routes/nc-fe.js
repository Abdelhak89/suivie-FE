// routes/nc-fe.js
// Création et lecture des nouvelles Fiches Événements (KEP_NC_*)
import { Router }          from "express";
import { getWritePoolBySite, getReadPoolBySite } from "../db-sqlserver.js";
import { verifyToken, requireSite, getUserSites } from "../middlewares/verifyToken.js";

const router = Router();

// ── Génère un numéro FE unique ────────────────────────────────
async function generateNumeroFE(site) {
  const pool  = getWritePoolBySite(site);
  const annee = new Date().getFullYear();
  const prefix = `FE-${site.toUpperCase()}-${annee}-`;

  const result = await pool.request()
    .input("prefix", `${prefix}%`)
    .query(`
      SELECT TOP 1 numero_fe
      FROM   dbo.fiches_evenements
      WHERE  numero_fe LIKE @prefix
      ORDER  BY numero_fe DESC
    `);

  if (result.recordset.length === 0) return `${prefix}0001`;

  const last   = result.recordset[0].numero_fe;
  const num    = parseInt(last.split("-").pop(), 10) + 1;
  return `${prefix}${String(num).padStart(4, "0")}`;
}

// ── POST /api/nc-fe/:site — Créer une nouvelle FE ────────────
// Public — pas de verifyToken (opérateurs atelier)
router.post("/:site", async (req, res) => {
  const { site } = req.params;
  const {
    code_article,
    designation,
    numero_of,
    numero_lot,
    quantite,
    unite          = "pce",
    type_evenement,
    description,
    gravite        = "mineur",
    code_fournisseur,
    nom_fournisseur,
    declarant_nom,
    declarant_poste,
    ilot,
  } = req.body;

  if (!type_evenement)
    return res.status(400).json({ success: false, message: "type_evenement requis." });

  try {
    const pool       = getWritePoolBySite(site);
    const numero_fe  = await generateNumeroFE(site);
    const created_by = req.user?.userId || null; // null si opérateur non connecté

    await pool.request()
      .input("numero_fe",       numero_fe)
      .input("site",            site.toUpperCase())
      .input("code_article",    code_article    || null)
      .input("designation",     designation     || null)
      .input("numero_of",       numero_of       || null)
      .input("numero_lot",      numero_lot      || null)
      .input("quantite",        quantite        || null)
      .input("unite",           unite)
      .input("type_evenement",  type_evenement)
      .input("description",     description     || null)
      .input("gravite",         gravite)
      .input("code_fournisseur",code_fournisseur|| null)
      .input("nom_fournisseur", nom_fournisseur || null)
      .input("declarant_nom",   declarant_nom   || null)
      .input("declarant_poste", declarant_poste || null)
      .input("ilot",            ilot            || null)
      .input("created_by",      created_by)
      .query(`
        INSERT INTO dbo.fiches_evenements (
          numero_fe, site,
          code_article, designation, numero_of, numero_lot, quantite, unite,
          type_evenement, description, gravite,
          code_fournisseur, nom_fournisseur,
          declarant_nom, declarant_poste, ilot,
          statut, date_evenement, date_creation, updated_at, created_by
        ) VALUES (
          @numero_fe, @site,
          @code_article, @designation, @numero_of, @numero_lot, @quantite, @unite,
          @type_evenement, @description, @gravite,
          @code_fournisseur, @nom_fournisseur,
          @declarant_nom, @declarant_poste, @ilot,
          'ouvert', GETDATE(), GETDATE(), GETDATE(), @created_by
        )
      `);

    res.status(201).json({
      success:    true,
      numero_fe,
      message:    `FE ${numero_fe} créée avec succès.`,
    });

  } catch (err) {
    console.error(`[nc-fe POST /${site}]`, err);
    res.status(500).json({ success: false, message: "Erreur lors de la création de la FE." });
  }
});

// ── GET /api/nc-fe/all — FE des sites accessibles au user ────
router.get("/all", verifyToken, async (req, res) => {
  const { limit = 200, offset = 0 } = req.query;
  // Filtre par sites du JWT — admin/ALL voit tout
  const SITES = getUserSites(req.user);

  try {
    const results = await Promise.allSettled(
      SITES.map(site =>
        getWritePoolBySite(site).request()
          .input("limit",  parseInt(limit))
          .input("offset", parseInt(offset))
          .query(`
            SELECT id, numero_fe, site, code_article, designation,
                   numero_of, type_evenement, description, gravite,
                   declarant_nom, statut, date_creation, updated_at
            FROM   dbo.fiches_evenements
            ORDER  BY date_creation DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
          `)
          .then(r => r.recordset.map(row => ({ ...row, source: "app" })))
      )
    );

    const items = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));

    res.json({ success: true, items, total: items.length });
  } catch (err) {
    console.error("[nc-fe GET /all]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


// Protégé — qualitiens uniquement, accès limité au site du JWT
router.get("/:site", verifyToken, requireSite, async (req, res) => {
  const { site }             = req.params;
  const { statut, type_evenement, limit = 50, offset = 0 } = req.query;

  try {
    const pool = getWritePoolBySite(site);
    let where  = "WHERE 1=1";
    const req2 = pool.request()
      .input("limit",  parseInt(limit))
      .input("offset", parseInt(offset));

    if (statut) {
      where += " AND statut = @statut";
      req2.input("statut", statut);
    }
    if (type_evenement) {
      where += " AND type_evenement = @type_evenement";
      req2.input("type_evenement", type_evenement);
    }

    const result = await req2.query(`
      SELECT * FROM dbo.fiches_evenements
      ${where}
      ORDER BY date_creation DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({ success: true, items: result.recordset });

  } catch (err) {
    console.error(`[nc-fe GET /${site}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── PATCH /api/nc-fe/:site/:id — update statut/gravite ───────
router.patch("/:site/:id", verifyToken, requireSite, async (req, res) => {
  const { site, id } = req.params;
  const { statut, gravite, traitement, decision } = req.body;
  const sets = [];
  const pool = getWritePoolBySite(site);
  const r    = pool.request().input("id", parseInt(id));

  if (statut)     { sets.push("statut = @statut");         r.input("statut",     statut); }
  if (gravite)    { sets.push("gravite = @gravite");        r.input("gravite",    gravite); }
  if (traitement) { sets.push("traitement = @traitement");  r.input("traitement", traitement); }
  if (decision)   { sets.push("decision = @decision");      r.input("decision",   decision); }
  if (!sets.length) return res.status(400).json({ success: false, message: "Rien à modifier." });
  sets.push("updated_at = GETDATE()");

  try {
    await r.query(`UPDATE dbo.fiches_evenements SET ${sets.join(", ")} WHERE id = @id`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[nc-fe PATCH /${site}/${id}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


export default router;