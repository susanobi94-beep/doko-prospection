import { createClient } from "@/lib/supabase/server";

export type RelanceItem = {
  id: string;
  due_date: string;
  note: string | null;
  done: boolean;
  created_at: string;
  prospect: { id: string; name: string; phone: string } | null;
  creator?: { name: string } | null;
};

export type DueRelance = RelanceItem;

export type RelanceFilterTab = "due" | "upcoming" | "done" | "all";

// Liste selon filtre d'onglet
export async function listRelances(tab: RelanceFilterTab = "due"): Promise<RelanceItem[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("relances")
    .select("id, due_date, note, done, created_at, prospect:prospects(id, name, phone)")
    .order("due_date", { ascending: true });

  if (tab === "due") {
    query = query.eq("done", false).lte("due_date", today);
  } else if (tab === "upcoming") {
    query = query.eq("done", false).gt("due_date", today);
  } else if (tab === "done") {
    query = query.eq("done", true).order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`listRelances: ${error.message}`);
  }

  return (data ?? []) as unknown as RelanceItem[];
}

// Rétrocompatibilité : Dues aujourd'hui OU en retard
export async function listDueRelances(): Promise<DueRelance[]> {
  return listRelances("due");
}

// Toutes les relances d'un prospect donné (pour affichage dans sa fiche)
export async function listRelancesForProspect(prospectId: string): Promise<RelanceItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("relances")
    .select("id, due_date, note, done, created_at, prospect:prospects(id, name, phone)")
    .eq("prospect_id", prospectId)
    .order("due_date", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as RelanceItem[];
}

// Compte les relances en retard pour le dashboard et les badges
export async function countOverdueRelances(): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("relances")
    .select("id", { count: "exact", head: true })
    .eq("done", false)
    .lt("due_date", today);

  if (error || count === null) return 0;
  return count;
}
