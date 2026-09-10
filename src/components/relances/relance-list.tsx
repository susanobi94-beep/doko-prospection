"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { DueRelance } from "@/server/relances";
import { markRelanceDone } from "@/server/relances-actions";

export function RelanceList({ relances }: { relances: DueRelance[] }) {
  const [pending, startTransition] = useTransition();

  if (relances.length === 0) {
    return <p className="text-sm text-[var(--fg-muted)]">Aucune relance en retard ni due aujourd&apos;hui.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <ul className="space-y-2">
      {relances.map((r) => {
        const overdue = r.due_date < today;
        return (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div>
              <p className="text-sm font-medium text-[var(--fg)]">
                {r.prospect ? (
                  <Link href={`/prospects/${r.prospect.id}`} className="underline">
                    {r.prospect.name}
                  </Link>
                ) : (
                  "Prospect supprimé"
                )}{" "}
                {overdue && (
                  <span className="rounded-[9999px] bg-[var(--warn)] px-2 py-0.5 text-xs font-medium text-white">
                    En retard
                  </span>
                )}
              </p>
              <p className="text-xs text-[var(--fg-muted)]">
                {r.due_date}
                {r.prospect ? ` — ${r.prospect.phone}` : ""}
                {r.note ? ` — ${r.note}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markRelanceDone(r.id);
                })
              }
              className="rounded-[6px] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--fg)] hover:bg-[var(--background)] disabled:opacity-60"
            >
              Fait
            </button>
          </li>
        );
      })}
    </ul>
  );
}
