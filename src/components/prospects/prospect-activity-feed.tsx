import type { ActivityLogEntry } from "@/server/prospects";

const ACTION_LABELS: Record<string, string> = {
  created: "a créé le prospect",
  status_changed: "a changé le statut",
  note_added: "a ajouté une note",
  soft_deleted: "a supprimé le prospect",
};

function formatChange(entry: ActivityLogEntry): string | null {
  if (entry.action === "status_changed" && entry.before && entry.after) {
    return `${entry.before.status} → ${entry.after.status}`;
  }
  return null;
}

export function ProspectActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--fg-muted)]">Aucune activité enregistrée pour ce prospect.</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="border-l-2 border-[var(--border)] pl-3 text-sm">
          <p className="text-[var(--fg)]">
            <span className="font-medium">{entry.actor?.name ?? "Système"}</span>{" "}
            {ACTION_LABELS[entry.action] ?? entry.action}
            {formatChange(entry) && <span className="text-[var(--fg-muted)]"> ({formatChange(entry)})</span>}
          </p>
          <p className="text-xs text-[var(--fg-muted)]">
            {new Date(entry.created_at).toLocaleString("fr-FR")}
          </p>
        </li>
      ))}
    </ul>
  );
}
