// db-sqlserver.js - Connexion SQL Server pour les FE
import sql from "mssql";
import "dotenv/config";

// Configuration SQL Server
const config = {
  server: process.env.DB_SERVER || "sqlc2",
  database: process.env.DB_DATABASE || "KTISSOUCY",
  user: process.env.DB_USER || "aesshih",
  password: process.env.DB_PASSWORD || "Aesshih2601!",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // false pour réseau local
    trustServerCertificate: process.env.DB_TRUST_CERT === "true", // true pour dev
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Pool de connexions
let pool = null;

/**
 * Obtenir le pool de connexions (singleton)
 */
export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ Connecté à SQL Server:", config.database);
  }
  return pool;
}

/**
 * Exécuter une requête SQL
 * @param {string} query - Requête SQL
 * @param {object} params - Paramètres (ex: {id: 123, statut: 'Ouvert'})
 */
export async function query(query, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Ajouter les paramètres
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error("❌ Erreur SQL:", error);
    throw error;
  }
}

/**
 * Fermer la connexion (à appeler lors du shutdown)
 */
export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("🔌 Connexion SQL Server fermée");
  }
}

// Gestion propre de l'arrêt
process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closePool();
  process.exit(0);
});

export default { getPool, query, closePool };
