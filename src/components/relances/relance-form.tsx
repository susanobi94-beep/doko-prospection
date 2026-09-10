"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRelance, type RelanceFormState } from "@/server/relances-actions";

export function RelanceForm({ prospectId }: { prospectId: string }) {
  const action = createRelance.bind(null, prospectId);
  const [state, formAction, pending] = useActionState<RelanceFormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="dueDate">Date de relance</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          aria-describedby={state?.fieldErrors?.dueDate ? "dueDate-error" : undefined}
          className="mt-1"
        />
        {state?.fieldErrors?.dueDate && (
          <p id="dueDate-error" className="mt-1 text-xs text-[var(--destructive)]">
            {state.fieldErrors.dueDate}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-40">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" className="mt-1" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[6px] bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
      >
        {pending ? "Ajout…" : "Ajouter une relance"}
      </button>
      {state && !state.ok && state.error && !state.fieldErrors && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}
    </form>
  );
}
