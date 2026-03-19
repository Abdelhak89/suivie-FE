// src/services/feApi.js
import { getAllSitesFromJWT } from "../utils/auth.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Sites Diapason uniques — SOUCY et SENS partagent la même BDD
// On déduplique pour éviter des requêtes en double
function getUniqueDiapasonSites(sites) {
  // "sens" est dans ktissoucy comme "soucy" — on évite de fetcher deux fois
  const seen = new Set();
  const unique = [];
  for (const s of sites) {
    const pool = s === "sens" ? "soucy" : s; // sens → pool soucy
    if (!seen.has(pool)) { seen.add(pool); unique.push(s); }
  }
  return unique;
}

/**
 * Récupérer toutes les FE Diapason — tous les sites accessibles au user
 */
export async function getAllFE({
  statut = null, code_article = null, code_lancement = null,
  date_debut = null, date_fin = null, origine = null,
  type_nc = null, limit = 1000, offset = 0, annee = null, q = null,
} = {}) {
  const sites = getUniqueDiapasonSites(getAllSitesFromJWT());

  const params = new URLSearchParams();
  if (statut)       params.set("statut",       statut);
  if (code_article) params.set("code_article", code_article);
  if (origine)      params.set("origine",      origine);
  if (type_nc)      params.set("type_nc",      type_nc);
  if (q)            params.set("q",            q);
  params.set("limit",  String(limit));
  params.set("offset", String(offset));
  if (annee) {
    params.set("date_debut", `${annee}-01-01`);
    params.set("date_fin",   `${annee}-12-31`);
  }

  // Fetch en parallèle sur tous les sites Diapason
  const results = await Promise.allSettled(
    sites.map(site => {
      const p = new URLSearchParams(params);
      p.set("site", site);
      return fetch(`${API_BASE_URL}/api/fe?${p.toString()}`)
        .then(r => r.ok ? r.json() : { data: [] })
        .then(d => (d.data || []).map(fe => ({ ...fe, site_diapason: site.toUpperCase() })))
        .catch(() => []);
    })
  );

  const allItems = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));

  return { items: allItems, total: allItems.length, success: true };
}

/**
 * Recherche full-text — sur le site principal du user
 */
export async function searchFE(searchTerm, limit = 100) {
  const sites = getAllSitesFromJWT();
  const site  = sites[0] || "soucy";
  const params = new URLSearchParams({ q: searchTerm, limit: String(limit), site });
  const response = await fetch(`${API_BASE_URL}/api/fe/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
  const data = await response.json();
  return { items: data.data || [], total: data.count || 0, query: data.query };
}

/**
 * Récupérer une FE par son numéro
 * site optionnel — si non fourni on essaie tous les sites
 */
export async function getFEByNumero(numeroFE, site = null) {
  const sites = site ? [site] : getAllSitesFromJWT();

  for (const s of sites) {
    const url = `${API_BASE_URL}/api/fe/${numeroFE}?site=${s}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.data) return data.data;
    }
  }
  return null;
}

export async function getStats(site = null) {
  const s = site || getAllSitesFromJWT()[0] || "soucy";
  const response = await fetch(`${API_BASE_URL}/api/fe/stats?site=${s}`);
  if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
  const data = await response.json();
  return data.data;
}

export async function exportAlerteQualite(numeroFE, imagePath = null) {
  const site = getAllSitesFromJWT()[0] || "soucy";
  const response = await fetch(`${API_BASE_URL}/api/fe/${numeroFE}/export/alerte?site=${site}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagePath }),
  });
  if (!response.ok) throw new Error(`Erreur export: ${response.status}`);
  return (await response.json()).data;
}

export async function exportCliniqueQualite(numeroFE, qualiticien = "", participants = "") {
  const site = getAllSitesFromJWT()[0] || "soucy";
  const response = await fetch(`${API_BASE_URL}/api/fe/${numeroFE}/export/clinique?site=${site}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qualiticien, participants }),
  });
  if (!response.ok) throw new Error(`Erreur export: ${response.status}`);
  return (await response.json()).data;
}

export async function exportDerogation(numeroFE) {
  const site = getAllSitesFromJWT()[0] || "soucy";
  const response = await fetch(`${API_BASE_URL}/api/fe/${numeroFE}/export/derogation?site=${site}`, { method: "POST" });
  if (!response.ok) throw new Error(`Erreur export: ${response.status}`);
  return (await response.json()).data;
}

export default { getAllFE, searchFE, getFEByNumero, getStats, exportAlerteQualite, exportCliniqueQualite, exportDerogation };