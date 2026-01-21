import pg from "pg";
const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://fe:fe@127.0.0.1:5432/suivi_fe";

console.log("DATABASE_URL USED =", DATABASE_URL);

export const pool = new Pool({ connectionString: DATABASE_URL });
