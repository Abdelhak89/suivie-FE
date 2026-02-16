// services/feRoutingService.js - Service pour router les FE vers les bonnes pages

/**
 * Déterminer la page de destination d'une FE basée sur son origine
 * @param {Object} fe - Fiche événement
 * @returns {string} - 'interne', 'fournisseur', ou 'client'
 */
export function getFePageRoute(fe) {
  if (!fe || !fe.origine) return null;
  
  const origine = fe.origine.trim().toUpperCase();
  
  // Mapping des codes OrigineNonConf vers les pages
  const routeMap = {
    'CINT': 'interne',        // Client Interne → Page Interne Série
    'DFOU': 'fournisseur',    // Défaut Fournisseur → Page Fournisseur
    'RCLI': 'client',         // Réclamation Client → Page Client
    'CEXT': 'client'          // Client Externe → Page Client (si existe)
  };
  
  return routeMap[origine] || null;
}

/**
 * Filtrer les FE pour une page spécifique
 * @param {Array} feList - Liste de FE
 * @param {string} page - 'interne', 'fournisseur', ou 'client'
 * @returns {Array} - FE filtrées
 */
export function filterFeByPage(feList, page) {
  if (!Array.isArray(feList)) return [];
  
  return feList.filter(fe => getFePageRoute(fe) === page);
}

/**
 * Obtenir les statistiques par page
 * @param {Array} feList - Liste de FE
 * @returns {Object} - Stats par page
 */
export function getFeStatsByPage(feList) {
  const stats = {
    interne: { total: 0, en_cours: 0, traitees: 0 },
    fournisseur: { total: 0, en_cours: 0, traitees: 0 },
    client: { total: 0, en_cours: 0, traitees: 0 },
    autres: { total: 0, en_cours: 0, traitees: 0 }
  };
  
  feList.forEach(fe => {
    const page = getFePageRoute(fe) || 'autres';
    
    stats[page].total++;
    
    if (fe.statut === 'En cours') {
      stats[page].en_cours++;
    } else if (fe.statut === 'Traitée') {
      stats[page].traitees++;
    }
  });
  
  return stats;
}

/**
 * Valider si une FE appartient à une page donnée
 * @param {Object} fe - Fiche événement
 * @param {string} page - 'interne', 'fournisseur', ou 'client'
 * @returns {boolean}
 */
export function feMatchesPage(fe, page) {
  return getFePageRoute(fe) === page;
}

export default {
  getFePageRoute,
  filterFeByPage,
  getFeStatsByPage,
  feMatchesPage
};