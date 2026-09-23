"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAdmin, type StaffRole } from "@/server/staff";
import { StaffCreateSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/prospects-actions";

export type StaffFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  generatedPassword?: string;
} | null;

/**
 * Création d'un nouveau collaborateur (réservé aux administrateurs)
 */
export async function createStaffMember(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();

  const raw = {
    email: String(formData.get("email") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "commercial") as StaffRole,
    password: String(formData.get("password") ?? "").trim(),
  };

  const parsed = StaffCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Corrige les erreurs dans le formulaire.", fieldErrors };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      ok: false,
      error: "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY est requise pour ajouter des comptes.",
    };
  }

  const adminClient = createAdminClient(url, serviceRoleKey);

  // 1. Créer le compte dans auth.users
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    if (authError?.message?.includes("already been registered")) {
      return { ok: false, error: "Un utilisateur avec cet email existe déjà dans l'authentification." };
    }
    return { ok: false, error: `Erreur Auth: ${authError?.message ?? "inconnue"}` };
  }

  // 2. Insérer dans la table staff
  const { error: staffError } = await adminClient.from("staff").upsert({
    id: authUser.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    active: true,
  });

  if (staffError) {
    return { ok: false, error: `Erreur Staff DB: ${staffError.message}` };
  }

  revalidatePath("/settings/team");
  revalidatePath("/prospects");
  return { ok: true, generatedPassword: parsed.data.password };
}

/**
 * "Kill Switch" : Activer / Désactiver un collaborateur en temps réel
 */
export async function toggleStaffActive(staffId: string, currentActive: boolean): Promise<ActionResult<null>> {
  const currentAdmin = await requireAdmin();

  if (currentAdmin.id === staffId && currentActive) {
    return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte administrateur." };
  }

  const newStatus = !currentActive;
  const supabase = await createServerClient();

  // Essai via RPC
  const { error: rpcError } = await supabase.rpc("toggle_staff_active", {
    p_staff_id: staffId,
    p_active: newStatus,
  });

  if (rpcError) {
    // Si la RPC n'est pas trouvée, fallback avec service_role si disponible
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey) {
      const adminClient = createAdminClient(url, serviceRoleKey);
      const { error: directError } = await adminClient
        .from("staff")
        .update({ active: newStatus })
        .eq("id", staffId);

      if (directError) {
        return { ok: false, error: directError.message };
      }
    } else {
      return { ok: false, error: rpcError.message };
    }
  }

  revalidatePath("/settings/team");
  return { ok: true, data: null };
}

/**
 * Changer le rôle d'un collaborateur (admin, commercial, lecture)
 */
export async function changeStaffRole(staffId: string, newRole: StaffRole): Promise<ActionResult<null>> {
  const currentAdmin = await requireAdmin();

  if (currentAdmin.id === staffId && newRole !== "admin") {
    return { ok: false, error: "Vous ne pouvez pas retirer vos propres privilèges d'administrateur." };
  }

  const supabase = await createServerClient();

  const { error: rpcError } = await supabase.rpc("update_staff_role", {
    p_staff_id: staffId,
    p_role: newRole,
  });

  if (rpcError) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey) {
      const adminClient = createAdminClient(url, serviceRoleKey);
      const { error: directError } = await adminClient
        .from("staff")
        .update({ role: newRole })
        .eq("id", staffId);

      if (directError) {
        return { ok: false, error: directError.message };
      }
    } else {
      return { ok: false, error: rpcError.message };
    }
  }

  revalidatePath("/settings/team");
  return { ok: true, data: null };
}
