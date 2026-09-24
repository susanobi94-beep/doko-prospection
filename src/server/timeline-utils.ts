import type { ActivityLogEntry, ProspectComment } from "@/server/prospects";
import type { RelanceItem } from "@/server/relances";
import type { ProspectStatus } from "@/server/prospects-filter";

export type TimelineEventType = "activity" | "comment" | "relance";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description?: string;
  authorName?: string;
  icon: string;
  badgeBg: string;
  badgeFg: string;
};

const STATUS_LABELS: Record<string, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

export function mergeTimelineEvents(
  activity: ActivityLogEntry[],
  comments: ProspectComment[],
  relances: RelanceItem[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Événements issus de l'activity_log
  for (const act of activity) {
    // Si l'activité est un "comment_added", on l'ignore car la table `comments` apporte déjà le détail complet
    if (act.action === "comment_added") continue;

    let title = "Activité enregistrée";
    let description = "";
    let icon = "📝";
    let badgeBg = "bg-gray-500/10";
    let badgeFg = "text-gray-700 dark:text-gray-300";

    if (act.action === "created") {
      title = "Boutique créée";
      icon = "✨";
      badgeBg = "bg-blue-500/10";
      badgeFg = "text-blue-700 dark:text-blue-300";
      if (act.after && typeof act.after === "object" && "source" in act.after) {
        description = `Source : ${act.after.source}`;
      }
    } else if (act.action === "status_changed") {
      title = "Changement de statut";
      icon = "🔄";
      badgeBg = "bg-amber-500/10";
      badgeFg = "text-amber-700 dark:text-amber-300";

      const beforeStatus = (act.before?.status as ProspectStatus) || "";
      const afterStatus = (act.after?.status as ProspectStatus) || "";
      const fromLabel = STATUS_LABELS[beforeStatus] || beforeStatus;
      const toLabel = STATUS_LABELS[afterStatus] || afterStatus;
      description = `${fromLabel} → ${toLabel}`;
    } else if (act.action === "updated") {
      title = "Fiche prospect modifiée";
      icon = "✏️";
      badgeBg = "bg-purple-500/10";
      badgeFg = "text-purple-700 dark:text-purple-300";
    }

    events.push({
      id: act.id,
      type: "activity",
      timestamp: act.created_at,
      title,
      description,
      authorName: act.actor?.name || "Système",
      icon,
      badgeBg,
      badgeFg,
    });
  }

  // 2. Événements issus des commentaires / notes datées
  for (const com of comments) {
    events.push({
      id: com.id,
      type: "comment",
      timestamp: com.created_at,
      title: "Note de suivi / Commentaire",
      description: com.body,
      authorName: com.author?.name || "Collaborateur",
      icon: "💬",
      badgeBg: "bg-indigo-500/10",
      badgeFg: "text-indigo-700 dark:text-indigo-300",
    });
  }

  // 3. Événements issus des relances
  for (const rel of relances) {
    const formattedDue = new Date(rel.due_date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    events.push({
      id: rel.id,
      type: "relance",
      timestamp: rel.created_at,
      title: rel.done ? "Relance traitée" : "Relance planifiée",
      description: rel.done
        ? `Relance pour le ${formattedDue} marquée comme traitée`
        : `Échéance fixée au ${formattedDue}`,
      authorName: rel.creator?.name || "Commercial",
      icon: rel.done ? "✅" : "⏰",
      badgeBg: rel.done ? "bg-emerald-500/10" : "bg-orange-500/10",
      badgeFg: rel.done ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300",
    });
  }

  // Tri chronologique décroissant (du plus récent au plus ancien)
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
