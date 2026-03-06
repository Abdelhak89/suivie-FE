// db-sqlserver.js - Connexion SQL Server pour les FE
import sql from "mssql";
import "dotenv/config";

const config = {
  server: process.env.DB_SERVER || "sqlc2",
  database: process.env.DB_DATABASE || "KTISSOUCY",
  user: process.env.DB_USER || "aesshih",
  password: process.env.DB_PASSWORD || "Aesshih2601!",
  requestTimeout: 60000,   // ← 60s (défaut = 15s)
  connectionTimeout: 15000,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ Connecté à SQL Server:", config.database);
  }
  return pool;
}

export async function query(queryStr, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    return await request.query(queryStr);
  } catch (error) {
    console.error("❌ Erreur SQL:", error);
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("🔌 Connexion SQL Server fermée");
  }
}

process.on("SIGINT",  async () => { await closePool(); process.exit(0); });
process.on("SIGTERM", async () => { await closePool(); process.exit(0); });

export default { getPool, query, closePool };