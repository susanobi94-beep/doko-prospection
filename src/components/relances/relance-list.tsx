"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { RelanceItem } from "@/server/relances";
import { toggleRelanceDone } from "@/server/relances-actions";

export function RelanceList({ relances, emptyMessage }: { relances: RelanceItem[]; emptyMessage?: string }) {
  const [pending, startTransition] = useTransition();

  if (relances.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[var(--border)] p-8 text-center">
        <p className="text-sm text-[var(--fg-muted)]">
          {emptyMessage || "Aucune relance dans cette catégorie."}
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <ul className="space-y-2">
      {relances.map((r) => {
        const isDone = r.done;
        const overdue = !isDone && r.due_date < today;
        const isToday = !isDone && r.due_date === today;

        return (
          <li
            key={r.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] p-4 transition-colors ${
              isDone
                ? "bg-[var(--surface-muted)] opacity-70"
                : overdue
                ? "border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20"
                : "bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {r.prospect ? (
                  <Link
                    href={`/prospects/${r.prospect.id}`}
                    className="font-medium text-[var(--fg)] hover:underline"
                  >
                    {r.prospect.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--fg-muted)]">Boutique archivée</span>
                )}

                {overdue && (
                  <span className="rounded-[9999px] bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                    En retard
                  </span>
                )}
                {isToday && (
                  <span className="rounded-[9999px] bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Aujourd&apos;hui
                  </span>
                )}
                {isDone && (
                  <span className="rounded-[9999px] bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                    Terminée
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--fg-muted)]">
                📅 Échéance : <span className="font-medium text-[var(--fg)]">{r.due_date}</span>
                {r.prospect?.phone && (
                  <>
                    {" • "}
                    <a href={`tel:${r.prospect.phone}`} className="hover:underline">
                      📞 {r.prospect.phone}
                    </a>
                  </>
                )}
                {r.note && (
                  <>
                    {" • "}
                    <span className="italic">&ldquo;{r.note}&rdquo;</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleRelanceDone(r.id, !r.done);
                  })
                }
                className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                  isDone
                    ? "border border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--background)]"
                    : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"
                }`}
              >
                {isDone ? "Marquer à refaire" : "✓ Marquer fait"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
