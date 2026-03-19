// server.js
import express from "express";
import cors    from "cors";
import "dotenv/config";

import { initPools, closePools } from "./db-sqlserver.js";

import feRoutes           from "./routes/fe.js";
import lancementsRoutes   from "./routes/lancements.js";
import fournisseursRoutes from "./routes/fournisseurs.js";
import authRoutes         from "./routes/auth.js";
import usersRoutes        from "./routes/users.js";
import ncFeRoutes         from "./routes/nc-fe.js";
import groupeRoutes       from "./routes/groupe.js";
import analysesRoutes     from "./routes/8d.js";

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);
app.use("/api/nc-fe",       ncFeRoutes);
app.use("/api/fe/groupe",   groupeRoutes);
app.use("/api/fe",          feRoutes);
app.use("/api/8d",          analysesRoutes);
app.use("/api/lancements",  lancementsRoutes);
app.use("/api/fournisseurs", fournisseursRoutes);

app.get("/", (req, res) => {
  res.json({ name: "API KEP Qualité", version: "2.0.0" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route non trouvée" });
});

app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({ success: false, error: err.message || "Erreur serveur interne" });
});

async function startServer() {
  try {
    await initPools();
    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 Serveur API démarré sur le port ${PORT}`);
      console.log(`📊 SQLC2: ${process.env.DB_SERVER} | KEPBI: ${process.env.DB_SERVER_KEP}`);
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage:", error);
    process.exit(1);
  }
}

process.on("SIGINT",  async () => { await closePools(); process.exit(0); });
process.on("SIGTERM", async () => { await closePools(); process.exit(0); });

startServer();