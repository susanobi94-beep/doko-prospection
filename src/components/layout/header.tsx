import Link from "next/link";
import { signOut } from "@/server/staff";

export function Header({ staffName, staffRole }: { staffName: string; staffRole?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--fg)]">{staffName}</span>
        {staffRole && (
          <span className="rounded-full bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            {staffRole}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {staffRole !== "lecture" && (
          <Link
            href="/prospects/new"
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <span>➕</span>
            <span className="hidden sm:inline">Nouvelle boutique</span>
            <span className="sm:hidden">Ajouter</span>
          </Link>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[6px] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)] hover:text-[var(--fg)]"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </header>
  );
}
