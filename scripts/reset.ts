import "dotenv/config";
import { Pool } from "pg";

// Sletter alt i den lokale udviklingsdatabase. Nægter at køre i produktion.
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("reset må ikke køre i produktion");
  const url = process.env.DATABASE_URL ?? "";
  if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("reset kører kun mod en lokal database");
  const pool = new Pool({ connectionString: url });
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await pool.end();
  console.log("Databasen er nulstillet.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
