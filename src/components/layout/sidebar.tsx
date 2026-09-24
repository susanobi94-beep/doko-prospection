import Link from "next/link";

export function Sidebar({ role }: { role?: string }) {
  const links = [
    { href: "/", label: "📊 Tableau de bord" },
    { href: "/prospects", label: "🏪 Prospects & Boutiques" },
    { href: "/relances", label: "⏰ Relances" },
  ];

  return (
    <aside className="flex w-full shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] p-3 md:h-screen md:w-64 md:flex-col md:items-stretch md:border-r md:border-b-0 md:p-4">
      <Link href="/" className="mr-3 shrink-0 font-heading text-lg font-bold text-[var(--fg)] md:mb-6 md:mr-0">
        Doko Prospection
      </Link>

      <nav className="flex items-center gap-1 md:flex-col md:items-stretch md:space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)]"
          >
            {link.label}
          </Link>
        ))}

        {role === "admin" && (
          <>
            <Link
              href="/settings/teams"
              className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)]"
            >
              🏢 Équipes & Secteurs
            </Link>
            <Link
              href="/settings/team"
              className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)]"
            >
              👥 Utilisateurs & Rôles
            </Link>
          </>
        )}

        {role !== "lecture" && (
          <Link
            href="/prospects/import"
            className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)]"
          >
            📥 Importer CSV
          </Link>
        )}

        <a
          href="/api/export"
          download
          className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg-muted)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
        >
          📤 Exporter CSV
        </a>

        <a
          href="/guide-formation.html"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--primary)] transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-hover)]"
        >
          📖 Guide & Formation
        </a>
      </nav>
    </aside>
  );
}
