// db-pools.js
// SQLC2  → KTISSOUCY (SOUCY+SENS), KTISLAXOU, KMTM  — lecture seule
// KEPBI  → KEP_AUTH + KEP_NC_*                       — lecture/écriture

import sql from "mssql";

const CONFIG_SQLC2 = {
  server:   process.env.DB_SERVER,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options:  {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

const CONFIG_KEPBI = {
  server:   process.env.DB_SERVER_KEP,  // KEPBI\SQLEXPRESS
  user:     process.env.DB_USER_KEP,
  password: process.env.DB_PASSWORD_KEP,
  options:  {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
};

const pools = {};

const DATABASES = {
  // ── SQLC2 lecture seule ──────────────────────────────────
  ktissoucy:  { config: CONFIG_SQLC2, database: process.env.DB_KTISSOUCY  || "KTISSOUCY"  },  // SOUCY + SENS
  ktislaxou:  { config: CONFIG_SQLC2, database: process.env.DB_KTISLAXOU  || "KTISLAXOU"  },  // LAXOU
  kmtm:       { config: CONFIG_SQLC2, database: process.env.DB_KMTM       || "KMTM"       },  // KMTM
  // ── KEPBI lecture/écriture ──────────────────────────────
  auth:       { config: CONFIG_KEPBI, database: process.env.DB_AUTH       || "KEP_AUTH"      },
  nc_soucy:   { config: CONFIG_KEPBI, database: process.env.DB_NC_SOUCY   || "KEP_NC_SOUCY"  },
  nc_sens:    { config: CONFIG_KEPBI, database: process.env.DB_NC_SENS    || "KEP_NC_SENS"   },
  nc_laxou:   { config: CONFIG_KEPBI, database: process.env.DB_NC_LAXOU   || "KEP_NC_LAXOU"  },
  nc_kmtm:    { config: CONFIG_KEPBI, database: process.env.DB_NC_KMTM    || "KEP_NC_KMTM"   },
};

// Lecture seule SQLC2 → pool par site
const SITE_TO_POOL_READ = {
  soucy: "ktissoucy",
  sens:  "ktissoucy",   // SENS est dans KTISSOUCY
  laxou: "ktislaxou",
  kmtm:  "kmtm",
};

// Écriture KEPBI → pool par site
const SITE_TO_POOL_WRITE = {
  soucy: "nc_soucy",
  sens:  "nc_sens",
  laxou: "nc_laxou",
  kmtm:  "nc_kmtm",
};

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

export async function closePools() {
  for (const [key, pool] of Object.entries(pools)) {
    try { await pool.close(); } catch (_) {}
    console.log(`Pool [${key}] fermé.`);
  }
}

export function getPool(key) {
  const pool = pools[key];
  if (!pool) throw new Error(`Pool [${key}] non disponible.`);
  return pool;
}

// Lecture historique SILOG
export function getReadPoolBySite(site) {
  const key = SITE_TO_POOL_READ[site?.toLowerCase()];
  if (!key) throw new Error(`Site inconnu : ${site}`);
  return getPool(key);
}

// Écriture nouvelles FE/NC
export function getWritePoolBySite(site) {
  const key = SITE_TO_POOL_WRITE[site?.toLowerCase()];
  if (!key) throw new Error(`Site inconnu : ${site}`);
  return getPool(key);
}