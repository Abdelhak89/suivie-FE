// services/feService.js - Service pour gérer les Fiches Événements
import { query } from "../db-sqlserver.js";

/**
 * Mapper les données de NCONFORMITE vers le format FE de l'application
 */
function mapNconformiteToFE(row) {
  return {
    // Identifiants
    numero_fe: row.NonConformite,
    code_lancement: row.CodeLancement,
    code_article: row.CodeArticle,
    
    // Dates
    date_creation: row.DateNonConf,
    date_decouverte: row.DateDecouverte,
    date_decision: row.DateDecision,
    date_action: row.DateAction,
    
    // Informations générales
    designation: row.LibelleNonConf,
    origine: row.OrigineNonConf,
    sous_origine: row.SousOrigine,
    type_nc: row.TypeNonConf,
    sous_type_nc: row.SousTypeNonConf,
    statut: row.NonConfTraite === 'O' ? 'Traitée' : 'En cours',
    
    // Découverte
    lieu_detection: row.SousOrigine,
    decouvert_par: row.DecouvertPar,
    
    // Quantités
    qte_non_conforme: row.QteNonConf,
    qte_acceptee: row.QteAccepteeEtat,
    qte_remise_conf: row.QteRemiseConf,
    qte_rebutee: row.QteRebutee,
    
    // Responsabilités
    fournisseur_resp: row.CodeFournisseurResp,
    operateur_resp: row.CodeOperateurResp,
    machine_resp: row.CodeMachineResp,
    
    // Descriptions (IDs vers tables de texte)
    id_description: row.IdDescription,
    id_analyse: row.IdDescAnalyse,
    id_action: row.IdAction,
    id_action_immediate: row.IdActImmediate,
    id_note: row.IdNote,
    
    // Coûts
    cout_gestion: row.CoutGestion,
    cout_remise_conf: row.CoutRemiseConf,
    cout_rebut: row.CoutRebut,
    
    // Avancements
    avancement_global: row.AvancNonConf,
    avancement_analyse: row.AvancRespons,
    avancement_traitement: row.AvancTraitement,
    avancement_decision: row.AvancDecision,
    
    // Priorité et gravité
    priorite: row.Priorite,
    gravite: row.Gravite,
    
    // Client/Fournisseur
    client_fourn: row.ClientFourn,
    no_commande: row.NoCommande,
    
    // Affaire
    numero_affaire: row.NumeroAffaire,
    code_section: row.CodeSection,
    
    // Variables utilisateur
    var_alpha_1: row.VarAlphaUtil,
    var_alpha_2: row.VarAlphaUtil2,
    var_alpha_3: row.VarAlphaUtil3,
    var_num_1: row.VarNumUtil,
    var_num_2: row.VarNumUtil2,
    var_num_3: row.VarNumUtil3,
    
    // Données brutes complètes pour compatibilité avec exports
    data: row
  };
}

/**
 * Récupérer toutes les FE avec filtres optionnels
 * Retourne le COUNT total + les données paginées (50 par défaut)
 */
export async function getAllFE({
  statut = null,
  code_article = null,
  code_lancement = null,
  date_debut = null,
  date_fin = null,
  origine = null,
  type_nc = null,
  limit = 50,
  offset = 0
} = {}) {
  // Construction de la clause WHERE commune
  let whereClause = `WHERE 1=1`;
  const params = {};
  
  if (statut) {
    whereClause += ` AND NonConfTraite = @statut`;
    params.statut = statut === 'Traitée' ? 'O' : 'N';
  }
  
  if (code_article) {
    whereClause += ` AND CodeArticle LIKE @code_article`;
    params.code_article = `%${code_article}%`;
  }
  
  if (code_lancement) {
    whereClause += ` AND CodeLancement = @code_lancement`;
    params.code_lancement = code_lancement;
  }
  
  if (date_debut) {
    whereClause += ` AND DateNonConf >= @date_debut`;
    params.date_debut = date_debut;
  }
  
  if (date_fin) {
    whereClause += ` AND DateNonConf <= @date_fin`;
    params.date_fin = date_fin;
  }
  
  if (origine) {
    whereClause += ` AND OrigineNonConf = @origine`;
    params.origine = origine;
  }
  
  if (type_nc) {
    whereClause += ` AND TypeNonConf = @type_nc`;
    params.type_nc = type_nc;
  }
  
  // 1. D'abord compter le TOTAL (sans limite)
  const countSql = `
    SELECT COUNT(*) as total
    FROM dbo.NCONFORMITE
    ${whereClause}
  `;
  
  const countResult = await query(countSql, params);
  const total = countResult.recordset[0].total;
  
  // 2. Ensuite récupérer les données paginées
  const dataSql = `
    SELECT *
    FROM dbo.NCONFORMITE
    ${whereClause}
    ORDER BY DateNonConf DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;
  
  params.offset = offset;
  params.limit = limit;
  
  const dataResult = await query(dataSql, params);
  const items = dataResult.recordset.map(mapNconformiteToFE);
  
  // 3. Retourner les deux
  return {
    items,
    total,
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Récupérer une FE par son numéro
 */
export async function getFEByNumero(numeroFE) {
  const sql = `
    SELECT *
    FROM dbo.NCONFORMITE
    WHERE NonConformite = @numero_fe
  `;
  
  const result = await query(sql, { numero_fe: numeroFE });
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return mapNconformiteToFE(result.recordset[0]);
}

/**
 * Récupérer les statistiques des FE
 */
export async function getFEStats() {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN NonConfTraite = 'O' THEN 1 ELSE 0 END) as traitees,
      SUM(CASE WHEN NonConfTraite = 'N' THEN 1 ELSE 0 END) as en_cours,
      COUNT(DISTINCT CodeArticle) as articles_distincts,
      COUNT(DISTINCT CodeLancement) as lancements_distincts,
      AVG(CAST(AvancNonConf as FLOAT)) as avancement_moyen,
      SUM(CAST(CoutGestion as FLOAT)) as cout_total_gestion,
      SUM(CAST(CoutRemiseConf as FLOAT)) as cout_total_remise_conf,
      SUM(CAST(CoutRebut as FLOAT)) as cout_total_rebut
    FROM dbo.NCONFORMITE
  `;
  
  const result = await query(sql);
  return result.recordset[0];
}

/**
 * Récupérer les statistiques par type
 */
export async function getFEStatsByType() {
  const sql = `
    SELECT 
      TypeNonConf as type,
      COUNT(*) as count,
      SUM(CASE WHEN NonConfTraite = 'O' THEN 1 ELSE 0 END) as traitees,
      SUM(CASE WHEN NonConfTraite = 'N' THEN 1 ELSE 0 END) as en_cours
    FROM dbo.NCONFORMITE
    WHERE TypeNonConf IS NOT NULL AND TypeNonConf != ''
    GROUP BY TypeNonConf
    ORDER BY count DESC
  `;
  
  const result = await query(sql);
  return result.recordset;
}

/**
 * Récupérer les statistiques par client (3 premiers caractères de CodeArticle)
 */
export async function getFEStatsByClient() {
  const sql = `
    SELECT 
      LEFT(CodeArticle, 3) as client,
      COUNT(*) as count,
      SUM(CASE WHEN NonConfTraite = 'O' THEN 1 ELSE 0 END) as traitees,
      SUM(CASE WHEN NonConfTraite = 'N' THEN 1 ELSE 0 END) as en_cours
    FROM dbo.NCONFORMITE
    WHERE CodeArticle IS NOT NULL AND LEN(CodeArticle) >= 3
    GROUP BY LEFT(CodeArticle, 3)
    ORDER BY count DESC
  `;
  
  const result = await query(sql);
  return result.recordset;
}

/**
 * Récupérer les statistiques mensuelles
 */
export async function getFEStatsByMonth(annee = new Date().getFullYear()) {
  const sql = `
    SELECT 
      MONTH(DateNonConf) as mois,
      COUNT(*) as count,
      SUM(CASE WHEN NonConfTraite = 'O' THEN 1 ELSE 0 END) as traitees,
      SUM(CASE WHEN NonConfTraite = 'N' THEN 1 ELSE 0 END) as en_cours
    FROM dbo.NCONFORMITE
    WHERE YEAR(DateNonConf) = @annee
    GROUP BY MONTH(DateNonConf)
    ORDER BY mois
  `;
  
  const result = await query(sql, { annee });
  return result.recordset;
}

/**
 * Recherche full-text dans les FE
 */
export async function searchFE(searchTerm, limit = 100) {
  const sql = `
    SELECT TOP (@limit) *
    FROM dbo.NCONFORMITE
    WHERE 
      NonConformite LIKE @search
      OR CodeArticle LIKE @search
      OR CodeLancement LIKE @search
      OR LibelleNonConf LIKE @search
      OR ClientFourn LIKE @search
    ORDER BY DateNonConf DESC
  `;
  
  const result = await query(sql, {
    search: `%${searchTerm}%`,
    limit
  });
  
  return result.recordset.map(mapNconformiteToFE);
}

export default {
  getAllFE,
  getFEByNumero,
  getFEStats,
  getFEStatsByType,
  getFEStatsByClient,
  getFEStatsByMonth,
  searchFE
};