// tsx --env-file=.env.local scripts/test-rls.ts
// Vérifie que les policies RLS bloquent bien un compte authentifié absent de `staff` :
// crée un utilisateur Supabase Auth temporaire, NE l'ajoute PAS à `staff`, se connecte avec ce
// compte, vérifie qu'un SELECT renvoie 0 ligne et qu'un INSERT échoue, puis supprime le compte
// de test dans un `finally` — jamais de compte orphelin en sortie, succès ou échec.
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont requis.");
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey);
  const testEmail = `rls-test-${Date.now()}@doko-prospection.invalid`;
  const testPassword = `Test-${Math.random().toString(36).slice(2)}!A1`;

  let userId: string | null = null;
  let failed = false;

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (createError || !created.user) {
      throw new Error(`création de l'utilisateur de test échouée : ${createError?.message}`);
    }
    userId = created.user.id;

    // Volontairement PAS de ligne `staff` pour cet utilisateur — c'est le cas qu'on teste.

    const anon = createClient(url, anonKey);
    const { error: signInError } = await anon.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInError) {
      throw new Error(`connexion de l'utilisateur de test échouée : ${signInError.message}`);
    }

    const { data: selectRows, error: selectError } = await anon.from("prospects").select("*");
    if (selectError) {
      throw new Error(`SELECT a levé une erreur au lieu de renvoyer 0 ligne : ${selectError.message}`);
    }
    if ((selectRows?.length ?? 0) !== 0) {
      console.error(`FUITE RLS : SELECT a renvoyé ${selectRows?.length} ligne(s) pour un compte non-staff.`);
      failed = true;
    } else {
      console.log("OK — SELECT renvoie 0 ligne pour un compte non-staff.");
    }

    const { error: insertError } = await anon.from("prospects").insert({
      name: "test",
      city: "test",
      category: "pme",
      phone: "0000000000",
    });
    if (!insertError) {
      console.error("FUITE RLS : INSERT a réussi pour un compte non-staff.");
      failed = true;
    } else {
      console.log("OK — INSERT est rejeté pour un compte non-staff.");
    }
  } finally {
    if (userId) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error(`Échec de la suppression de l'utilisateur de test (${userId}) :`, deleteError.message);
        failed = true;
      } else {
        console.log("Utilisateur de test supprimé, aucun compte orphelin.");
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
