// routes/users.js
import { Router } from "express";
import bcrypt      from "bcrypt";
import { getPool } from "../db-sqlserver.js";
import { verifyToken, requireRole } from "../middlewares/verifyToken.js";

const router = Router();

// ── GET /api/users — filtré automatiquement par les sites du JWT ──
router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = getPool("auth");
    const r    = pool.request();

    // Sites du user connecté depuis le JWT
    const jwtSites = req.user?.sites || "";
    const isAdmin  = req.user?.role === "admin";

    // Site explicite passé en query (optionnel, override)
    const siteParam = req.query.site?.trim().toUpperCase();

    // Sites à filtrer : param explicite > JWT > tout (admin seulement)
    const sitesToFilter = siteParam
      ? [siteParam]
      : jwtSites === "ALL" || isAdmin
        ? null  // null = pas de filtre site → voit tout
        : jwtSites.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

    let sql = `
      SELECT id, nom, prenom, email, role, sites, actif
      FROM   users
      WHERE  role NOT IN ('admin')
    `;

    // Filtre par sites si nécessaire
    if (sitesToFilter && sitesToFilter.length > 0) {
      // Un user est visible si au moins un de ses sites matche
      const conditions = sitesToFilter.map((s, i) => {
        r.input(`site${i}`,       s);
        r.input(`sitePct${i}`,    `${s},%`);
        r.input(`pctSite${i}`,    `%,${s}`);
        r.input(`pctSitePct${i}`, `%,${s},%`);
        return `(
          UPPER(sites) = @site${i}
          OR UPPER(sites) LIKE @sitePct${i}
          OR UPPER(sites) LIKE @pctSite${i}
          OR UPPER(sites) LIKE @pctSitePct${i}
        )`;
      });
      sql += ` AND (${conditions.join(" OR ")})`;
    }

    sql += ` ORDER BY actif DESC, nom, prenom`;

    const result = await r.query(sql);
    res.json({ success: true, data: result.recordset });

  } catch (err) {
    console.error("[users GET]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Toutes les routes de modification nécessitent admin ou responsable
router.use(verifyToken, requireRole("admin", "responsable"));

// ── POST /api/users — créer un user ──────────────────────────
router.post("/", async (req, res) => {
  const { nom, prenom, email, password, role = "qualiticien", sites = "SOUCY" } = req.body;

  if (!nom || !prenom || !email || !password)
    return res.status(400).json({ success: false, message: "nom, prenom, email, password requis." });

  // Un responsable ne peut créer que sur ses propres sites
  const jwtSites = req.user?.sites || "";
  const isAdmin  = req.user?.role === "admin";
  if (!isAdmin && jwtSites !== "ALL") {
    const allowed    = jwtSites.split(",").map(s => s.trim().toUpperCase());
    const requested  = sites.split(",").map(s => s.trim().toUpperCase());
    const forbidden  = requested.filter(s => !allowed.includes(s));
    if (forbidden.length)
      return res.status(403).json({ success: false, message: `Sites non autorisés : ${forbidden.join(", ")}` });
  }

  // Un responsable ne peut pas créer admin
  if (!isAdmin && role === "admin")
    return res.status(403).json({ success: false, message: "Vous ne pouvez pas créer un compte admin." });

  try {
    const pool = getPool("auth");

    const exists = await pool.request()
      .input("email", email.trim().toLowerCase())
      .query("SELECT id FROM users WHERE email = @email");
    if (exists.recordset.length)
      return res.status(409).json({ success: false, message: "Email déjà utilisé." });

    const hash = await bcrypt.hash(password, 12);

    await pool.request()
      .input("nom",    nom.trim())
      .input("prenom", prenom.trim())
      .input("email",  email.trim().toLowerCase())
      .input("hash",   hash)
      .input("role",   role)
      .input("sites",  sites.toUpperCase())
      .query(`
        INSERT INTO users (nom, prenom, email, password_hash, role, sites)
        VALUES (@nom, @prenom, @email, @hash, @role, @sites)
      `);

    res.status(201).json({ success: true, message: `Utilisateur ${prenom} ${nom} créé.` });

  } catch (err) {
    console.error("[users POST]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── PATCH /api/users/:id — modifier un user ───────────────────
router.patch("/:id", async (req, res) => {
  const { nom, prenom, email, role, sites, actif, password, portefeuille } = req.body;
  const isAdmin  = req.user?.role === "admin";
  const jwtSites = req.user?.sites || "";

  // Responsable : vérifie que le user cible est dans ses sites
  if (!isAdmin && jwtSites !== "ALL") {
    const pool = getPool("auth");
    const target = await pool.request()
      .input("id", parseInt(req.params.id))
      .query("SELECT sites, role FROM users WHERE id = @id");
    if (target.recordset.length) {
      const allowed   = jwtSites.split(",").map(s => s.trim().toUpperCase());
      const userSites = (target.recordset[0].sites || "").split(",").map(s => s.trim().toUpperCase());
      const hasAccess = userSites.some(s => allowed.includes(s));
      if (!hasAccess)
        return res.status(403).json({ success: false, message: "Accès non autorisé à cet utilisateur." });
    }
    // Responsable ne peut pas modifier le rôle en admin
    if (role === "admin")
      return res.status(403).json({ success: false, message: "Impossible d'assigner le rôle admin." });
  }

  const sets = [];
  const pool = getPool("auth");
  const r    = pool.request().input("id", parseInt(req.params.id));

  if (nom    !== undefined) { sets.push("nom = @nom");       r.input("nom",    nom); }
  if (prenom !== undefined) { sets.push("prenom = @prenom"); r.input("prenom", prenom); }
  if (email  !== undefined) { sets.push("email = @email");   r.input("email",  email.trim().toLowerCase()); }
  if (role   !== undefined) { sets.push("role = @role");     r.input("role",   role); }
  if (sites  !== undefined) { sets.push("sites = @sites");   r.input("sites",  sites.toUpperCase()); }
  if (actif        !== undefined) { sets.push("actif = @actif");              r.input("actif",        actif ? 1 : 0); }
  if (portefeuille !== undefined) { sets.push("portefeuille = @portefeuille"); r.input("portefeuille", portefeuille != null ? JSON.stringify(portefeuille) : null); }

  if (password) {
    const hash = await bcrypt.hash(password, 12);
    sets.push("password_hash = @hash");
    r.input("hash", hash);
  }

  if (!sets.length)
    return res.status(400).json({ success: false, message: "Rien à modifier." });

  sets.push("updated_at = GETDATE()");

  try {
    await r.query(`UPDATE users SET ${sets.join(", ")} WHERE id = @id`);
    res.json({ success: true, message: "Utilisateur mis à jour." });
  } catch (err) {
    console.error("[users PATCH]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── DELETE /api/users/:id — désactiver (soft delete) ─────────
router.delete("/:id", async (req, res) => {
  const isAdmin  = req.user?.role === "admin";
  const jwtSites = req.user?.sites || "";

  // Responsable : vérifie accès au user cible
  if (!isAdmin && jwtSites !== "ALL") {
    const pool   = getPool("auth");
    const target = await pool.request()
      .input("id", parseInt(req.params.id))
      .query("SELECT sites FROM users WHERE id = @id");
    if (target.recordset.length) {
      const allowed   = jwtSites.split(",").map(s => s.trim().toUpperCase());
      const userSites = (target.recordset[0].sites || "").split(",").map(s => s.trim().toUpperCase());
      const hasAccess = userSites.some(s => allowed.includes(s));
      if (!hasAccess)
        return res.status(403).json({ success: false, message: "Accès non autorisé." });
    }
  }

  try {
    await getPool("auth").request()
      .input("id", parseInt(req.params.id))
      .query("UPDATE users SET actif = 0, updated_at = GETDATE() WHERE id = @id");
    res.json({ success: true, message: "Utilisateur désactivé." });
  } catch (err) {
    console.error("[users DELETE]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

export default router;