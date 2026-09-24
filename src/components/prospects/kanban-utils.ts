import type { Prospect } from "@/server/prospects";
import type { ProspectStatus } from "@/server/prospects-filter";

export type KanbanColumnConfig = {
  status: ProspectStatus;
  title: string;
  badgeBg: string;
  badgeFg: string;
  dotColor: string;
};

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    status: "a_contacter",
    title: "À contacter",
    badgeBg: "bg-blue-500/10",
    badgeFg: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    status: "contacte",
    title: "Contacté",
    badgeBg: "bg-amber-500/10",
    badgeFg: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    status: "interesse",
    title: "Intéressé",
    badgeBg: "bg-purple-500/10",
    badgeFg: "text-purple-600 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    status: "client",
    title: "Client",
    badgeBg: "bg-emerald-500/10",
    badgeFg: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  {
    status: "refuse",
    title: "Refusé",
    badgeBg: "bg-rose-500/10",
    badgeFg: "text-rose-600 dark:text-rose-400",
    dotColor: "bg-rose-500",
  },
];

export function groupProspectsByStatus(
  rows: Prospect[]
): Record<ProspectStatus, Prospect[]> {
  const grouped: Record<ProspectStatus, Prospect[]> = {
    a_contacter: [],
    contacte: [],
    interesse: [],
    client: [],
    refuse: [],
  };

  for (const row of rows) {
    if (row.status in grouped) {
      grouped[row.status].push(row);
    }
  }

  return grouped;
}
