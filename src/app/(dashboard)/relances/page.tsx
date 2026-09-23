import Link from "next/link";
import { listRelances, countOverdueRelances, type RelanceFilterTab } from "@/server/relances";
import { RelanceList } from "@/components/relances/relance-list";

export const dynamic = "force-dynamic";

type SearchParams = { tab?: string };

export default async function RelancesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentTab = (params.tab as RelanceFilterTab) || "due";
  const [relances, overdueCount] = await Promise.all([
    listRelances(currentTab),
    countOverdueRelances(),
  ]);

  const tabs: { key: RelanceFilterTab; label: string; countBadge?: number }[] = [
    { key: "due", label: "Dues & En retard", countBadge: overdueCount > 0 ? overdueCount : undefined },
    { key: "upcoming", label: "À venir" },
    { key: "done", label: "Terminées" },
    { key: "all", label: "Toutes" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--fg)]">Suivi des Relances</h1>
      </div>

      {/* Barre d'onglets */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/relances?tab=${tab.key}`}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                  : "bg-[var(--surface)] text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
              }`}
            >
              {tab.label}
              {tab.countBadge !== undefined && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {tab.countBadge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <RelanceList
        relances={relances}
        emptyMessage={
          currentTab === "due"
            ? "Super ! Aucune relance en retard ni due aujourd'hui."
            : currentTab === "upcoming"
            ? "Aucune relance future programmée."
            : currentTab === "done"
            ? "Aucune relance marquée comme terminée pour le moment."
            : "Aucune relance trouvée."
        }
      />
    </div>
  );
}
