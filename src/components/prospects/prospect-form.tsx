"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProspectFormState } from "@/server/prospects-actions";
import type { Prospect } from "@/server/prospects";
import type { StaffMember } from "@/server/staff";

type Action = (state: ProspectFormState, formData: FormData) => Promise<ProspectFormState>;

export function ProspectForm({
  action,
  defaultValues,
  staffList,
}: {
  action: Action;
  defaultValues?: Partial<Prospect> & {
    whatsapp?: string | null;
    address?: string | null;
    source?: string | null;
    notes?: string | null;
    assigned_to?: string | null;
  };
  staffList?: StaffMember[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ProspectFormState, FormData>(action, null);

  useEffect(() => {
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-[720px] space-y-4">
      {state && !state.ok && state.error && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      <Field label="Nom de la boutique / entreprise" name="name" defaultValue={defaultValues?.name} error={fieldErrors.name} required />
      <Field label="Téléphone principal" name="phone" defaultValue={defaultValues?.phone} error={fieldErrors.phone} required />
      <Field label="Ville (ex: Douala, Yaoundé, Bafoussam...)" name="city" defaultValue={defaultValues?.city} error={fieldErrors.city} required />

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? ""}
          aria-describedby={fieldErrors.category ? "category-error" : undefined}
          className="mt-1 h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
          required
        >
          <option value="">Choisir…</option>
          <option value="boutique_telephone">Boutique téléphone & accessoires</option>
          <option value="pme">PME commerciale / Commerce de détail</option>
          <option value="diaspora">Boutique / Contact Diaspora</option>
        </select>
        {fieldErrors.category && (
          <p id="category-error" className="mt-1 text-xs text-[var(--destructive)]">
            {fieldErrors.category}
          </p>
        )}
      </div>

      {/* Attribution à un collaborateur */}
      {staffList && staffList.length > 0 && (
        <div>
          <Label htmlFor="assignedTo">Assigner à un commercial</Label>
          <select
            id="assignedTo"
            name="assignedTo"
            defaultValue={defaultValues?.assigned_to ?? ""}
            className="mt-1 h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
          >
            <option value="">Non assigné (ouvre pour toute l&apos;équipe)</option>
            {staffList
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
          </select>
        </div>
      )}

      <Field label="Numéro WhatsApp (si différent)" name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ""} />
      <Field label="Adresse physique / Quartier" name="address" defaultValue={defaultValues?.address ?? ""} />
      <Field label="Source d'acquisition (Facebook, Recommandation, Terrain...)" name="source" defaultValue={defaultValues?.source ?? ""} />

      <div>
        <Label htmlFor="notes">Notes & observations</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} className="mt-1" />
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
      >
        {pending ? "Enregistrement en cours…" : "Enregistrer la boutique"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        aria-describedby={error ? `${name}-error` : undefined}
        className="mt-1"
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
