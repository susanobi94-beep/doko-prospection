"use server";

// Module entier marqué "use server" — importé directement par des Client Components
// (delete-prospect-dialog.tsx), ce qui exige que CHAQUE export soit une fonction async
// (les types passent par `import type`, effacés à la compilation, donc sans effet ici).
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ProspectInputSchema, ProspectStatusSchema, type ProspectInput } from "@/lib/validation";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ProspectFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
} | null;

function formDataToProspectInput(formData: FormData): ProspectInput {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    category: String(formData.get("category") ?? "") as ProspectInput["category"],
    whatsapp: String(formData.get("whatsapp") ?? ""),
    address: String(formData.get("address") ?? ""),
    source: String(formData.get("source") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createProspect(
  _prevState: ProspectFormState,
  formData: FormData
): Promise<ProspectFormState> {
  const parsed = ProspectInputSchema.safeParse(formDataToProspectInput(formData));
  if (!parsed.success) {
    return { ok: false, error: "Corrige les champs en erreur.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_prospect_with_log", {
    p_name: parsed.data.name,
    p_city: parsed.data.city,
    p_category: parsed.data.category,
    p_phone: parsed.data.phone,
    p_whatsapp: parsed.data.whatsapp || null,
    p_address: parsed.data.address || null,
    p_source: parsed.data.source || null,
    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/prospects");
  return { ok: true, redirectTo: `/prospects/${data as string}` };
}

export async function updateProspect(
  id: string,
  _prevState: ProspectFormState,
  formData: FormData
): Promise<ProspectFormState> {
  const parsed = ProspectInputSchema.safeParse(formDataToProspectInput(formData));
  if (!parsed.success) {
    return { ok: false, error: "Corrige les champs en erreur.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prospects")
    .update({
      name: parsed.data.name,
      city: parsed.data.city,
      category: parsed.data.category,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp || null,
      address: parsed.data.address || null,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
  return { ok: true, redirectTo: `/prospects/${id}` };
}

export async function softDeleteProspect(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_prospect", { p_prospect_id: id });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/prospects");
  return { ok: true, data: null };
}

export async function changeProspectStatus(prospectId: string, newStatus: string): Promise<ActionResult<null>> {
  const parsed = ProspectStatusSchema.safeParse(newStatus);
  if (!parsed.success) {
    return { ok: false, error: "Statut invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("change_prospect_status", {
    p_prospect_id: prospectId,
    p_new_status: parsed.data,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true, data: null };
}
