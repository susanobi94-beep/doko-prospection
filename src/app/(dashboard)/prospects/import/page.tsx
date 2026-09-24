import Link from "next/link";
import { requireEditorStaff } from "@/server/staff";
import { CsvImporter } from "@/components/prospects/csv-importer";

export const dynamic = "force-dynamic";

export default async function ProspectImportPage() {
  await requireEditorStaff();

  return (
    <div className="max-w-[800px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mb-1">
            <Link href="/prospects" className="hover:underline">
              ← Retour aux prospects
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Importer des prospects en masse</h1>
          <p className="text-xs text-[var(--fg-muted)]">
            Transférez rapidement vos listes de commerçants et boutiques depuis un fichier CSV ou Excel.
          </p>
        </div>
      </div>

      <CsvImporter />
    </div>
  );
}
