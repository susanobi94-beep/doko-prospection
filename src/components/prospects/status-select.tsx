"use client";

import { useState, useTransition } from "react";
import { PROSPECT_STATUSES, type ProspectStatus } from "@/server/prospects-filter";
import { changeProspectStatus } from "@/server/prospects-actions";

const STATUS_LABELS: Record<ProspectStatus, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

export function StatusSelect({ prospectId, status }: { prospectId: string; status: ProspectStatus }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    const previous = current;
    setCurrent(next as ProspectStatus);
    setError(null);
    startTransition(async () => {
      const result = await changeProspectStatus(prospectId, next);
      if (!result.ok) {
        setCurrent(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] disabled:opacity-60"
      >
        {PROSPECT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
