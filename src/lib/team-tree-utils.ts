export type FlatTeam = {
  id: string;
  name: string;
  parent_id: string | null;
  city: string | null;
  country: string;
  leader_id?: string | null;
  leader?: { name: string } | null;
  memberCount?: number;
  created_at?: string;
};

export type TeamNode = FlatTeam & {
  children: TeamNode[];
  totalMembers: number;
};

export function buildTeamTree(teams: FlatTeam[]): TeamNode[] {
  const nodeMap = new Map<string, TeamNode>();

  // Initialisation des nœuds
  for (const team of teams) {
    nodeMap.set(team.id, {
      ...team,
      children: [],
      totalMembers: team.memberCount || 0,
    });
  }

  const roots: TeamNode[] = [];

  // Construction de l'arborescence
  for (const team of teams) {
    const node = nodeMap.get(team.id)!;
    if (team.parent_id && nodeMap.has(team.parent_id)) {
      const parent = nodeMap.get(team.parent_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Calcul récursif des membres totaux
  function computeTotalMembers(node: TeamNode): number {
    let sum = node.memberCount || 0;
    for (const child of node.children) {
      sum += computeTotalMembers(child);
    }
    node.totalMembers = sum;
    return sum;
  }

  for (const root of roots) {
    computeTotalMembers(root);
  }

  return roots;
}

export function getAllDescendantTeamIds(
  parentId: string,
  teams: FlatTeam[]
): string[] {
  const ids: string[] = [parentId];
  const children = teams.filter((t) => t.parent_id === parentId);

  for (const child of children) {
    ids.push(...getAllDescendantTeamIds(child.id, teams));
  }

  return ids;
}

export function formatTeamHierarchyLabel(
  teamId: string,
  teams: FlatTeam[]
): string {
  const team = teams.find((t) => t.id === teamId);
  if (!team) return "";

  if (team.parent_id) {
    const parent = teams.find((t) => t.id === team.parent_id);
    if (parent) {
      return `${parent.name} > ${team.name}`;
    }
  }

  return team.name;
}
