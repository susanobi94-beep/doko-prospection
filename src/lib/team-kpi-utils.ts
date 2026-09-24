import { getAllDescendantTeamIds, type FlatTeam } from "./team-tree-utils";

export type TeamKpiInput = {
  id: string;
  status: string;
  team_id?: string | null;
  assigned_to?: string | null;
};

export type StaffTeamMapping = {
  id: string;
  team_id?: string | null;
};

export type TeamKpiResult = {
  teamId: string;
  teamName: string;
  parentId: string | null;
  city: string | null;
  country: string;
  totalProspects: number;
  contacted: number;
  clients: number;
  conversionRate: number;
};

export function computeTeamKpis(
  teams: FlatTeam[],
  staff: StaffTeamMapping[],
  prospects: TeamKpiInput[]
): TeamKpiResult[] {
  const staffTeamMap = new Map<string, string>();
  for (const s of staff) {
    if (s.team_id) {
      staffTeamMap.set(s.id, s.team_id);
    }
  }

  // Associe chaque prospect à une équipe de base (soit prospect.team_id, soit staff.team_id)
  const resolvedProspects = prospects.map((p) => {
    let resolvedTeamId = p.team_id;
    if (!resolvedTeamId && p.assigned_to) {
      resolvedTeamId = staffTeamMap.get(p.assigned_to) || null;
    }
    return {
      ...p,
      resolvedTeamId,
    };
  });

  return teams.map((team) => {
    // Tous les IDs descendants (incluant l'équipe elle-même)
    const descendantIds = new Set(getAllDescendantTeamIds(team.id, teams));

    let totalProspects = 0;
    let contacted = 0;
    let clients = 0;

    for (const p of resolvedProspects) {
      if (p.resolvedTeamId && descendantIds.has(p.resolvedTeamId)) {
        totalProspects++;
        if (p.status !== "a_contacter") {
          contacted++;
        }
        if (p.status === "client") {
          clients++;
        }
      }
    }

    const conversionRate =
      totalProspects > 0 ? Math.round((clients / totalProspects) * 100) : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      parentId: team.parent_id,
      city: team.city,
      country: team.country,
      totalProspects,
      contacted,
      clients,
      conversionRate,
    };
  });
}
