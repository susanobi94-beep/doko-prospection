import type { TimelineEvent } from "@/server/timeline-utils";

export function UnifiedTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--fg-muted)]">
        Aucun historique pour ce prospect.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-[2px] before:bg-[var(--border)]">
      {events.map((evt) => {
        const formattedDate = new Date(evt.timestamp).toLocaleString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={evt.id} className="relative group">
            {/* Icône du nœud chronologique */}
            <span
              className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] shadow-xs ring-4 ring-[var(--bg)] ${evt.badgeBg}`}
            >
              {evt.icon}
            </span>

            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-xs font-semibold text-[var(--fg)]">
                  {evt.title}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {formattedDate}
                </span>
              </div>

              {evt.authorName && (
                <div className="mt-0.5 text-[11px] text-[var(--fg-muted)]">
                  Par <span className="font-medium text-[var(--fg)]">{evt.authorName}</span>
                </div>
              )}

              {evt.description && (
                <div className="mt-2 text-xs leading-relaxed text-[var(--fg)] whitespace-pre-wrap rounded-[4px] bg-[var(--surface-muted)]/50 p-2 border border-[var(--border)]/50">
                  {evt.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
