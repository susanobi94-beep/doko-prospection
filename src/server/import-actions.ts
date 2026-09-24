"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditorStaff } from "@/server/staff";
import type { ValidatedProspectRow } from "@/lib/csv-import-utils";

export async function checkExistingPhones(phones: string[]): Promise<string[]> {
  await requireEditorStaff();
  if (phones.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("phone")
    .in("phone", phones.slice(0, 1000))
    .is("deleted_at", null);

  if (error || !data) {
    return [];
  }

  return data.map((d) => d.phone);
}

export type ImportBatchResult = {
  ok: boolean;
  inserted: number;
  skippedDuplicates: number;
  error?: string;
};

export async function importProspectsBatchAction(
  rows: ValidatedProspectRow[]
): Promise<ImportBatchResult> {
  const staff = await requireEditorStaff();

  if (rows.length === 0) {
    return { ok: true, inserted: 0, skippedDuplicates: 0 };
  }

  if (rows.length > 500) {
    return {
      ok: false,
      inserted: 0,
      skippedDuplicates: 0,
      error: "La limite maximale d'import par lot est de 500 prospects à la fois",
    };
  }

  const supabase = await createClient();

  // 1. Détection des doublons déjà existants en base
  const allPhones = rows.map((r) => r.phone);
  const existingPhones = new Set(await checkExistingPhones(allPhones));

  const toInsert = rows.filter((r) => !existingPhones.has(r.phone));
  const skippedDuplicates = rows.length - toInsert.length;

  if (toInsert.length === 0) {
    return {
      ok: true,
      inserted: 0,
      skippedDuplicates,
    };
  }

  // 2. Préparation des enregistrements
  const records = toInsert.map((r) => ({
    name: r.name,
    phone: r.phone,
    city: r.city || "Non renseignée",
    category: r.category || "boutique_telephone",
    whatsapp: r.whatsapp || null,
    address: r.address || null,
    source: r.source || "Import CSV",
    notes: r.notes || null,
    status: "a_contacter",
    created_by: staff.id,
  }));

  const { data: insertedData, error: insertError } = await supabase
    .from("prospects")
    .insert(records)
    .select("id, name");

  if (insertError) {
    return {
      ok: false,
      inserted: 0,
      skippedDuplicates,
      error: `Erreur lors de l'insertion en base : ${insertError.message}`,
    };
  }

  const insertedRows = insertedData ?? [];

  // 3. Traçabilité dans activity_log
  if (insertedRows.length > 0) {
    const activityEntries = insertedRows.map((p) => ({
      prospect_id: p.id,
      actor_id: staff.id,
      action: "created",
      after: { source: "Import CSV", name: p.name },
    }));

    await supabase.from("activity_log").insert(activityEntries);
  }

  revalidatePath("/prospects");
  return {
    ok: true,
    inserted: insertedRows.length,
    skippedDuplicates,
  };
}
