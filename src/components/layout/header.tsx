import { signOut } from "@/server/staff";

export function Header({ staffName }: { staffName: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <span className="text-sm font-medium text-[var(--fg)]">{staffName}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-[6px] px-3 py-1.5 text-sm text-[var(--fg-muted)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)]"
        >
          Déconnexion
        </button>
      </form>
    </header>
  );
}
