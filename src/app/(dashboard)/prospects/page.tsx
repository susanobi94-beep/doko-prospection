import { listProspects } from "@/server/prospects";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { ProspectsFilterBar } from "@/components/prospects/prospects-filter-bar";

export const dynamic = "force-dynamic";

type SearchParams = { page?: string; pageSize?: string; status?: string; city?: string; search?: string };

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const { rows, page, pageSize, total } = await listProspects({
    page: params.page ? Number(params.page) : undefined,
    pageSize: params.pageSize ? Number(params.pageSize) : undefined,
    status: params.status,
    city: params.city,
    search: params.search,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--fg)]">Prospects</h1>
        <a
          href="/prospects/new"
          className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"
        >
          Ajouter un prospect
        </a>
      </div>

      <ProspectsFilterBar />
      <ProspectsTable rows={rows} />

      {total > 0 && (
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          Page {page} sur {totalPages} — {total} prospect{total > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
