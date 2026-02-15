// routes/fe.js - Routes API pour les Fiches Événements
import express from "express";
import feService from "../services/feService.js";
import exportService from "../services/exportService.js";

const router = express.Router();

/**
 * GET /api/fe
 * Liste toutes les FE avec filtres optionnels
 * Retourne : { data: [...], count: total, limit, offset, page, totalPages }
 */
router.get("/", async (req, res) => {
  try {
    const {
      statut,
      code_article,
      code_lancement,
      date_debut,
      date_fin,
      origine,
      type_nc,
      limit = 50,
      offset = 0
    } = req.query;

    const result = await feService.getAllFE({
      statut,
      code_article,
      code_lancement,
      date_debut,
      date_fin,
      origine,
      type_nc,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.items,
      count: result.total,
      limit: result.limit,
      offset: result.offset,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error("Erreur GET /api/fe:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fe/search
 * Recherche full-text dans les FE
 */
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 100 } = req.query;
    
    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Paramètre 'q' requis pour la recherche"
      });
    }

    const results = await feService.searchFE(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error("Erreur GET /api/fe/search:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fe/stats
 * Statistiques globales
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await feService.getFEStats();
    const statsByType = await feService.getFEStatsByType();
    const statsByClient = await feService.getFEStatsByClient();
    const statsByMonth = await feService.getFEStatsByMonth();
    
    res.json({
      success: true,
      data: {
        global: stats,
        by_type: statsByType,
        by_client: statsByClient,
        by_month: statsByMonth
      }
    });
  } catch (error) {
    console.error("Erreur GET /api/fe/stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fe/:numero
 * Détails d'une FE spécifique
 */
router.get("/:numero", async (req, res) => {
  try {
    const { numero } = req.params;
    const fe = await feService.getFEByNumero(numero);
    
    if (!fe) {
      return res.status(404).json({
        success: false,
        error: `FE ${numero} introuvable`
      });
    }
    
    res.json({
      success: true,
      data: fe
    });
  } catch (error) {
    console.error(`Erreur GET /api/fe/${req.params.numero}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fe/:numero/export/alerte
 * Générer export Alerte Qualité
 */
router.post("/:numero/export/alerte", async (req, res) => {
  try {
    const { numero } = req.params;
    const fe = await feService.getFEByNumero(numero);
    
    if (!fe) {
      return res.status(404).json({
        success: false,
        error: `FE ${numero} introuvable`
      });
    }
    
    const result = await exportService.generateAlerteQualite(fe);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Erreur export alerte ${req.params.numero}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fe/:numero/export/clinique
 * Générer export Clinique Qualité
 */
router.post("/:numero/export/clinique", async (req, res) => {
  try {
    const { numero } = req.params;
    const { qualiticien, participants } = req.body;
    
    const fe = await feService.getFEByNumero(numero);
    
    if (!fe) {
      return res.status(404).json({
        success: false,
        error: `FE ${numero} introuvable`
      });
    }
    
    const result = await exportService.generateCliniqueQualite(fe, qualiticien, participants);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Erreur export clinique ${req.params.numero}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fe/:numero/export/derogation
 * Générer export Dérogation
 */
router.post("/:numero/export/derogation", async (req, res) => {
  try {
    const { numero } = req.params;
    const fe = await feService.getFEByNumero(numero);
    
    if (!fe) {
      return res.status(404).json({
        success: false,
        error: `FE ${numero} introuvable`
      });
    }
    
    const result = await exportService.generateDerogation(fe);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Erreur export dérogation ${req.params.numero}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;