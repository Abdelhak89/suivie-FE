// src/services/feApi.js
// Service API pour se connecter au backend Node.js (port 4000)

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Récupérer toutes les FE avec filtres
 */
export async function getAllFE({
  statut = null,
  code_article = null,
  code_lancement = null,
  date_debut = null,
  date_fin = null,
  origine = null,
  type_nc = null,
  limit = 1000,
  offset = 0,
  annee = null,
  q = null // recherche globale
} = {}) {
  const params = new URLSearchParams();
  
  if (statut) params.set('statut', statut);
  if (code_article) params.set('code_article', code_article);
  if (code_lancement) params.set('code_lancement', code_lancement);
  if (date_debut) params.set('date_debut', date_debut);
  if (date_fin) params.set('date_fin', date_fin);
  if (origine) params.set('origine', origine);
  if (type_nc) params.set('type_nc', type_nc);
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  
  // Filtre par année
  if (annee) {
    params.set('date_debut', `${annee}-01-01`);
    params.set('date_fin', `${annee}-12-31`);
  }
  
  const url = `${API_BASE_URL}/api/fe?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    items: data.data || [],
    total: data.count || 0,
    success: data.success
  };
}

/**
 * Recherche full-text
 */
export async function searchFE(searchTerm, limit = 100) {
  const params = new URLSearchParams();
  params.set('q', searchTerm);
  params.set('limit', String(limit));
  
  const url = `${API_BASE_URL}/api/fe/search?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    items: data.data || [],
    total: data.count || 0,
    query: data.query
  };
}

/**
 * Récupérer une FE par son numéro
 */
export async function getFEByNumero(numeroFE) {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Récupérer les statistiques
 */
export async function getStats() {
  const url = `${API_BASE_URL}/api/fe/stats`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Exporter A3 DMAIC
 */
export async function exportA3Dmaic(numeroFE) {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}/export/a3dmaic`;
  
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Erreur export: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data; // { filename, path, relativePath, url }
}

/**
 * Exporter Alerte Qualité
 */
export async function exportAlerteQualite(numeroFE, imagePath = null) {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}/export/alerte`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagePath })
  });
  
  if (!response.ok) {
    throw new Error(`Erreur export: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Exporter Clinique Qualité
 */
export async function exportCliniqueQualite(numeroFE, qualiticien = "", participants = "") {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}/export/clinique`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qualiticien, participants })
  });
  
  if (!response.ok) {
    throw new Error(`Erreur export: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Exporter Dérogation
 */
export async function exportDerogation(numeroFE) {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}/export/derogation`;
  
  const response = await fetch(url, { method: 'POST' });
  
  if (!response.ok) {
    throw new Error(`Erreur export: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Lister les exports existants pour une FE
 */
export async function listExports(numeroFE) {
  const url = `${API_BASE_URL}/api/fe/${numeroFE}/exports`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    exports: data.data || [],
    count: data.count || 0
  };
}

// Export par défaut
export default {
  getAllFE,
  searchFE,
  getFEByNumero,
  getStats,
  exportA3Dmaic,
  exportAlerteQualite,
  exportCliniqueQualite,
  exportDerogation,
  listExports
};