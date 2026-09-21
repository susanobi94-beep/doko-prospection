// tsx --env-file=.env.local scripts/seed-staff.ts -- --email=... --name=... [--password=...]
// Crée (ou retrouve) le compte Supabase Auth du collaborateur, puis l'ajoute à `staff`.
// Sans --password, un mot de passe aléatoire est généré et affiché UNE seule fois.
// Idempotent : un compte existant est réutilisé ; son mot de passe n'est modifié que si
// --password est fourni.
import { randomBytes } from "node:crypto";
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
  const args = parseArgs(process.argv.slice(2));
  const email = args.email?.trim().toLowerCase();
  const { name } = args;
  if (!email || !name) {
    console.error("Usage: npm run db:seed -- --email=... --name=... [--password=...]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);

  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("Impossible de lister les comptes auth.users :", listError.message);
    process.exit(1);
  }

  let userId: string;
  let generatedPassword: string | null = null;
  const existing = usersPage.users.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    userId = existing.id;
    if (args.password) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: args.password });
      if (error) {
        console.error("Échec de la mise à jour du mot de passe :", error.message);
        process.exit(1);
      }
    }
  } else {
    const password = args.password || randomBytes(12).toString("base64url");
    if (!args.password) generatedPassword = password;

    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !created.user) {
      console.error("Échec de la création du compte :", error?.message);
      process.exit(1);
    }
    userId = created.user.id;
  }

  const { error: insertError } = await supabase
    .from("staff")
    .upsert({ id: userId, email, name, active: true }, { onConflict: "email", ignoreDuplicates: true });

  if (insertError) {
    console.error("Échec de l'insertion staff :", insertError.message);
    process.exit(1);
  }

  console.log(`staff prêt : ${email} (${name})`);
  if (generatedPassword) {
    console.log(`Mot de passe généré (à transmettre, non récupérable ensuite) : ${generatedPassword}`);
  }
}

main();
