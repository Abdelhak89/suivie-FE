// routes/auth.js
import { Router } from "express";
import bcrypt      from "bcrypt";
import jwt         from "jsonwebtoken";
import { getPool } from "../db-sqlserver.js";

const router = Router();
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";  // durée session qualitien

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email et mot de passe requis." });

  try {
    const pool   = getPool("auth");
    const result = await pool.request()
      .input("email", email.trim().toLowerCase())
      .query(`
        SELECT id, nom, prenom, email, password_hash, role, sites, actif
        FROM   users
        WHERE  email = @email
      `);

    const user = result.recordset[0];

    if (!user || !user.actif)
      return res.status(401).json({ success: false, message: "Identifiants incorrects." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: "Identifiants incorrects." });

    // Payload JWT — sites est une string "SOUCY,SENS" ou "ALL"
    const payload = {
      userId: user.id,
      email:  user.email,
      nom:    user.nom,
      prenom: user.prenom,
      role:   user.role,
      sites:  user.sites,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({
      success: true,
      token,
      user: {
        id:     user.id,
        nom:    user.nom,
        prenom: user.prenom,
        email:  user.email,
        role:   user.role,
        sites:  user.sites,
      },
    });

  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────
// Côté serveur on ne fait rien (JWT stateless) — le front supprime le token
// Prévu pour invalidation future via refresh_tokens si besoin
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Déconnecté." });
});

// ── GET /api/auth/me ──────────────────────────────────────────
// Vérifie le token et renvoie les infos user (utile au reload de page)
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Token manquant." });

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ success: false, message: "Token invalide ou expiré." });
  }
});

export default router;