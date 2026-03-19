// src/utils/auth.js
// Utilitaires JWT partagés entre toutes les pages

export function getSiteFromJWT() {
  try {
    const u = JSON.parse(localStorage.getItem("kep_user"));
    if (!u?.sites) return "soucy";
    if (u.sites === "ALL") return "soucy";
    return u.sites.split(",")[0].trim().toLowerCase();
  } catch { return "soucy"; }
}

export function getAllSitesFromJWT() {
  try {
    const u = JSON.parse(localStorage.getItem("kep_user"));
    if (!u?.sites) return ["soucy"];
    if (u.sites === "ALL") return ["soucy", "sens", "laxou", "kmtm"];
    return u.sites.split(",").map(s => s.trim().toLowerCase());
  } catch { return ["soucy"]; }
}

export function getTokenFromStorage() {
  return localStorage.getItem("kep_token");
}

export function getUserFromStorage() {
  try { return JSON.parse(localStorage.getItem("kep_user")); }
  catch { return null; }
}