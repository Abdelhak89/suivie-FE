// routes/nc-fe.js
import { Router } from "express";
import { getWritePoolBySite, getPool } from "../db-sqlserver.js";
import { verifyToken, requireSite, requireRole, getUserSites } from "../middlewares/verifyToken.js";

import { addHeuresOuvrees } from "../utils/heuresOuvrees.js";
import { creerDossierFE, listerFichiersFE, sauvegarderFichier } from "../utils/dossierFE.js";

const router = Router();
const VALID_SITES = ["soucy", "sens", "laxou", "kmtm"];

// ── Normalise statut DB → label front ────────────────────────
function normaliseStatut(statut) {
  if (!statut) return "En cours";
  const s = statut.toLowerCase();
  if (s === "traite" || s === "traité") return "Traitée";
  if (s === "clos"   || s === "clot"  ) return "Clôturée";
  return "En cours";
}

// ── Génère numéro FE unique ───────────────────────────────────
// Mapping site → préfixe numéro FE
const SITE_PREFIX = {
  soucy: "SOU",
  sens:  "SEN",
  laxou: "LAX",
  kmtm:  "KAS",
};

async function generateNumeroFE(site) {
  const pool      = getWritePoolBySite(site);
  const now       = new Date();
  const yy        = String(now.getFullYear()).slice(2); // "26" pour 2026
  const prefix    = `${SITE_PREFIX[site.toLowerCase()] || site.toUpperCase()}${yy}`;

  const result = await pool.request()
    .input("prefix", `${prefix}%`)
    .query(`SELECT TOP 1 numero_fe FROM dbo.fiches_evenements WHERE numero_fe LIKE @prefix ORDER BY numero_fe DESC`);

  if (result.recordset.length === 0) return `${prefix}0001`;

  // Extrait les 4 derniers chiffres (ex: SOU260025 → 25)
  const last = result.recordset[0].numero_fe;
  const num  = parseInt(last.slice(prefix.length), 10) + 1;
  return `${prefix}${String(num).padStart(4, "0")}`;
}

// ── POST /api/nc-fe/:site — Créer une FE (public) ───────────
router.post("/:site", async (req, res) => {
  const { site } = req.params;
  if (!VALID_SITES.includes(site?.toLowerCase()))
    return res.status(400).json({ success: false, message: `Site invalide : ${site}` });

  const {
    code_article, designation, numero_of, numero_lot,
    quantite, qte_non_conforme, unite = "pce",
    type_evenement, description, moyen_detection,
    gravite = "mineur", code_fournisseur, nom_fournisseur,
    declarant_nom, declarant_poste, ilot,
  } = req.body;

  if (!type_evenement)
    return res.status(400).json({ success: false, message: "type_evenement requis." });

  try {
    const pool      = getWritePoolBySite(site);
    const numero_fe = await generateNumeroFE(site);
    const created_by = req.user?.userId || null;

    await pool.request()
      .input("numero_fe",        numero_fe)
      .input("site",             site.toUpperCase())
      .input("code_article",     code_article     || null)
      .input("designation",      designation      || null)
      .input("numero_of",        numero_of        || null)
      .input("numero_lot",       numero_lot       || null)
      .input("quantite",         quantite         || null)
      .input("qte_non_conforme", qte_non_conforme || null)
      .input("unite",            unite)
      .input("type_evenement",   type_evenement)
      .input("description",      description      || null)
      .input("moyen_detection",  moyen_detection  || null)
      .input("gravite",          gravite)
      .input("code_fournisseur", code_fournisseur || null)
      .input("nom_fournisseur",  nom_fournisseur  || null)
      .input("declarant_nom",    declarant_nom    || null)
      .input("declarant_poste",  declarant_poste  || null)
      .input("ilot",             ilot             || null)
      .input("created_by",       created_by)
      .query(`
        INSERT INTO dbo.fiches_evenements (
          numero_fe, site, code_article, designation, numero_of, numero_lot,
          quantite, qte_non_conforme, unite, type_evenement, description,
          moyen_detection, gravite, code_fournisseur, nom_fournisseur,
          declarant_nom, declarant_poste, ilot,
          statut, date_evenement, date_creation, updated_at, created_by
        ) VALUES (
          @numero_fe, @site, @code_article, @designation, @numero_of, @numero_lot,
          @quantite, @qte_non_conforme, @unite, @type_evenement, @description,
          @moyen_detection, @gravite, @code_fournisseur, @nom_fournisseur,
          @declarant_nom, @declarant_poste, @ilot,
          'ouvert', GETDATE(), GETDATE(), GETDATE(), @created_by
        )
      `);

    // Calcul automatique du délai sécurisation (48 jours ouvrés)
    try {
      const delai = addHeuresOuvrees(new Date(), 48);
      const delaiStr = delai.toISOString();
      await pool.request()
        .input("numero_fe", numero_fe)
        .input("delai",     delaiStr)
        .query(`UPDATE dbo.fiches_evenements SET delai_securisation = @delai WHERE numero_fe = @numero_fe`);
    } catch (e) {
      console.warn("[nc-fe POST] Calcul délai échoué:", e.message);
    }

    // Création du dossier FE sur le serveur
    const dossier = creerDossierFE(numero_fe, site);
    if (!dossier.success) {
      console.warn(`[nc-fe POST] Dossier non créé pour ${numero_fe}: ${dossier.error}`);
    }

    res.status(201).json({
      success:   true,
      numero_fe,
      message:   `FE ${numero_fe} créée.`,
      dossier:   dossier.path || null,
    });

  } catch (err) {
    console.error(`[nc-fe POST /${site}]`, err);
    res.status(500).json({ success: false, message: "Erreur création FE." });
  }
});

// ── GET /api/nc-fe/all — FE du site du user connecté ─────────
// Requête sur le pool du site JWT (fiches_evenements est par site)
router.get("/all", verifyToken, async (req, res) => {
  const { limit = 200, offset = 0 } = req.query;

  // Récupère les sites du user depuis le JWT
  const userSitesRaw = req.user?.sites || "";
  let sites;
  if (userSitesRaw === "ALL") {
    sites = VALID_SITES;
  } else {
    sites = userSitesRaw.split(",").map(s => s.trim().toLowerCase()).filter(s => VALID_SITES.includes(s));
  }

  if (sites.length === 0) {
    console.warn("[nc-fe GET /all] Aucun site résolu pour user:", req.user);
    return res.json({ success: true, items: [], total: 0 });
  }

  try {
    const results = await Promise.allSettled(
      sites.map(site =>
        getWritePoolBySite(site).request()
          .input("limit",  parseInt(limit))
          .input("offset", parseInt(offset))
          .query(`
            SELECT id, numero_fe, site, code_article, designation,
                   numero_of, quantite, qte_non_conforme,
                   type_evenement, description, moyen_detection,
                   gravite, declarant_nom, statut, date_creation, updated_at
            FROM   dbo.fiches_evenements
            ORDER  BY date_creation DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
          `)
          .then(r => {
            console.log(`[nc-fe GET /all] ${site} → ${r.recordset.length} lignes`);
            return r.recordset.map(row => ({
              ...row,
              source:           "app",
              statut:           normaliseStatut(row.statut),
              type_nc:          row.type_evenement,
              qte_non_conforme: row.qte_non_conforme ?? row.quantite,
            }));
          })
          .catch(err => {
            console.error(`[nc-fe GET /all] Erreur site ${site}:`, err.message);
            return [];
          })
      )
    );

    const items = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));

    console.log(`[nc-fe GET /all] Total items: ${items.length}`);
    res.json({ success: true, items, total: items.length });

  } catch (err) {
    console.error("[nc-fe GET /all]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── GET /api/nc-fe/:site — FE d'un site (protégé) ────────────
router.get("/:site", verifyToken, requireSite, async (req, res) => {
  const { site } = req.params;
  const { statut, type_evenement, limit = 50, offset = 0 } = req.query;

  try {
    const pool = getWritePoolBySite(site);
    let where  = "WHERE 1=1";
    const r    = pool.request()
      .input("limit",  parseInt(limit))
      .input("offset", parseInt(offset));

    if (statut)         { where += " AND statut = @statut";                 r.input("statut",         statut); }
    if (type_evenement) { where += " AND type_evenement = @type_evenement"; r.input("type_evenement", type_evenement); }

    const result = await r.query(`
      SELECT * FROM dbo.fiches_evenements ${where}
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
  const { statut, gravite, traitement, decision, no_commande } = req.body;
  const sets = [];
  const pool = getWritePoolBySite(site);
  const r    = pool.request().input("id", parseInt(id));

  if (statut)      { sets.push("statut = @statut");         r.input("statut",      statut); }
  if (no_commande !== undefined) { sets.push("no_commande = @no_commande"); r.input("no_commande", no_commande || null); }
  if (gravite)    { sets.push("gravite = @gravite");       r.input("gravite",    gravite); }
  if (traitement) { sets.push("traitement = @traitement"); r.input("traitement", traitement); }
  if (decision)   { sets.push("decision = @decision");    r.input("decision",   decision); }
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

// ── DELETE /api/nc-fe/:site/:id — Supprimer FE ouverte ───────
// Responsable uniquement — seulement si statut = 'ouvert'
router.delete("/:site/:id", verifyToken, requireSite, requireRole("responsable", "admin"), async (req, res) => {
  const { site, id } = req.params;

  try {
    const pool = getWritePoolBySite(site);

    // Vérifie que la FE existe et est encore ouverte
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT id, numero_fe, statut FROM dbo.fiches_evenements WHERE id = @id`);

    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const fe = check.recordset[0];
    if (fe.statut !== "ouvert")
      return res.status(400).json({ success: false, message: `Impossible de supprimer une FE avec statut "${fe.statut}". Seules les FE ouvertes peuvent être supprimées.` });

    await pool.request()
      .input("id", parseInt(id))
      .query(`DELETE FROM dbo.fiches_evenements WHERE id = @id`);

    console.log(`[nc-fe DELETE /${site}/${id}] FE ${fe.numero_fe} supprimée par user ${req.user?.userId}`);
    res.json({ success: true, message: `FE ${fe.numero_fe} supprimée.` });

  } catch (err) {
    console.error(`[nc-fe DELETE /${site}/${id}]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


// ── PATCH /api/nc-fe/delai — Calculer et stocker le délai sécurisation ────
// Appelé automatiquement à la création ou manuellement
// Body: { site, id } ou via query params
router.patch("/delai", verifyToken, async (req, res) => {
  const { site, id } = req.body;

  if (!site || !id)
    return res.status(400).json({ success: false, message: "site et id requis." });

  if (!VALID_SITES.includes(site?.toLowerCase()))
    return res.status(400).json({ success: false, message: "Site invalide." });

  try {
    const pool = getWritePoolBySite(site);

    // Récupère la date de création
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT id, numero_fe, date_creation, delai_securisation FROM dbo.fiches_evenements WHERE id = @id`);

    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const fe = check.recordset[0];
    const dateCreation = new Date(fe.date_creation);

    // Calcul côté serveur : date_creation + 48 jours ouvrés
    const delai = addHeuresOuvrees(dateCreation, 48);
    const delaiStr = delai.toISOString(); // datetime ISO pour précision heure

    await pool.request()
      .input("id",    parseInt(id))
      .input("delai", delaiStr)
      .query(`UPDATE dbo.fiches_evenements SET delai_securisation = @delai, updated_at = GETDATE() WHERE id = @id`);

    console.log(`[nc-fe PATCH /delai] FE ${fe.numero_fe} → délai ${delaiStr}`);
    res.json({ success: true, numero_fe: fe.numero_fe, delai_securisation: delaiStr });

  } catch (err) {
    console.error("[nc-fe PATCH /delai]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── PATCH /api/nc-fe/:site/contester — Contester une FE client ───────────
// Réservé aux qualitiens / responsables connectés
router.patch("/:site/contester", verifyToken, requireSite, async (req, res) => {
  const { site } = req.params;
  const { id, motif = "" } = req.body;

  if (!id)
    return res.status(400).json({ success: false, message: "id requis." });

  try {
    const pool  = getWritePoolBySite(site);
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT id, numero_fe, contestee FROM dbo.fiches_evenements WHERE id = @id`);

    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const fe = check.recordset[0];
    // Toggle contestation
    const nouvelleValeur = fe.contestee ? 0 : 1;

    await pool.request()
      .input("id",     parseInt(id))
      .input("val",    nouvelleValeur)
      .input("motif",  motif || null)
      .query(`
        UPDATE dbo.fiches_evenements
        SET contestee = @val, motif_contestation = @motif, updated_at = GETDATE()
        WHERE id = @id
      `);

    console.log(`[nc-fe PATCH /:site/contester] FE ${fe.numero_fe} contestee=${nouvelleValeur}`);
    res.json({
      success:   true,
      numero_fe: fe.numero_fe,
      contestee: !!nouvelleValeur,
      motif_contestation: motif || null,
    });

  } catch (err) {
    console.error(`[nc-fe PATCH /${site}/contester]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── GET /api/nc-fe/:site/:id/ouvrir-dossier — ouvre le dossier dans l'explorateur Windows
// :id peut être un int (FE App) ou un numero_fe string (FE SILOG)
router.get("/:site/:id/ouvrir-dossier", verifyToken, requireSite, async (req, res) => {
  const { site, id } = req.params;
  const { getDossierFEPath, creerDossierFE } = await import("../utils/dossierFE.js");
  const { exec } = await import("child_process");

  try {
    let numero_fe = id;

    // Si l'id est numérique → cherche en BDD
    if (/^\d+$/.test(id)) {
      const pool  = getWritePoolBySite(site);
      const check = await pool.request()
        .input("id", parseInt(id))
        .query(`SELECT numero_fe FROM dbo.fiches_evenements WHERE id = @id`);
      if (check.recordset.length > 0) {
        numero_fe = check.recordset[0].numero_fe;
      }
      // Si non trouvé en BDD avec l'id numérique, on utilise l'id tel quel comme numero_fe
    }
    // Sinon c'est déjà un numero_fe (ex: SOU260175)

    // Crée le dossier s'il n'existe pas encore
    creerDossierFE(numero_fe, site);
    const dossierPath = getDossierFEPath(numero_fe, site);

    // Ouvre le dossier dans l'explorateur Windows côté serveur
    exec(`explorer "${dossierPath}"`, (err) => {
      if (err) console.warn(`[ouvrir-dossier] explorer error: ${err.message}`);
    });

    console.log(`[ouvrir-dossier] ${dossierPath}`);
    res.json({ success: true, path: dossierPath, message: "Dossier ouvert." });

  } catch (err) {
    console.error(`[nc-fe GET ouvrir-dossier]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── GET /api/nc-fe/:site/:id/fichiers — liste les fichiers du dossier FE
router.get("/:site/:id/fichiers", verifyToken, requireSite, async (req, res) => {
  const { site, id } = req.params;
  try {
    const pool = getWritePoolBySite(site);
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT numero_fe FROM dbo.fiches_evenements WHERE id = @id`);
    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });
    const { numero_fe } = check.recordset[0];
    const result = listerFichiersFE(numero_fe, site);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[nc-fe GET /${site}/${id}/fichiers]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/nc-fe/:site/:id/upload — upload un fichier dans le dossier FE
router.post("/:site/:id/upload", verifyToken, requireSite, async (req, res) => {
  const { site, id } = req.params;
  const { sous_type, nom_fichier, base64 } = req.body;

  if (!sous_type || !nom_fichier || !base64)
    return res.status(400).json({ success: false, message: "sous_type, nom_fichier et base64 requis." });

  try {
    const pool = getWritePoolBySite(site);
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT numero_fe FROM dbo.fiches_evenements WHERE id = @id`);
    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const { numero_fe } = check.recordset[0];
    const result = sauvegarderFichier(numero_fe, site, sous_type, nom_fichier, base64);

    if (!result.success)
      return res.status(500).json({ success: false, message: result.error });

    res.json({ success: true, path: result.path });
  } catch (err) {
    console.error(`[nc-fe POST /${site}/${id}/upload]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/nc-fe/:site/:id/demande-suppression ────────────
// Accessible à tout user connecté — crée une demande en attente
router.post("/:site/:id/demande-suppression", verifyToken, requireSite, async (req, res) => {
  const { site, id } = req.params;
  const { motif = "" } = req.body;

  try {
    const pool = getWritePoolBySite(site);

    // Vérifie que la FE existe
    const check = await pool.request()
      .input("id", parseInt(id))
      .query(`SELECT id, numero_fe FROM dbo.fiches_evenements WHERE id = @id`);

    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: "FE introuvable." });

    const fe = check.recordset[0];

    // Vérifie qu'il n'y a pas déjà une demande en attente pour cette FE
    const existing = await pool.request()
      .input("fe_id", parseInt(id))
      .input("site",  site.toUpperCase())
      .query(`SELECT id FROM dbo.demandes_suppression WHERE fe_id = @fe_id AND site = @site AND statut = 'en_attente'`);

    if (existing.recordset.length > 0)
      return res.status(409).json({ success: false, message: "Une demande est déjà en attente pour cette FE." });

    const demandeurNom   = req.user?.nom   ? `${req.user.prenom || ""} ${req.user.nom}`.trim() : req.user?.email || "Inconnu";
    const demandeurEmail = req.user?.email || null;

    await pool.request()
      .input("numero_fe",       fe.numero_fe)
      .input("site",            site.toUpperCase())
      .input("fe_id",           parseInt(id))
      .input("motif",           motif || null)
      .input("demandeur_nom",   demandeurNom)
      .input("demandeur_email", demandeurEmail)
      .query(`
        INSERT INTO dbo.demandes_suppression
          (numero_fe, site, fe_id, motif, demandeur_nom, demandeur_email)
        VALUES
          (@numero_fe, @site, @fe_id, @motif, @demandeur_nom, @demandeur_email)
      `);

    console.log(`[nc-fe POST demande-suppression] ${fe.numero_fe} par ${demandeurNom}`);
    res.status(201).json({ success: true, message: `Demande de suppression envoyée pour ${fe.numero_fe}.` });

  } catch (err) {
    console.error(`[nc-fe POST demande-suppression]`, err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;