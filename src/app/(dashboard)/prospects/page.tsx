import Link from "next/link";
import { listProspects } from "@/server/prospects";
import { requireActiveStaff, listAllStaff } from "@/server/staff";
import { listAllTags } from "@/server/tags-actions";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { ProspectsFilterBar } from "@/components/prospects/prospects-filter-bar";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  city?: string;
  search?: string;
  assignedTo?: string;
  tagId?: string;
};

export default async function ProspectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, currentStaff, staffList, tagsList] = await Promise.all([
    searchParams,
    requireActiveStaff(),
    listAllStaff(),
    listAllTags(),
  ]);

  const currentPage = params.page ? Math.max(1, Number(params.page)) : 1;
  const pageSize = params.pageSize ? Number(params.pageSize) : 25;

  const { rows, total } = await listProspects({
    page: currentPage,
    pageSize,
    status: params.status,
    city: params.city,
    search: params.search,
    assignedTo: params.assignedTo,
    tagId: params.tagId,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Construit l'URL avec les mêmes query params mais un numéro de page différent
  function getPageUrl(targetPage: number) {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.city) q.set("city", params.city);
    if (params.search) q.set("search", params.search);
    if (params.assignedTo) q.set("assignedTo", params.assignedTo);
    if (params.tagId) q.set("tagId", params.tagId);
    if (params.pageSize) q.set("pageSize", params.pageSize);
    q.set("page", String(targetPage));
    return `/prospects?${q.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Boutiques & Prospects</h1>
          <p className="text-xs text-[var(--fg-muted)]">
            {total} prospect{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/prospects/new"
          className="rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
        >
          + Ajouter une boutique
        </Link>
      </div>

      <ProspectsFilterBar
        staffList={staffList}
        currentUserId={currentStaff.id}
        tagsList={tagsList}
      />
      <ProspectsTable rows={rows} />

      {/* Pagination interactive */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm">
          <p className="text-xs text-[var(--fg-muted)]">
            Affichage de la page <span className="font-semibold text-[var(--fg)]">{currentPage}</span> sur{" "}
            <span className="font-semibold text-[var(--fg)]">{totalPages}</span> ({total} résultats)
          </p>

          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={getPageUrl(currentPage - 1)}
                className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
              >
                ← Précédent
              </Link>
            ) : (
              <span className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] opacity-50 cursor-not-allowed">
                ← Précédent
              </span>
            )}

            <span className="px-2 text-xs text-[var(--fg-muted)]">
              {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={getPageUrl(currentPage + 1)}
                className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
              >
                Suivant →
              </Link>
            ) : (
              <span className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] opacity-50 cursor-not-allowed">
                Suivant →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
