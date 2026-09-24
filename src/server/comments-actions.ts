"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireEditorStaff, requireActiveStaff } from "@/server/staff";

const CommentInputSchema = z.object({
  prospectId: z.string().uuid("ID prospect invalide"),
  body: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(2000, "Le commentaire ne peut pas dépasser 2000 caractères"),
});

export type AddCommentState = {
  ok: boolean;
  error?: string;
};

export async function addCommentAction(
  prospectId: string,
  body: string
): Promise<AddCommentState> {
  const staff = await requireEditorStaff();

  const parsed = CommentInputSchema.safeParse({ prospectId, body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("comments").insert({
    prospect_id: parsed.data.prospectId,
    author_id: staff.id,
    body: parsed.data.body,
  });

  if (insertError) {
    return { ok: false, error: `Erreur lors de l'enregistrement : ${insertError.message}` };
  }

  // Traçabilité dans activity_log
  await supabase.from("activity_log").insert({
    prospect_id: parsed.data.prospectId,
    actor_id: staff.id,
    action: "comment_added",
    after: {
      preview: parsed.data.body.length > 80 ? `${parsed.data.body.slice(0, 80)}...` : parsed.data.body,
    },
  });

  revalidatePath(`/prospects/${parsed.data.prospectId}`);
  return { ok: true };
}

export async function deleteCommentAction(
  commentId: string,
  prospectId: string
): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireActiveStaff();
  const supabase = await createClient();

  // Vérification de la propriété du commentaire
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("id, author_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return { ok: false, error: "Commentaire introuvable" };
  }

  if (staff.role !== "admin" && comment.author_id !== staff.id) {
    return { ok: false, error: "Vous n'avez pas l'autorisation de supprimer ce commentaire" };
  }

  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true };
}
