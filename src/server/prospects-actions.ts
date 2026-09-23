"use server";

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
  const assignedToRaw = formData.get("assignedTo");
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    category: String(formData.get("category") ?? "") as ProspectInput["category"],
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    source: String(formData.get("source") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    assignedTo: assignedToRaw ? String(assignedToRaw).trim() : undefined,
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

function handleDuplicatePhoneError(errorMsg: string): string {
  if (errorMsg.includes("prospects_phone_unique") || errorMsg.includes("duplicate key")) {
    return "Ce numéro de téléphone est déjà enregistré pour une autre boutique.";
  }
  return errorMsg;
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

  // Appel avec assigned_to si disponible
  const rpcParams: Record<string, unknown> = {
    p_name: parsed.data.name,
    p_city: parsed.data.city,
    p_category: parsed.data.category,
    p_phone: parsed.data.phone,
    p_whatsapp: parsed.data.whatsapp || null,
    p_address: parsed.data.address || null,
    p_source: parsed.data.source || null,
    p_notes: parsed.data.notes || null,
    p_assigned_to: parsed.data.assignedTo || null,
  };

  const { data, error } = await supabase.rpc("create_prospect_with_log", rpcParams);

  if (error) {
    // Si la signature 9-params n'est pas encore en place, repli sur 8 params
    if (error.message.includes("function create_prospect_with_log") && error.message.includes("does not exist")) {
      delete rpcParams.p_assigned_to;
      const fallback = await supabase.rpc("create_prospect_with_log", rpcParams);
      if (fallback.error) {
        return { ok: false, error: handleDuplicatePhoneError(fallback.error.message) };
      }
      revalidatePath("/prospects");
      return { ok: true, redirectTo: `/prospects/${fallback.data as string}` };
    }
    return { ok: false, error: handleDuplicatePhoneError(error.message) };
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

  // Tentative avec RPC pour tracer dans activity_log
  const { error: rpcError } = await supabase.rpc("update_prospect_with_log", {
    p_id: id,
    p_name: parsed.data.name,
    p_city: parsed.data.city,
    p_category: parsed.data.category,
    p_phone: parsed.data.phone,
    p_whatsapp: parsed.data.whatsapp || null,
    p_address: parsed.data.address || null,
    p_source: parsed.data.source || null,
    p_notes: parsed.data.notes || null,
    p_assigned_to: parsed.data.assignedTo || null,
  });

  if (rpcError) {
    // Si la RPC n'est pas encore déployée, repli direct sur update
    if (rpcError.message.includes("function update_prospect_with_log") && rpcError.message.includes("does not exist")) {
      const { error: updateError } = await supabase
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
          assigned_to: parsed.data.assignedTo || null,
        })
        .eq("id", id);

      if (updateError) {
        return { ok: false, error: handleDuplicatePhoneError(updateError.message) };
      }
    } else {
      return { ok: false, error: handleDuplicatePhoneError(rpcError.message) };
    }
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
