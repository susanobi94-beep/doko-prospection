"use client";

import { useState, useTransition } from "react";
import { createTeamAction } from "@/server/team-hierarchy-actions";
import type { FlatTeam } from "@/lib/team-tree-utils";
import type { StaffMember } from "@/server/staff";

export function CreateTeamDialog({
  teams,
  staff,
  onCreated,
}: {
  teams: FlatTeam[];
  staff: StaffMember[];
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Cameroun");
  const [leaderId, setLeaderId] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filtre les équipes parentes candidates (généralement celles de niveau racine)
  const parentCandidates = teams.filter((t) => !t.parent_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de l'équipe est requis");
      return;
    }

    startTransition(async () => {
      const res = await createTeamAction({
        name: name.trim(),
        parentId: parentId ? parentId : null,
        city: city.trim() || (parentId ? teams.find((t) => t.id === parentId)?.city : null),
        country: country.trim() || "Cameroun",
        leaderId: leaderId ? leaderId : null,
      });

      if (!res.ok) {
        setError(res.error || "Une erreur est survenue");
        return;
      }

      setName("");
      setParentId("");
      setCity("");
      setLeaderId("");
      setOpen(false);
      onCreated?.();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
      >
        + Créer une équipe / sous-équipe
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--fg)]">
            Nouvelle Équipe ou Sous-Équipe
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[6px] bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block font-medium text-[var(--fg)]">
              Nom de l&apos;équipe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Douala - Akwa ou Yaoundé - Mokolo"
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--fg)]">
              Zone parente (optionnel)
            </label>
            <select
              value={parentId}
              onChange={(e) => {
                const pId = e.target.value;
                setParentId(pId);
                const parent = teams.find((t) => t.id === pId);
                if (parent) {
                  if (parent.city) setCity(parent.city);
                  if (parent.country) setCountry(parent.country);
                }
              }}
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--fg)]"
            >
              <option value="">Aucune (Zone principale / Métropole)</option>
              {parentCandidates.map((p) => (
                <option key={p.id} value={p.id}>
                  📍 {p.name} {p.city ? `(${p.city})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
              Rattachez cette équipe à une métropole (ex: Douala) pour créer une sous-équipe de secteur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-[var(--fg)]">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Douala, Yaoundé..."
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-[var(--fg)]">
                Pays
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--fg)]"
              >
                <option value="Cameroun">🇨🇲 Cameroun</option>
                <option value="Côte d'Ivoire">🇨🇮 Côte d&apos;Ivoire</option>
                <option value="Gabon">🇬🇦 Gabon</option>
                <option value="Sénégal">🇸🇳 Sénégal</option>
                <option value="Congo">🇨🇬 Congo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--fg)]">
              Chef d&apos;équipe (Leader)
            </label>
            <select
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--fg)]"
            >
              <option value="">Aucun chef assigné</option>
              {staff
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    👑 {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[6px] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {pending ? "Création en cours..." : "Créer l'équipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
