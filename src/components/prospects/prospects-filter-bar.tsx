"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PROSPECT_STATUSES } from "@/server/prospects-filter";

const STATUS_LABELS: Record<string, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

export function ProspectsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // tout changement de filtre repart de la page 1
    router.push(`/prospects?${params.toString()}`);
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
        defaultValue={searchParams.get("status") ?? ""}
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

      <Input
        defaultValue={searchParams.get("city") ?? ""}
        onBlur={(e) => pushParams({ city: e.target.value || null })}
        placeholder="Ville…"
        className="w-40"
      />
    </div>
  );
}
