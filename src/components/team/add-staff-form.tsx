"use client";

import { useActionState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffMember, type StaffFormState } from "@/server/team-actions";

export function AddStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(createStaffMember, null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-[var(--fg)]">Ajouter un nouveau collaborateur</h2>
      <p className="mb-4 text-xs text-[var(--fg-muted)]">
        Crée immédiatement son compte d&apos;authentification et lui autorise l&apos;accès à Doko Prospection.
      </p>

      {state && !state.ok && state.error && (
        <div className="mb-4 rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      {state?.ok && (
        <div className="mb-4 rounded-[6px] border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ Collaborateur ajouté avec succès !
          {state.generatedPassword && (
            <p className="mt-1 font-mono text-xs">
              Mot de passe attribué : <strong>{state.generatedPassword}</strong> (Transmettez-le au collaborateur)
            </p>
          )}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="staff-name">Nom complet</Label>
            <Input id="staff-name" name="name" placeholder="Ex: Jean Dupont" required className="mt-1" />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="staff-email">Adresse Email</Label>
            <Input id="staff-email" name="email" type="email" placeholder="commercial@doko.cm" required className="mt-1" />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="staff-role">Rôle et permissions</Label>
            <select
              id="staff-role"
              name="role"
              defaultValue="commercial"
              className="mt-1 h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
            >
              <option value="commercial">Commercial (peut créer/modifier ses prospects et relances)</option>
              <option value="admin">Administrateur (contrôle total + gestion équipe + export)</option>
              <option value="lecture">Lecture seule (consultation uniquement)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="staff-password">Mot de passe temporaire</Label>
            <Input id="staff-password" name="password" type="text" placeholder="Minimum 6 caractères" required className="mt-1" />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-colors"
        >
          {pending ? "Création du compte…" : "+ Créer le compte"}
        </button>
      </form>
    </div>
  );
}
