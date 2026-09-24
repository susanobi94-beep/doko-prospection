import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { evaluateStaffAccess, evaluateAdminAccess, evaluateEditorAccess } from "@/server/staff-access";

export type StaffRole = "admin" | "commercial" | "lecture";

export type ActiveStaff = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  active: boolean;
};

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
};

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
    .select("id, email, name, active, role")
    .eq("id", user.id)
    .single();

  if (!staffRow || !evaluateStaffAccess({ active: staffRow.active, role: staffRow.role })) {
    redirect("/access-denied");
  }

  return {
    id: staffRow.id,
    email: staffRow.email,
    name: staffRow.name,
    role: (staffRow.role ?? "commercial") as StaffRole,
    active: staffRow.active ?? true,
  };
}

/**
 * Vérifie que le membre connecté est administrateur.
 * Redirige vers /access-denied si ce n'est pas le cas.
 */
export async function requireAdmin(): Promise<ActiveStaff> {
  const staff = await requireActiveStaff();
  if (!evaluateAdminAccess(staff)) {
    redirect("/access-denied");
  }
  return staff;
}

/**
 * Vérifie que le membre connecté a les droits d'édition (admin ou commercial).
 * Redirige vers /access-denied si le compte est en lecture seule.
 */
export async function requireEditorStaff(): Promise<ActiveStaff> {
  const staff = await requireActiveStaff();
  if (!evaluateEditorAccess(staff)) {
    redirect("/access-denied");
  }
  return staff;
}

/**
 * Liste l'ensemble des membres du staff (pour sélecteurs d'attribution ou panneau admin)
 */
export async function listAllStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, email, name, role, active, created_at")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: (row.role ?? "commercial") as StaffRole,
    active: row.active ?? true,
    created_at: row.created_at,
  }));
}

export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
