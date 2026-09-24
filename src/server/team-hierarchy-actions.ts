"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireActiveStaff } from "@/server/staff";
import type { FlatTeam } from "@/lib/team-tree-utils";

const TeamInputSchema = z.object({
  name: z.string().trim().min(2, "Le nom de l'équipe doit faire au moins 2 caractères"),
  parentId: z.string().uuid().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  country: z.string().trim().default("Cameroun"),
  leaderId: z.string().uuid().optional().nullable(),
});

export async function listAllTeamsWithStats(): Promise<FlatTeam[]> {
  await requireActiveStaff();
  const supabase = await createClient();

  const [teamsRes, staffRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, parent_id, city, country, leader_id, created_at, leader:staff!teams_leader_id_fkey(name)")
      .order("name", { ascending: true }),
    supabase
      .from("staff")
      .select("team_id")
      .not("team_id", "is", null)
      .eq("active", true),
  ]);

  if (teamsRes.error || !teamsRes.data) {
    return [];
  }

  // Calcul du nombre de membres actifs par équipe
  const memberCountByTeam: Record<string, number> = {};
  if (staffRes.data) {
    for (const s of staffRes.data) {
      if (s.team_id) {
        memberCountByTeam[s.team_id] = (memberCountByTeam[s.team_id] || 0) + 1;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teamsRes.data.map((t: any) => ({
    id: t.id,
    name: t.name,
    parent_id: t.parent_id,
    city: t.city,
    country: t.country || "Cameroun",
    leader_id: t.leader_id,
    leader: t.leader,
    memberCount: memberCountByTeam[t.id] || 0,
    created_at: t.created_at,
  }));
}

export async function createTeamAction(input: {
  name: string;
  parentId?: string | null;
  city?: string | null;
  country?: string;
  leaderId?: string | null;
}): Promise<{ ok: boolean; teamId?: string; error?: string }> {
  await requireAdmin();

  const parsed = TeamInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: parsed.data.name,
      parent_id: parsed.data.parentId || null,
      city: parsed.data.city || null,
      country: parsed.data.country || "Cameroun",
      leader_id: parsed.data.leaderId || null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: `Erreur lors de la création : ${error.message}` };
  }

  revalidatePath("/settings/teams");
  revalidatePath("/prospects");
  return { ok: true, teamId: data.id };
}

export async function updateTeamAction(
  id: string,
  input: {
    name: string;
    parentId?: string | null;
    city?: string | null;
    country?: string;
    leaderId?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const parsed = TeamInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name: parsed.data.name,
      parent_id: parsed.data.parentId || null,
      city: parsed.data.city || null,
      country: parsed.data.country || "Cameroun",
      leader_id: parsed.data.leaderId || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/teams");
  revalidatePath("/prospects");
  return { ok: true };
}

export async function deleteTeamAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/teams");
  revalidatePath("/prospects");
  return { ok: true };
}

export async function assignStaffToTeamAction(
  staffId: string,
  teamId: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({ team_id: teamId })
    .eq("id", staffId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/teams");
  revalidatePath("/settings/team");
  revalidatePath("/prospects");
  return { ok: true };
}

export async function getTeamKpiStats() {
  await requireActiveStaff();
  const supabase = await createClient();

  const [teamsRes, staffRes, prospectsRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, parent_id, city, country, leader_id, created_at, leader:staff!teams_leader_id_fkey(name)")
      .order("name", { ascending: true }),
    supabase
      .from("staff")
      .select("id, team_id")
      .eq("active", true),
    supabase
      .from("prospects")
      .select("id, status, team_id, assigned_to")
      .is("deleted_at", null),
  ]);

  if (teamsRes.error || !teamsRes.data) {
    return [];
  }

  const { computeTeamKpis } = await import("@/lib/team-kpi-utils");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return computeTeamKpis(
    teamsRes.data as any,
    (staffRes.data ?? []) as any,
    (prospectsRes.data ?? []) as any
  );
}
