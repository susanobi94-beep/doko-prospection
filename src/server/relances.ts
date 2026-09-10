import { createClient } from "@/lib/supabase/server";

export type DueRelance = {
  id: string;
  due_date: string;
  note: string | null;
  prospect: { id: string; name: string; phone: string } | null;
};

// Dues aujourd'hui OU en retard : due_date <= aujourd'hui, done=false, toutes prospects confondues.
export async function listDueRelances(): Promise<DueRelance[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("relances")
    .select("id, due_date, note, prospect:prospects(id, name, phone)")
    .eq("done", false)
    .lte("due_date", today)
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`listDueRelances: ${error.message}`);
  }

  return (data ?? []) as unknown as DueRelance[];
}
