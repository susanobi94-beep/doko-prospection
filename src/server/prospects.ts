import { createClient } from "@/lib/supabase/server";
import { buildProspectsFilter, sanitizeSearchTerm, type ProspectStatus } from "@/server/prospects-filter";

export type Prospect = {
  id: string;
  name: string;
  city: string;
  category: string;
  phone: string;
  whatsapp: string | null;
  status: ProspectStatus;
  created_at: string;
  assigned_to?: string | null;
  assigned_staff?: { name: string } | null;
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
    .select("id, name, city, category, phone, whatsapp, address, source, notes, status, created_at, assigned_to, assigned_staff:staff!prospects_assigned_to_fkey(name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    // Si la clé étrangère spécifique échoue lors de la transition, repli sur select sans relation
    const fallback = await supabase
      .from("prospects")
      .select("id, name, city, category, phone, whatsapp, address, source, notes, status, created_at, assigned_to")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (fallback.error || !fallback.data) return null;
    return fallback.data as ProspectDetail;
  }
  return data as unknown as ProspectDetail;
}

export type ListProspectsInput = {
  status?: string;
  city?: string;
  search?: string;
  assignedTo?: string;
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
    .select("id, name, city, category, phone, whatsapp, status, created_at, assigned_to", { count: "exact" })
    .is("deleted_at", null);

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.city) query = query.ilike("city", `%${sanitizeSearchTerm(filter.city)}%`);
  if (filter.assignedTo) {
    if (filter.assignedTo === "unassigned") {
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", filter.assignedTo);
    }
  }
  if (filter.search) {
    const term = sanitizeSearchTerm(filter.search);
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

export type DashboardStats = {
  totalProspects: number;
  newThisWeek: number;
  totalClients: number;
  byStatus: Record<ProspectStatus, number>;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("prospects")
    .select("status, created_at")
    .is("deleted_at", null);

  if (error || !rows) {
    return {
      totalProspects: 0,
      newThisWeek: 0,
      totalClients: 0,
      byStatus: {
        a_contacter: 0,
        contacte: 0,
        interesse: 0,
        client: 0,
        refuse: 0,
      },
    };
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const byStatus: Record<ProspectStatus, number> = {
    a_contacter: 0,
    contacte: 0,
    interesse: 0,
    client: 0,
    refuse: 0,
  };

  let newThisWeek = 0;
  for (const r of rows) {
    if (r.status in byStatus) {
      byStatus[r.status as ProspectStatus]++;
    }
    if (new Date(r.created_at) >= oneWeekAgo) {
      newThisWeek++;
    }
  }

  return {
    totalProspects: rows.length,
    newThisWeek,
    totalClients: byStatus.client,
    byStatus,
  };
}

export type ProspectComment = {
  id: string;
  prospect_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author?: { name: string } | null;
};

export async function listCommentsForProspect(prospectId: string): Promise<ProspectComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, prospect_id, author_id, body, created_at, author:staff(name)")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as ProspectComment[];
}
