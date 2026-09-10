import { createClient } from "@/lib/supabase/server";
import { buildProspectsFilter, type ProspectStatus } from "@/server/prospects-filter";

export type Prospect = {
  id: string;
  name: string;
  city: string;
  category: string;
  phone: string;
  whatsapp: string | null;
  status: ProspectStatus;
  created_at: string;
};

export type ProspectDetail = Prospect & {
  address: string | null;
  source: string | null;
  notes: string | null;
};

export async function getProspect(id: string): Promise<ProspectDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, city, category, phone, whatsapp, address, source, notes, status, created_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data as ProspectDetail;
}

export type ListProspectsInput = {
  status?: string;
  city?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type ListProspectsResult = {
  rows: Prospect[];
  page: number;
  pageSize: number;
  total: number;
};

export async function listProspects(input: ListProspectsInput): Promise<ListProspectsResult> {
  const page = input.page && input.page > 0 ? input.page : 1;
  const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(input.pageSize, 100) : 25;
  const filter = buildProspectsFilter(input);

  const supabase = await createClient();
  let query = supabase
    .from("prospects")
    .select("id, name, city, category, phone, whatsapp, status, created_at", { count: "exact" })
    .is("deleted_at", null);

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.city) query = query.ilike("city", `%${filter.city}%`);
  if (filter.search) {
    // L'index GIN (§4) est une expression sur name || ' ' || phone, pas une colonne matérialisée
    // que le client JS peut cibler via .textSearch() — .or() sur les deux colonnes couvre le
    // même besoin (nom OU téléphone, insensible à la casse) sans colonne générée supplémentaire.
    const term = filter.search.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`listProspects: ${error.message}`);
  }

  return { rows: (data ?? []) as Prospect[], page, pageSize, total: count ?? 0 };
}

export type ActivityLogEntry = {
  id: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
  actor: { name: string } | null;
};

export async function listActivity(prospectId: string): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, before, after, created_at, actor:staff(name)")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`listActivity: ${error.message}`);
  }

  return (data ?? []) as unknown as ActivityLogEntry[];
}
