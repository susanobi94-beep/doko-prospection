"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PROSPECT_STATUSES } from "@/server/prospects-filter";
import type { StaffMember } from "@/server/staff";
import type { Tag } from "@/server/tags-actions";

const STATUS_LABELS: Record<string, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

export function ProspectsFilterBar({
  staffList,
  currentUserId,
  tagsList,
}: {
  staffList?: StaffMember[];
  currentUserId?: string;
  tagsList?: Tag[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const currentStatus = searchParams.get("status") ?? "";
  const currentCity = searchParams.get("city") ?? "";
  const currentAssignedTo = searchParams.get("assignedTo") ?? "";
  const currentTagId = searchParams.get("tagId") ?? "";
  const hasActiveFilters = Boolean(
    currentStatus || currentCity || currentAssignedTo || currentTagId || search
  );

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // réinitialise à la page 1 lors d'un filtrage
    router.push(`/prospects?${params.toString()}`);
  }

  function resetFilters() {
    setSearch("");
    router.push("/prospects");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pushParams({ search: search || null });
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom ou téléphone…"
          className="w-64"
        />
      </form>

      <select
        value={currentStatus}
        onChange={(e) => pushParams({ status: e.target.value || null })}
        className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
      >
        <option value="">Tous les statuts</option>
        {PROSPECT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>

      {/* Filtre par commercial assigné */}
      {staffList && staffList.length > 0 && (
        <select
          value={currentAssignedTo}
          onChange={(e) => pushParams({ assignedTo: e.target.value || null })}
          className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
        >
          <option value="">Tous les commerciaux</option>
          {currentUserId && <option value={currentUserId}>👤 Mes prospects assignés</option>}
          <option value="unassigned">Non assignés</option>
          {staffList
            .filter((s) => s.id !== currentUserId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      )}

      {/* Filtre par étiquette */}
      {tagsList && tagsList.length > 0 && (
        <select
          value={currentTagId}
          onChange={(e) => pushParams({ tagId: e.target.value || null })}
          className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)]"
        >
          <option value="">Toutes les étiquettes</option>
          {tagsList.map((tag) => (
            <option key={tag.id} value={tag.id}>
              🏷️ {tag.label}
            </option>
          ))}
        </select>
      )}

      <Input
        defaultValue={currentCity}
        onBlur={(e) => pushParams({ city: e.target.value || null })}
        placeholder="Filtrer par ville…"
        className="w-40"
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
