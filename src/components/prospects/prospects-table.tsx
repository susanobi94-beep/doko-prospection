import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/prospects/status-badge";
import type { Prospect } from "@/server/prospects";

export function ProspectsTable({ rows }: { rows: Prospect[] }) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-[var(--fg-muted)]">
        Aucun prospect ne correspond à ces filtres.{" "}
        <Link href="/prospects" className="text-[var(--primary)] underline">
          Réinitialiser les filtres
        </Link>
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.city}</TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.phone}</TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/prospects/${row.id}`} className="text-sm text-[var(--primary)] underline">
                Voir
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
