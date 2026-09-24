"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireEditorStaff } from "@/server/staff";

export type Tag = {
  id: string;
  label: string;
  color: string;
  created_at?: string;
};

export const CreateTagSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "L'étiquette doit faire au moins 2 caractères")
    .max(50, "50 caractères maximum"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format de couleur invalide (ex: #3B82F6)")
    .default("#6B7280"),
});

export async function listAllTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, color, created_at")
    .order("label", { ascending: true });

  if (error) {
    return [];
  }
  return data ?? [];
}

export async function createTagAction(
  label: string,
  color = "#6B7280"
): Promise<{ ok: boolean; tag?: Tag; error?: string }> {
  await requireEditorStaff();

  const parsed = CreateTagSchema.safeParse({ label, color });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ label: parsed.data.label, color: parsed.data.color })
    .select("id, label, color")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Une étiquette avec ce libellé existe déjà" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/prospects");
  return { ok: true, tag: data as Tag };
}

export async function attachTagAction(
  prospectId: string,
  tagId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireEditorStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("prospect_tags")
    .upsert(
      { prospect_id: prospectId, tag_id: tagId },
      { onConflict: "prospect_id,tag_id", ignoreDuplicates: true }
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  return { ok: true };
}

export async function detachTagAction(
  prospectId: string,
  tagId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireEditorStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("prospect_tags")
    .delete()
    .eq("prospect_id", prospectId)
    .eq("tag_id", tagId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  return { ok: true };
}
