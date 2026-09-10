// tsx --env-file=.env.local scripts/seed-staff.ts -- --email=... --name=...
// Exécuté APRES la première connexion Google du collaborateur (auth.users.id réel requis).
// Idempotent : ON CONFLICT (email) DO NOTHING.
import { createClient } from "@supabase/supabase-js";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

async function main() {
  const { email, name } = parseArgs(process.argv.slice(2));
  if (!email || !name) {
    console.error("Usage: npm run db:seed -- --email=... --name=...");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);

  // auth.users.id réel : recherche par email parmi les comptes déjà créés par la première
  // connexion Google (Supabase Auth crée auth.users automatiquement à ce moment).
  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Impossible de lister les comptes auth.users :", listError.message);
    process.exit(1);
  }

  const authUser = usersPage.users.find((u) => u.email === email);
  if (!authUser) {
    console.error(
      `Aucun compte auth.users pour ${email} — le collaborateur doit se connecter au moins une fois via Google avant le seed.`
    );
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from("staff")
    .upsert({ id: authUser.id, email, name, active: true }, { onConflict: "email", ignoreDuplicates: true });

  if (insertError) {
    console.error("Échec de l'insertion staff :", insertError.message);
    process.exit(1);
  }

  console.log(`staff seedé : ${email} (${name})`);
}

main();
