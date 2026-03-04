// services/feService.js - Service pour gérer les Fiches Événements
import { query } from "../db-sqlserver.js";
import { enrichFeListWithDVI, isLancementDVI } from "./feRoutingService.js";

/**
 * Catégoriser un poste spécifique vers une catégorie générale
 */
function categoriserPoste(poste) {
  if (!poste || poste.trim() === '') return null;
  
  const posteUpper = poste.toUpperCase();
  
  if (posteUpper.includes('VERIFICATION') || 
      posteUpper.includes('CONTROLE FINAL') ||
      posteUpper.includes('CTRL FINAL') ||
      posteUpper.includes('CONTRÔLE FINAL')) {
    return 'Contrôle Final';
  }
  
  if (posteUpper.includes('RECEPTION') ||
      posteUpper.includes('RÉCEPTION') ||
      posteUpper.includes('CTRL ENTREE') ||
      posteUpper.includes('CONTROLE ENTREE')) {
    return 'Contrôle à réception';
  }
  
  if (posteUpper.includes('FABRICATION') || 
      posteUpper.includes('PRESSE') ||
      posteUpper.includes('SOUDURE') ||
      posteUpper.includes('MONTAGE') ||
      posteUpper.includes('PRODUCTION') ||
      posteUpper.includes('USINAGE') ||
      posteUpper.includes('TOLERIE') ||
      posteUpper.includes('TÔLERIE') ||
      posteUpper.includes('MECANIQUE') ||
      posteUpper.includes('MÉCANIQUE')) {
    return 'Fabrication';
  }
  
  if (posteUpper.includes('QUALITE') ||
      posteUpper.includes('QUALITÉ') ||
      posteUpper.includes('GMT') ||
      posteUpper.includes('KMTM')) {
    return 'Qualité';
  }
  
  if (posteUpper.includes('ACHAT') ||
      posteUpper.includes('APPRO') ||
      posteUpper.includes('MAGASIN') ||
      posteUpper.includes('LOGISTIQUE')) {
    return 'Achats/Appro';
  }
  
  if (posteUpper.includes('BE ') ||
      posteUpper.includes('METHODE') ||
      posteUpper.includes('MÉTHODE') ||
      posteUpper.includes('CONCEPTION')) {
    return 'BE';
  }
  
  if (posteUpper.includes('ESSAI') ||
      posteUpper.includes('ETALONNAGE') ||
      posteUpper.includes('ÉTALONNAGE') ||
      posteUpper.includes('BANC')) {
    return 'Essais Etalonnages';
  }
  
  if (posteUpper.includes('CLIENT') ||
      posteUpper.includes('THALES') ||
      posteUpper.includes('SAFRAN') ||
      posteUpper.includes('AIRBUS') ||
      posteUpper.includes('MBDA') ||
      posteUpper.includes('PHOTONIS') ||
      posteUpper.includes('SNECMA') ||
      posteUpper.includes('MTU') ||
      posteUpper.includes('ZODIAC') ||
      posteUpper.includes('SEP') ||
      posteUpper.includes('HISPANO')) {
    return 'Client';
  }
  
  if (posteUpper.includes('FOURNISSEUR') ||
      posteUpper.includes('SOUS-TRAITANT') ||
      posteUpper.includes('BODYCOTE') ||
      posteUpper.includes('SECO') ||
      posteUpper.includes('SGS')) {
    return 'Fournisseur/Sous-traitant';
  }
  
  if (posteUpper.includes('COMMERCIAL') ||
      posteUpper.includes('VENTE')) {
    return 'Commercial';
  }
  
  return poste;
}

/**
 * Mapper les données de NCONFORMITE vers le format FE de l'application
 */
function mapNconformiteToFE(row) {
  return {
    numero_fe: row.NonConformite,
    code_lancement: row.VarAlphaUtil,
    code_article: row.CodeArticle,
    
    date_creation: row.DateNonConf,
    date_decouverte: row.DateDecouverte,
    date_decision: row.DateDecision,
    date_action: row.DateAction,
    
    designation: row.LibelleNonConf,
    origine: row.OrigineNonConf ? row.OrigineNonConf.trim() : null,
    sous_origine: row.SousOrigine,
    type_nc: row.TypeNonConf,
    sous_type_nc: row.SousTypeNonConf,
    statut: row.NonConfTraite === 'O' ? 'Traitée' : 'En cours',
    
    lieu_detection: categoriserPoste(row.VarAlphaUtil8),
    lieu_detection_brut: row.VarAlphaUtil8,
    decouvert_par: row.VarAlphaUtil6,
    ilot_generateur: row.VarAlphaUtil4,
    
    qte_estimee: row.VarNumUtil5,
    qte_lancement: row.VarNumUtil,
    qte_produite: row.VarNumUtil2,
    qte_non_conforme: row.QteNonConf,
    qte_acceptee: row.QteAccepteeEtat,
    qte_remise_conf: row.QteRemiseConf,
    qte_rebutee: row.QteRebutee,
    
    fournisseur_resp: row.CodeFournisseurResp,
    operateur_resp: row.CodeOperateurResp,
    machine_resp: row.CodeMachineResp,
    
    id_description: row.IdDescription,
    id_analyse: row.IdDescAnalyse,
    id_action: row.IdAction,
    id_action_immediate: row.IdActImmediate,
    id_note: row.IdNote,
    
    cout_gestion: row.CoutGestion,
    cout_remise_conf: row.CoutRemiseConf,
    cout_rebut: row.CoutRebut,
    
    avancement_global: row.AvancNonConf,
    avancement_analyse: row.AvancRespons,
    avancement_traitement: row.AvancTraitement,
    avancement_decision: row.AvancDecision,
    
    priorite: row.Priorite,
    gravite: row.Gravite,
    
    client_fourn: row.ClientFourn,
    no_commande: row.NoCommande,
    
    numero_affaire: row.NumeroAffaire,
    code_section: row.CodeSection,
    
    cause_apparition: row.VarAlphaUtil9,
    non_detection: row.VarAlphaUtil10,
    
    var_alpha_1: row.VarAlphaUtil,
    var_alpha_2: row.VarAlphaUtil2,
    var_alpha_3: row.VarAlphaUtil3,
    var_alpha_4: row.VarAlphaUtil4,
    var_alpha_5: row.VarAlphaUtil5,
    var_alpha_6: row.VarAlphaUtil6,
    var_alpha_7: row.VarAlphaUtil7,
    var_alpha_8: row.VarAlphaUtil8,
    var_alpha_9: row.VarAlphaUtil9,
    var_alpha_10: row.VarAlphaUtil10,
    var_alpha_11: row.VarAlphaUtil11,
    var_num_1: row.VarNumUtil,
    var_num_2: row.VarNumUtil2,
    var_num_3: row.VarNumUtil3,
    var_num_4: row.VarNumUtil4,
    var_num_5: row.VarNumUtil5,
    var_num_6: row.VarNumUtil6,
    var_num_7: row.VarNumUtil7,
    var_num_8: row.VarNumUtil8,
    var_num_9: row.VarNumUtil9,
    var_num_10: row.VarNumUtil10,
    var_num_11: row.VarNumUtil11,
    
    // is_dvi sera enrichi après le mapping via enrichFeListWithDVI()
    is_dvi: false,
    
    data: row
  };
}

/**
 * Récupérer toutes les FE avec filtres optionnels
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
  offset = 0,
  q = null
} = {}) {
  let whereClause = `WHERE 1=1`;
  const params = {};
  
  if (origine) {
    whereClause += ` AND LTRIM(RTRIM(OrigineNonConf)) = @origine`;
    params.origine = origine;
  }

  if (q && q.trim() !== "") {
    whereClause += ` AND (
      NonConformite LIKE @search 
      OR CodeArticle LIKE @search 
      OR VarAlphaUtil LIKE @search 
      OR LibelleNonConf LIKE @search 
      OR ClientFourn LIKE @search
    )`;
    params.search = `%${q.trim()}%`;
  }
  
  if (statut && statut !== "Tous") {
    whereClause += ` AND NonConfTraite = @statut`;
    params.statut = statut === 'Traitée' ? 'O' : 'N';
  }
  
  if (code_article && !q) {
    whereClause += ` AND CodeArticle LIKE @code_article`;
    params.code_article = `%${code_article}%`;
  }
  
  if (date_debut) {
    whereClause += ` AND DateNonConf >= @date_debut`;
    params.date_debut = date_debut;
  }
  
  if (date_fin) {
    whereClause += ` AND DateNonConf <= @date_fin`;
    params.date_fin = date_fin;
  }

  const countSql = `SELECT COUNT(*) as total FROM dbo.NCONFORMITE ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.recordset[0].total;
  
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
  let items = dataResult.recordset.map(mapNconformiteToFE);

  // ✅ Enrichissement DVI — détermine is_dvi pour le routing FAI
  items = await enrichFeListWithDVI(items);
  
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
  
  const fe = mapNconformiteToFE(result.recordset[0]);

  // ✅ Enrichissement DVI pour une FE unique
  fe.is_dvi = await isLancementDVI(fe.code_lancement);

  return fe;
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
      COUNT(DISTINCT VarAlphaUtil) as lancements_distincts,
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
 * Récupérer les statistiques par client
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
      OR VarAlphaUtil LIKE @search
      OR LibelleNonConf LIKE @search
      OR ClientFourn LIKE @search
    ORDER BY DateNonConf DESC
  `;
  
  const result = await query(sql, {
    search: `%${searchTerm}%`,
    limit
  });

  let items = result.recordset.map(mapNconformiteToFE);
  // ✅ Enrichissement DVI pour la recherche aussi
  items = await enrichFeListWithDVI(items);

  return items;
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