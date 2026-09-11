import Link from "next/link";

const links = [
  { href: "/prospects", label: "Prospects" },
  { href: "/relances", label: "Relances" },
];

export function Sidebar() {
  return (
    <nav className="flex w-full shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] p-3 md:h-screen md:w-60 md:flex-col md:items-stretch md:border-r md:border-b-0 md:p-4">
      <span className="mr-2 shrink-0 font-heading text-lg font-bold text-[var(--fg)] md:mb-4 md:mr-0">
        Doko Prospection
      </span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)]"
        >
          {link.label}
        </Link>
      ))}
      <a
        href="/api/export"
        className="shrink-0 rounded-[6px] px-3 py-2 text-sm font-medium text-[var(--fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--background)]"
      >
        Export
      </a>
    </nav>
  );
}
