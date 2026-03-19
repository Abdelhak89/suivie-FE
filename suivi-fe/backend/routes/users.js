// routes/users.js
import { Router } from "express";
import bcrypt      from "bcrypt";
import { getPool } from "../db-sqlserver.js";
import { verifyToken, requireRole } from "../middlewares/verifyToken.js";

const router = Router();

// Toutes les routes users nécessitent d'être connecté + role admin
router.use(verifyToken, requireRole("admin", "responsable"));

// ── GET /api/users — liste tous les users ─────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await getPool("auth").request().query(`
      SELECT id, nom, prenom, email, role, sites, actif, created_at
      FROM   users
      ORDER  BY nom, prenom
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("[users GET]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/users — créer un user ──────────────────────────
router.post("/", requireRole("admin"), async (req, res) => {
  const { nom, prenom, email, password, role = "qualiticien", sites = "SOUCY" } = req.body;

  if (!nom || !prenom || !email || !password)
    return res.status(400).json({ success: false, message: "nom, prenom, email, password requis." });

  try {
    const pool = getPool("auth");

    // Vérifie doublon email
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
      .input("sites",  sites)
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
router.patch("/:id", requireRole("admin"), async (req, res) => {
  const { nom, prenom, email, role, sites, actif, password } = req.body;
  const sets = [];
  const pool = getPool("auth");
  const r    = pool.request().input("id", parseInt(req.params.id));

  if (nom    !== undefined) { sets.push("nom = @nom");       r.input("nom",    nom); }
  if (prenom !== undefined) { sets.push("prenom = @prenom"); r.input("prenom", prenom); }
  if (email  !== undefined) { sets.push("email = @email");   r.input("email",  email.trim().toLowerCase()); }
  if (role   !== undefined) { sets.push("role = @role");     r.input("role",   role); }
  if (sites  !== undefined) { sets.push("sites = @sites");   r.input("sites",  sites); }
  if (actif  !== undefined) { sets.push("actif = @actif");   r.input("actif",  actif ? 1 : 0); }

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
router.delete("/:id", requireRole("admin"), async (req, res) => {
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