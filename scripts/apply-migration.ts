// scripts/apply-migration.ts
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

async function main() {
  const fileArg = process.argv[2] || "supabase/migrations/0003_phase2_productivity.sql";
  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`Fichier introuvable : ${filePath}`);
    process.exit(1);
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL est manquant dans l'environnement (.env.local)");
    process.exit(1);
  }

  console.log(`Application de la migration : ${path.basename(filePath)}...`);
  const sql = fs.readFileSync(filePath, "utf-8");

  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query("BEGIN;");
    await client.query(sql);
    await client.query("COMMIT;");
    console.log(` Migration ${path.basename(filePath)} appliquée avec succès !`);
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error(" Erreur lors de l'application de la migration :", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Erreur inattendue :", err);
  process.exit(1);
});
