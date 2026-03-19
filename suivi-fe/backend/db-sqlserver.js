// db-sqlserver.js
import sql        from "mssql";
import "dotenv/config";

// ── Config SQLC2 (SILOG — lecture seule) ───────────────────
const CONFIG_SQLC2 = {
  server:   process.env.DB_SERVER   || "sqlc2",
  user:     process.env.DB_USER     || "aesshih",
  password: process.env.DB_PASSWORD || "Aesshih2601!",
  requestTimeout:    60000,
  connectionTimeout: 15000,
  options: {
    encrypt:                process.env.DB_ENCRYPT    === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

// ── Config KEPBI\SQLEXPRESS (nouvelles BDD — lecture/écriture) ─
const CONFIG_KEPBI = {
  server:   process.env.DB_SERVER_KEP  || "172.16.249.13",
  port:     parseInt(process.env.DB_PORT_KEP  || "1433"),
  user:     process.env.DB_USER_KEP    || "kep_app",
  password: process.env.DB_PASSWORD_KEP|| "KepApp#2024!Sqlx",
  requestTimeout:    60000,
  connectionTimeout: 15000,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
    instanceName:           "",
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

// ── Définition des bases ──────────────────────────────────────
const DATABASES = {
  ktissoucy: { config: CONFIG_SQLC2, database: process.env.DB_KTISSOUCY  || "KTISSOUCY"  },
  ktislaxou: { config: CONFIG_SQLC2, database: process.env.DB_KTISLAXOU  || "KTISLAXOU"  },
  kmtm:      { config: CONFIG_SQLC2, database: process.env.DB_KMTM       || "KMTM"       },
  auth:      { config: CONFIG_KEPBI, database: process.env.DB_AUTH       || "KEP_AUTH"      },
  nc_soucy:  { config: CONFIG_KEPBI, database: process.env.DB_NC_SOUCY   || "KEP_NC_SOUCY"  },
  nc_sens:   { config: CONFIG_KEPBI, database: process.env.DB_NC_SENS    || "KEP_NC_SENS"   },
  nc_laxou:  { config: CONFIG_KEPBI, database: process.env.DB_NC_LAXOU   || "KEP_NC_LAXOU"  },
  nc_kmtm:   { config: CONFIG_KEPBI, database: process.env.DB_NC_KMTM    || "KEP_NC_KMTM"   },
  groupe:    { config: CONFIG_KEPBI, database: process.env.DB_NC_GROUPE  || "KEP_NC_GROUPE" },
};

const SITE_TO_POOL_READ = {
  soucy: "ktissoucy", sens: "ktissoucy", laxou: "ktislaxou", kmtm: "kmtm",
};
const SITE_TO_POOL_WRITE = {
  soucy: "nc_soucy", sens: "nc_sens", laxou: "nc_laxou", kmtm: "nc_kmtm",
};

const pools = {};

// ── Init tous les pools au démarrage ─────────────────────────
export async function initPools() {
  for (const [key, { config, database }] of Object.entries(DATABASES)) {
    try {
      const pool = await new sql.ConnectionPool({ ...config, database }).connect();
      pools[key] = pool;
      console.log(`✅ Pool [${key}] connecté → ${config.server}\\${database}`);
    } catch (err) {
      console.error(`❌ Pool [${key}] échec → ${database}:`, err.message);
    }
  }
}

// ── Fermer tous les pools ─────────────────────────────────────
export async function closePools() {
  for (const [key, pool] of Object.entries(pools)) {
    try { await pool.close(); } catch (_) {}
    console.log(`Pool [${key}] fermé.`);
  }
}

// ── Accès par clé ─────────────────────────────────────────────
export function getPool(key = "ktissoucy") {
  const pool = pools[key];
  if (!pool) throw new Error(`Pool [${key}] non disponible.`);
  return pool;
}

// ── Accès par site ────────────────────────────────────────────
export function getReadPoolBySite(site) {
  const key = SITE_TO_POOL_READ[site?.toLowerCase()];
  if (!key) throw new Error(`Site inconnu : ${site}`);
  return getPool(key);
}

export function getWritePoolBySite(site) {
  const key = SITE_TO_POOL_WRITE[site?.toLowerCase()];
  if (!key) throw new Error(`Site inconnu : ${site}`);
  return getPool(key);
}

// ── Compat descendante — query() sur KTISSOUCY ───────────────
export async function query(queryStr, params = {}) {
  try {
    const pool    = getPool("ktissoucy");
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

// ── Alias closePool (compat) ──────────────────────────────────
export async function closePool() { await closePools(); }

process.on("SIGINT",  async () => { await closePools(); process.exit(0); });
process.on("SIGTERM", async () => { await closePools(); process.exit(0); });

export default { getPool, getReadPoolBySite, getWritePoolBySite, initPools, closePools, closePool, query };