"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RelanceInputSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/prospects-actions";

export type RelanceFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createRelance(
  prospectId: string,
  _prevState: RelanceFormState,
  formData: FormData
): Promise<RelanceFormState> {
  const parsed = RelanceInputSchema.safeParse({
    prospectId,
    dueDate: String(formData.get("dueDate") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Corrige les champs en erreur.", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("relances").insert({
    prospect_id: parsed.data.prospectId,
    due_date: parsed.data.dueDate,
    note: parsed.data.note || null,
    created_by: user?.id ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/relances");
  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true };
}

export async function markRelanceDone(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("relances").update({ done: true }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/relances");
  revalidatePath("/prospects");
  return { ok: true, data: null };
}

export async function toggleRelanceDone(id: string, done: boolean): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("relances").update({ done }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/relances");
  revalidatePath("/prospects");
  return { ok: true, data: null };
}
