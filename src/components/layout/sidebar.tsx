import Link from "next/link";

const links = [
  { href: "/prospects", label: "Prospects" },
  { href: "/relances", label: "Relances" },
];

export function Sidebar() {
  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)] p-4">
      <span className="mb-4 font-heading text-lg font-bold text-[var(--fg)]">Doko Prospection</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)]"
        >
          {link.label}
        </Link>
      ))}
      <a
        href="/api/export"
        className="rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)]"
      >
        Export
      </a>
    </nav>
  );
}
