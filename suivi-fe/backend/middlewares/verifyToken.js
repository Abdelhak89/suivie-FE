// middlewares/verifyToken.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware principal — bloque si token absent ou invalide
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Authentification requise." });

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError"
      ? "Session expirée, reconnectez-vous."
      : "Token invalide.";
    res.status(401).json({ success: false, message });
  }
}

// Middleware rôle — à chaîner après verifyToken
// ex: router.delete(..., verifyToken, requireRole('admin'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ success: false, message: "Accès non autorisé." });
    next();
  };
}

// Helper — retourne la liste des sites du user sous forme de tableau
export function getUserSites(user) {
  if (!user?.sites) return [];
  if (user.sites === "ALL") return ["SOUCY", "SENS", "LAXOU", "KMTM"];
  return user.sites.split(",").map(s => s.trim().toLowerCase());
}

export function requireSite(req, res, next) {
  const site      = req.params.site?.toUpperCase();
  const userSites = req.user?.sites || "";

  if (userSites === "ALL" || userSites.split(",").includes(site)) {
    next();
  } else {
    res.status(403).json({ success: false, message: `Accès au site ${site} non autorisé.` });
  }
}