// scripts/test-connections.js
// Lance avec : node scripts/test-connections.js
import "dotenv/config";
import { initPools, getPool, closePools } from "../db-sqlserver.js";

console.log("\n=== Test des connexions SQL Server ===\n");

try {
  await initPools();

  // Test chaque pool avec une requête simple
  const pools = {
    ktissoucy: "SELECT TOP 1 'ok' as test FROM dbo.NCONFORMITE",
    ktislaxou: "SELECT TOP 1 'ok' as test FROM dbo.NCONFORMITE",
    kmtm:      "SELECT TOP 1 'ok' as test FROM dbo.NCONFORMITE",
    auth:      "SELECT TOP 1 'ok' as test FROM dbo.users",
    nc_soucy:  "SELECT TOP 1 'ok' as test FROM dbo.fiches_evenements",
    nc_sens:   "SELECT TOP 1 'ok' as test FROM dbo.fiches_evenements",
    nc_laxou:  "SELECT TOP 1 'ok' as test FROM dbo.fiches_evenements",
    nc_kmtm:   "SELECT TOP 1 'ok' as test FROM dbo.fiches_evenements",
  };

  for (const [key, sql] of Object.entries(pools)) {
    try {
      const pool = getPool(key);
      await pool.request().query(sql);
      console.log(`✅ [${key}] OK`);
    } catch (err) {
      console.log(`❌ [${key}] ERREUR : ${err.message}`);
    }
  }

} catch (err) {
  console.error("Erreur init pools :", err.message);
} finally {
  await closePools();
  console.log("\n=== Test terminé ===\n");
}