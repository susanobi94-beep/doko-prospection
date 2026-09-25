import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/prospects/status-badge";
import { TagBadge } from "@/components/tags/tag-badge";
import type { Prospect } from "@/server/prospects";

const CATEGORY_LABELS: Record<string, string> = {
  boutique_telephone: "Téléphonie",
  pme: "PME",
  diaspora: "Diaspora",
};

export function ProspectsTable({ rows }: { rows: Prospect[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--fg-muted)]">
        Aucun prospect ne correspond à ces critères.{" "}
        <Link href="/prospects" className="text-[var(--primary)] underline font-medium">
          Réinitialiser les filtres
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Boutique</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const rawWa = row.whatsapp || row.phone;
            const waClean = rawWa.replace(/\D/g, "");

            return (
              <TableRow key={row.id} className="hover:bg-[var(--surface-hover)]">
                <TableCell className="font-medium text-[var(--fg)]">
                  <div>
                    <Link href={`/prospects/${row.id}`} className="hover:underline font-semibold">
                      {row.name}
                    </Link>
                    {row.assigned_staff?.name && (
                      <span className="ml-2 text-[10px] text-[var(--fg-muted)]">
                        ({row.assigned_staff.name})
                      </span>
                    )}
                    {row.team?.name && (
                      <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        👥 {row.team.name}
                      </span>
                    )}
                  </div>
                  {row.tags && row.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.tags.map((t) => (
                        <TagBadge key={t.id} tag={t} size="sm" />
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-[var(--fg-muted)]">
                  <div className="flex items-center gap-1.5">
                    <span>{row.city}</span>
                    {row.latitude && row.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`GPS: ${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)} (Ouvrir Maps)`}
                        className="inline-flex items-center rounded bg-blue-50 px-1 py-0.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📍 Maps
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--fg-muted)]">
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <a href={`tel:${row.phone}`} className="text-[var(--fg)] hover:underline">
                      📞 {row.phone}
                    </a>
                    {waClean && (
                      <a
                        href={`https://wa.me/${waClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700"
                        title="Ouvrir WhatsApp"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/prospects/${row.id}`}
                    className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--fg)] hover:bg-[var(--background)]"
                  >
                    Fiche →
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
