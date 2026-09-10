import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { evaluateStaffAccess } from "@/server/staff-access";

export type ActiveStaff = { id: string; email: string; name: string };

/**
 * Seul point d'entrée d'autorisation pour le groupe (dashboard) et /api/export.
 * Redirige vers /login si aucune session, vers /access-denied si le compte n'est
 * pas un staff actif. Ne retourne jamais sans un staff actif valide.
 */
export async function requireActiveStaff(): Promise<ActiveStaff> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, email, name, active")
    .eq("id", user.id)
    .single();

  if (!evaluateStaffAccess(staffRow ? { active: staffRow.active } : null)) {
    redirect("/access-denied");
  }

  return staffRow as ActiveStaff;
}
