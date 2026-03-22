// routes/admin.js
// Routes réservées au rôle "responsable" et "admin"
// Gérer les qualitiens, voir/supprimer les FE ouvertes
import { Router } from "express";
import { getWritePoolBySite } from "../db-sqlserver.js";
import { verifyToken, requireRole } from "../middlewares/verifyToken.js";
import bcrypt from "bcrypt";

const router = Router();
const VALID_SITES = ["soucy", "sens", "laxou", "kmtm"];

// Toutes les routes nécessitent connexion + rôle responsable/admin
router.use(verifyToken);
router.use(requireRole("responsable", "admin"));

// ─────────────────────────────────────────────────────────────
// GESTION QUALITIENS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/qualitiens — liste tous les qualitiens
// Un responsable voit les qualitiens de ses sites
router.get("/qualitiens", async (req, res) => {
  const site = req.user.sites === "ALL" ? null : req.user.sites; // filtre par site si pas admin total

  try {
    // On utilise le pool write du premier site accessible
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);

    let where = "WHERE role IN ('qualitien', 'responsable')";
    const r = pool.request();

    if (site && site !== "ALL") {
      // filtre par sites du responsable
      const sitesArr = site.split(",").map(s => s.trim().toUpperCase());
      // sites LIKE match — on cherche les users dont le site est dans la liste
      where += ` AND (${sitesArr.map((s, i) => { r.input(`site${i}`, `%${s}%`); return `sites LIKE @site${i}`; }).join(" OR ")})`;
    }

    const result = await r.query(`
      SELECT id, nom, prenom, email, role, sites, actif, date_creation
      FROM dbo.qualitiens
      ${where}
      ORDER BY sites, nom
    `);

    res.json({ success: true, data: result.recordset });

  } catch (err) {
    console.error("[admin GET /qualitiens]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// POST /api/admin/qualitiens — ajouter un qualitien
router.post("/qualitiens", async (req, res) => {
  const { nom, prenom, email, password, role = "qualitien", sites } = req.body;

  if (!nom || !prenom || !email || !password)
    return res.status(400).json({ success: false, message: "nom, prenom, email, password requis." });

  if (!sites)
    return res.status(400).json({ success: false, message: "sites requis (ex: SOUCY ou SOUCY,SENS)." });

  // Un responsable ne peut créer que sur ses propres sites
  if (req.user.role === "responsable" && req.user.sites !== "ALL") {
    const userSitesArr = req.user.sites.split(",").map(s => s.trim().toUpperCase());
    const newSitesArr  = sites.split(",").map(s => s.trim().toUpperCase());
    const unauthorized = newSitesArr.filter(s => !userSitesArr.includes(s));
    if (unauthorized.length > 0)
      return res.status(403).json({ success: false, message: `Vous n'avez pas accès au(x) site(s) : ${unauthorized.join(", ")}` });
  }

  try {
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);

    // Vérifie que l'email n'existe pas déjà
    const existing = await pool.request()
      .input("email", email)
      .query(`SELECT id FROM dbo.qualitiens WHERE email = @email`);
    if (existing.recordset.length > 0)
      return res.status(409).json({ success: false, message: "Email déjà utilisé." });

    const hash = await bcrypt.hash(password, 10);

    await pool.request()
      .input("nom",      nom)
      .input("prenom",   prenom)
      .input("email",    email.toLowerCase().trim())
      .input("password", hash)
      .input("role",     role)
      .input("sites",    sites.toUpperCase())
      .input("actif",    1)
      .query(`
        INSERT INTO dbo.qualitiens (nom, prenom, email, password_hash, role, sites, actif, date_creation)
        VALUES (@nom, @prenom, @email, @password, @role, @sites, @actif, GETDATE())
      `);

    res.status(201).json({ success: true, message: `Qualitien ${prenom} ${nom} créé.` });

  } catch (err) {
    console.error("[admin POST /qualitiens]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// PATCH /api/admin/qualitiens/:id — modifier un qualitien (actif/role/sites/password)
router.patch("/qualitiens/:id", async (req, res) => {
  const { id } = req.params;
  const { actif, role, sites, password } = req.body;
  const sets = [];

  try {
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);
    const r    = pool.request().input("id", parseInt(id));

    if (actif   !== undefined) { sets.push("actif = @actif");       r.input("actif",  actif ? 1 : 0); }
    if (role)                  { sets.push("role = @role");          r.input("role",   role); }
    if (sites)                 { sets.push("sites = @sites");        r.input("sites",  sites.toUpperCase()); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      sets.push("password_hash = @pw");
      r.input("pw", hash);
    }

    if (!sets.length)
      return res.status(400).json({ success: false, message: "Rien à modifier." });

    sets.push("updated_at = GETDATE()");
    await r.query(`UPDATE dbo.qualitiens SET ${sets.join(", ")} WHERE id = @id`);
    res.json({ success: true, message: "Qualitien mis à jour." });

  } catch (err) {
    console.error(`[admin PATCH /qualitiens/${id}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// DELETE /api/admin/qualitiens/:id — désactiver un qualitien (soft delete)
router.delete("/qualitiens/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);

    // Soft delete — on désactive, on ne supprime pas
    await pool.request()
      .input("id", parseInt(id))
      .query(`UPDATE dbo.qualitiens SET actif = 0, updated_at = GETDATE() WHERE id = @id`);

    res.json({ success: true, message: "Qualitien désactivé." });

  } catch (err) {
    console.error(`[admin DELETE /qualitiens/${id}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ─────────────────────────────────────────────────────────────
// SUPPRESSION FE OUVERTES
// ─────────────────────────────────────────────────────────────

// GET /api/admin/fe-ouvertes/:site — liste des FE ouvertes d'un site
router.get("/fe-ouvertes/:site", async (req, res) => {
  const { site } = req.params;
  if (!VALID_SITES.includes(site?.toLowerCase()))
    return res.status(400).json({ success: false, message: "Site invalide." });

  try {
    const pool   = getWritePoolBySite(site);
    const result = await pool.request().query(`
      SELECT id, numero_fe, site, code_article, designation,
             type_evenement, declarant_nom, date_creation, statut
      FROM   dbo.fiches_evenements
      WHERE  statut = 'ouvert'
      ORDER  BY date_creation DESC
    `);
    res.json({ success: true, data: result.recordset });

  } catch (err) {
    console.error(`[admin GET /fe-ouvertes/${site}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// DELETE /api/admin/fe/:site/:id — supprimer une FE ouverte
router.delete("/fe/:site/:id", async (req, res) => {
  const { site, id } = req.params;
  if (!VALID_SITES.includes(site?.toLowerCase()))
    return res.status(400).json({ success: false, message: "Site invalide." });

  try {
    const pool  = getWritePoolBySite(site);
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT id, numero_fe, statut FROM dbo.fiches_evenements WHERE id = @id`);

    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const fe = check.recordset[0];
    if (fe.statut !== "ouvert")
      return res.status(400).json({ success: false, message: `FE "${fe.numero_fe}" non supprimable (statut : ${fe.statut}).` });

    await pool.request()
      .input("id", parseInt(id))
      .query(`DELETE FROM dbo.fiches_evenements WHERE id = @id`);

    console.log(`[admin DELETE /fe/${site}/${id}] ${fe.numero_fe} supprimée par user ${req.user?.userId}`);
    res.json({ success: true, message: `FE ${fe.numero_fe} supprimée.` });

  } catch (err) {
    console.error(`[admin DELETE /fe/${site}/${id}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ─────────────────────────────────────────────────────────────
// DEMANDES DE SUPPRESSION
// ─────────────────────────────────────────────────────────────

// GET /api/admin/demandes-suppression — liste des demandes en attente
router.get("/demandes-suppression", async (req, res) => {
  const site = req.user.sites === "ALL" ? null : req.user.sites.split(",")[0].trim().toLowerCase();
  try {
    const pool = getWritePoolBySite(site || "soucy");
    const result = await pool.request().query(`
      SELECT id, numero_fe, site, fe_id, motif,
             demandeur_nom, demandeur_email, statut,
             date_demande, date_traitement, traite_par
      FROM dbo.demandes_suppression
      WHERE statut = 'en_attente'
      ${req.user.sites !== "ALL" ? `AND site IN (${req.user.sites.split(",").map(s => `'${s.trim().toUpperCase()}'`).join(",")})` : ""}
      ORDER BY date_demande DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("[admin GET /demandes-suppression]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// POST /api/admin/demandes-suppression/:id/approuver — approuve et supprime la FE
router.post("/demandes-suppression/:id/approuver", async (req, res) => {
  const { id } = req.params;
  const traitePar = req.user?.email || "admin";

  try {
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);

    // Récupère la demande
    const dem = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT * FROM dbo.demandes_suppression WHERE id = @id AND statut = 'en_attente'`);

    if (dem.recordset.length === 0)
      return res.status(404).json({ success: false, message: "Demande introuvable ou déjà traitée." });

    const d = dem.recordset[0];
    const feSite = d.site.toLowerCase();
    const fePool = getWritePoolBySite(feSite);

    // Supprime la FE
    await fePool.request()
      .input("fe_id", d.fe_id)
      .query(`DELETE FROM dbo.fiches_evenements WHERE id = @fe_id`);

    // Marque la demande comme approuvée
    await pool.request()
      .input("id",        parseInt(id))
      .input("traite_par", traitePar)
      .query(`
        UPDATE dbo.demandes_suppression
        SET statut = 'approuvee', date_traitement = GETDATE(), traite_par = @traite_par
        WHERE id = @id
      `);

    console.log(`[admin] FE ${d.numero_fe} supprimée — demande #${id} approuvée par ${traitePar}`);
    res.json({ success: true, message: `FE ${d.numero_fe} supprimée.` });

  } catch (err) {
    console.error(`[admin POST /demandes-suppression/${id}/approuver]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// POST /api/admin/demandes-suppression/:id/refuser — refuse la demande
router.post("/demandes-suppression/:id/refuser", async (req, res) => {
  const { id } = req.params;
  const traitePar = req.user?.email || "admin";

  try {
    const poolSite = req.user.sites === "ALL" ? "soucy" : req.user.sites.split(",")[0].trim().toLowerCase();
    const pool = getWritePoolBySite(poolSite);

    await pool.request()
      .input("id",         parseInt(id))
      .input("traite_par", traitePar)
      .query(`
        UPDATE dbo.demandes_suppression
        SET statut = 'refusee', date_traitement = GETDATE(), traite_par = @traite_par
        WHERE id = @id AND statut = 'en_attente'
      `);

    res.json({ success: true, message: "Demande refusée." });

  } catch (err) {
    console.error(`[admin POST /demandes-suppression/${id}/refuser]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;