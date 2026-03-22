// routes/fe.js
import express from "express";
import feService from "../services/feService.js";
import exportService from "../services/exportService.js";

const router = express.Router();

// Sites Diapason valides
const VALID_SITES = ["soucy", "sens", "laxou", "kmtm"];

router.get("/", async (req, res) => {
  try {
    const {
      statut, code_article, code_lancement,
      date_debut, date_fin, origine, type_nc,
      limit = 50, offset = 0, q,
      site = "soucy",  // ← param site
    } = req.query;

    const siteKey = VALID_SITES.includes(site?.toLowerCase()) ? site.toLowerCase() : "soucy";

    const result = await feService.getAllFE({
      statut, code_article, code_lancement,
      date_debut, date_fin, origine, type_nc,
      limit: parseInt(limit), offset: parseInt(offset), q,
      site: siteKey,
    });

    res.json({
      success: true,
      data: result.items,
      count: result.total,
      limit: result.limit,
      offset: result.offset,
      page: result.page,
      totalPages: result.totalPages,
      site: siteKey,
    });
  } catch (error) {
    console.error("Erreur GET /api/fe:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q, limit = 100, site = "soucy" } = req.query;
    if (!q?.trim()) return res.status(400).json({ success: false, error: "Paramètre 'q' requis" });
    const siteKey = VALID_SITES.includes(site?.toLowerCase()) ? site.toLowerCase() : "soucy";
    const results = await feService.searchFE(q.trim(), parseInt(limit), siteKey);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("Erreur GET /api/fe/search:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const { site = "soucy" } = req.query;
    const siteKey = VALID_SITES.includes(site?.toLowerCase()) ? site.toLowerCase() : "soucy";
    const [stats, statsByType, statsByClient, statsByMonth] = await Promise.all([
      feService.getFEStats(siteKey),
      feService.getFEStatsByType(siteKey),
      feService.getFEStatsByClient(siteKey),
      feService.getFEStatsByMonth(undefined, siteKey),
    ]);
    res.json({ success: true, data: { global: stats, by_type: statsByType, by_client: statsByClient, by_month: statsByMonth } });
  } catch (error) {
    console.error("Erreur GET /api/fe/stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/par-article", async (req, res) => {
  try {
    const { site = "soucy" } = req.query;
    const siteKey = VALID_SITES.includes(site?.toLowerCase()) ? site.toLowerCase() : "soucy";
    const data = await feService.getFECountParArticle(siteKey);
    res.json({ success: true, data, count: data.length, site: siteKey });
  } catch (error) {
    console.error("Erreur GET /api/fe/par-article:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:numero", async (req, res) => {
  try {
    const { numero } = req.params;
    const { site = "soucy" } = req.query;
    const siteKey = VALID_SITES.includes(site?.toLowerCase()) ? site.toLowerCase() : "soucy";
    const fe = await feService.getFEByNumero(numero, siteKey);
    if (!fe) return res.status(404).json({ success: false, error: `FE ${numero} introuvable` });
    res.json({ success: true, data: fe });
  } catch (error) {
    console.error(`Erreur GET /api/fe/${req.params.numero}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:numero/export/alerte", async (req, res) => {
  try {
    const { numero } = req.params;
    const { site = "soucy" } = req.query;
    const fe = await feService.getFEByNumero(numero, site);
    if (!fe) return res.status(404).json({ success: false, error: `FE ${numero} introuvable` });
    const result = await exportService.generateAlerteQualite(fe);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:numero/export/clinique", async (req, res) => {
  try {
    const { numero } = req.params;
    const { site = "soucy" } = req.query;
    const { qualiticien, participants } = req.body;
    const fe = await feService.getFEByNumero(numero, site);
    if (!fe) return res.status(404).json({ success: false, error: `FE ${numero} introuvable` });
    const result = await exportService.generateCliniqueQualite(fe, qualiticien, participants);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:numero/export/derogation", async (req, res) => {
  try {
    const { numero } = req.params;
    const { site = "soucy" } = req.query;
    const fe = await feService.getFEByNumero(numero, site);
    if (!fe) return res.status(404).json({ success: false, error: `FE ${numero} introuvable` });
    const result = await exportService.generateDerogation(fe);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;