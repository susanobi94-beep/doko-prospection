"use server";

// Connexion email + mot de passe, exécutée côté serveur : le navigateur ne contacte jamais
// Supabase directement (pas de clé anon ni de token exposés côté client, pas de contenu mixte).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginInputSchema } from "@/lib/validation";
import { evaluateStaffAccess } from "@/server/staff-access";

export type LoginState = { error: string } | null;

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginInputSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  // Message volontairement identique pour un email inconnu et un mauvais mot de passe.
  if (error || !data.user) {
    return { error: "Email ou mot de passe incorrect" };
  }

  const { data: staffRow } = await supabase.from("staff").select("active").eq("id", data.user.id).single();

  if (!evaluateStaffAccess(staffRow ? { active: staffRow.active } : null)) {
    await supabase.auth.signOut();
    redirect("/access-denied");
  }

  redirect("/prospects");
}
