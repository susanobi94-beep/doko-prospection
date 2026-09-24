import { describe, it, expect } from "vitest";
import { computeTeamKpis, type TeamKpiInput } from "../src/lib/team-kpi-utils";
import type { FlatTeam } from "../src/lib/team-tree-utils";

describe("computeTeamKpis", () => {
  const mockTeams: FlatTeam[] = [
    {
      id: "team-douala",
      name: "Douala (Zone Littoral)",
      parent_id: null,
      city: "Douala",
      country: "Cameroun",
    },
    {
      id: "team-akwa",
      name: "Douala - Akwa",
      parent_id: "team-douala",
      city: "Douala",
      country: "Cameroun",
    },
    {
      id: "team-bonaberi",
      name: "Douala - Bonabéri",
      parent_id: "team-douala",
      city: "Douala",
      country: "Cameroun",
    },
    {
      id: "team-yaounde",
      name: "Yaoundé (Zone Centre)",
      parent_id: null,
      city: "Yaoundé",
      country: "Cameroun",
    },
  ];

  it("calculates conversion rate and prospects for sub-teams and parent zones", () => {
    const mockStaff = [
      { id: "staff-1", team_id: "team-akwa" },
      { id: "staff-2", team_id: "team-bonaberi" },
      { id: "staff-3", team_id: "team-yaounde" },
    ];

    const mockProspects: TeamKpiInput[] = [
      // 2 prospects in Akwa (1 client)
      { id: "p1", status: "client", team_id: "team-akwa", assigned_to: "staff-1" },
      { id: "p2", status: "contacte", team_id: "team-akwa", assigned_to: "staff-1" },

      // 3 prospects in Bonabéri via staff-2 (1 client)
      { id: "p3", status: "client", team_id: null, assigned_to: "staff-2" },
      { id: "p4", status: "a_contacter", team_id: null, assigned_to: "staff-2" },
      { id: "p5", status: "refuse", team_id: null, assigned_to: "staff-2" },

      // 1 prospect in Yaoundé
      { id: "p6", status: "client", team_id: "team-yaounde", assigned_to: "staff-3" },
    ];

    const kpis = computeTeamKpis(mockTeams, mockStaff, mockProspects);

    const akwaKpi = kpis.find((k) => k.teamId === "team-akwa");
    expect(akwaKpi).toBeDefined();
    expect(akwaKpi?.totalProspects).toBe(2);
    expect(akwaKpi?.clients).toBe(1);
    expect(akwaKpi?.conversionRate).toBe(50); // 1 / 2 = 50%

    const bonaberiKpi = kpis.find((k) => k.teamId === "team-bonaberi");
    expect(bonaberiKpi).toBeDefined();
    expect(bonaberiKpi?.totalProspects).toBe(3);
    expect(bonaberiKpi?.clients).toBe(1);
    expect(bonaberiKpi?.conversionRate).toBe(33); // 1 / 3 = 33%

    // Parent zone Douala aggregates both Akwa (2) + Bonabéri (3) = 5
    const doualaKpi = kpis.find((k) => k.teamId === "team-douala");
    expect(doualaKpi).toBeDefined();
    expect(doualaKpi?.totalProspects).toBe(5);
    expect(doualaKpi?.clients).toBe(2);
    expect(doualaKpi?.conversionRate).toBe(40); // 2 / 5 = 40%
  });

  it("handles teams with 0 prospects safely without NaN", () => {
    const kpis = computeTeamKpis(mockTeams, [], []);
    const akwaKpi = kpis.find((k) => k.teamId === "team-akwa");
    expect(akwaKpi?.totalProspects).toBe(0);
    expect(akwaKpi?.clients).toBe(0);
    expect(akwaKpi?.conversionRate).toBe(0);
  });
});
