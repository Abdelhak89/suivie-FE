// server.js - Serveur API pour les Fiches Événements
import express from "express";
import cors from "cors";
import "dotenv/config";
import feRoutes from "./routes/fe.js";
import { getPool, closePool } from "./db-sqlserver.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "SQL Server - KTISSOUCY"
  });
});

// Routes API
app.use("/api/fe", feRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({
    name: "API Fiches Événements Qualité",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      fe: {
        list: "GET /api/fe",
        search: "GET /api/fe/search?q=...",
        stats: "GET /api/fe/stats",
        detail: "GET /api/fe/:numero",
        exports: {
          list: "GET /api/fe/:numero/exports",
          a3dmaic: "POST /api/fe/:numero/export/a3dmaic",
          alerte: "POST /api/fe/:numero/export/alerte",
          clinique: "POST /api/fe/:numero/export/clinique",
          derogation: "POST /api/fe/:numero/export/derogation"
        }
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Erreur serveur interne"
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    // Test connexion BDD
    await getPool();
    console.log("✅ Connexion à SQL Server établie");
    
    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 Serveur API FE démarré sur le port ${PORT}`);
      console.log(`📊 Base de données: ${process.env.DB_DATABASE}@${process.env.DB_SERVER}`);
      console.log(`💾 Exports réseau: ${process.env.NETWORK_EXPORT_PATH}`);
      console.log(`\n🔗 API disponible sur: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}/`);
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage du serveur:", error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on("SIGINT", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await closePool();
  process.exit(0);
});

// Démarrer
startServer();
