import { describe, it, expect } from "vitest";
import {
  buildTeamTree,
  getAllDescendantTeamIds,
  formatTeamHierarchyLabel,
  type FlatTeam,
} from "@/lib/team-tree-utils";

describe("Team Hierarchy Utilities", () => {
  const mockTeams: FlatTeam[] = [
    {
      id: "douala-root",
      name: "Douala (Zone Littoral)",
      parent_id: null,
      city: "Douala",
      country: "Cameroun",
      memberCount: 1,
    },
    {
      id: "douala-akwa",
      name: "Douala - Akwa",
      parent_id: "douala-root",
      city: "Douala",
      country: "Cameroun",
      memberCount: 3,
    },
    {
      id: "douala-bonaberi",
      name: "Douala - Bonabéri",
      parent_id: "douala-root",
      city: "Douala",
      country: "Cameroun",
      memberCount: 2,
    },
    {
      id: "yaounde-root",
      name: "Yaoundé (Zone Centre)",
      parent_id: null,
      city: "Yaoundé",
      country: "Cameroun",
      memberCount: 1,
    },
    {
      id: "yaounde-mokolo",
      name: "Yaoundé - Mokolo",
      parent_id: "yaounde-root",
      city: "Yaoundé",
      country: "Cameroun",
      memberCount: 2,
    },
    {
      id: "bafoussam-root",
      name: "Bafoussam (Zone Ouest)",
      parent_id: null,
      city: "Bafoussam",
      country: "Cameroun",
      memberCount: 1,
    },
  ];

  it("builds a hierarchical tree from a flat list of teams", () => {
    const tree = buildTeamTree(mockTeams);

    expect(tree).toHaveLength(3); // Douala, Yaoundé, Bafoussam
    const doualaNode = tree.find((t) => t.id === "douala-root");
    expect(doualaNode).toBeDefined();
    expect(doualaNode?.children).toHaveLength(2);
    expect(doualaNode?.children.map((c) => c.name)).toEqual(["Douala - Akwa", "Douala - Bonabéri"]);
    expect(doualaNode?.totalMembers).toBe(6); // 1 root + 3 Akwa + 2 Bonaberi
  });

  it("recursively collects all descendant team IDs including the parent", () => {
    const doualaDescendants = getAllDescendantTeamIds("douala-root", mockTeams);
    expect(doualaDescendants).toEqual(["douala-root", "douala-akwa", "douala-bonaberi"]);

    const akwaDescendants = getAllDescendantTeamIds("douala-akwa", mockTeams);
    expect(akwaDescendants).toEqual(["douala-akwa"]);
  });

  it("formats team breadcrumb label correctly", () => {
    expect(formatTeamHierarchyLabel("douala-akwa", mockTeams)).toBe("Douala (Zone Littoral) > Douala - Akwa");
    expect(formatTeamHierarchyLabel("douala-root", mockTeams)).toBe("Douala (Zone Littoral)");
  });
});
