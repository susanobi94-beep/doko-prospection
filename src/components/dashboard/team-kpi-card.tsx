import Link from "next/link";
import type { TeamKpiResult } from "@/lib/team-kpi-utils";

export function TeamKpiCard({ teamKpis }: { teamKpis: TeamKpiResult[] }) {
  if (teamKpis.length === 0) {
    return null;
  }

  // Trier d'abord par volume de prospects décroissant, puis par taux de conversion
  const sorted = [...teamKpis].sort((a, b) => {
    if (b.totalProspects !== a.totalProspects) {
      return b.totalProspects - a.totalProspects;
    }
    return b.conversionRate - a.conversionRate;
  });

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--fg)]">
              🏢 Performance par Équipe & Zone (Cameroun & Afrique)
            </h2>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Terrain
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
            Volume de prospection et taux de conversion par métropole et sous-équipe de secteur
          </p>
        </div>

        <Link
          href="/settings/teams"
          className="text-xs text-[var(--primary)] hover:underline font-medium"
        >
          Gérer les équipes →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[var(--fg)]">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[10px] uppercase text-[var(--fg-muted)]">
            <tr>
              <th className="px-3 py-2.5">Équipe / Zone</th>
              <th className="px-3 py-2.5">Pays / Ville</th>
              <th className="px-3 py-2.5 text-center">Boutiques</th>
              <th className="px-3 py-2.5 text-center">Contactées</th>
              <th className="px-3 py-2.5 text-center">Clients Signés</th>
              <th className="px-3 py-2.5 text-right">Taux de Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((item) => {
              const isSubTeam = Boolean(item.parentId);

              return (
                <tr
                  key={item.teamId}
                  className="hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <td className="px-3 py-2.5 font-medium">
                    <Link
                      href={`/prospects?teamId=${item.teamId}`}
                      className="group-hover:text-[var(--primary)] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>{isSubTeam ? "↳" : "📍"}</span>
                      <span className={isSubTeam ? "text-[var(--fg-muted)] group-hover:text-[var(--primary)]" : "font-bold text-[var(--fg)]"}>
                        {item.teamName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--fg-muted)]">
                    {item.city ? `${item.city}, ` : ""}{item.country}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold">
                    {item.totalProspects}
                  </td>
                  <td className="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400">
                    {item.contacted}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {item.clients}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:block h-1.5 w-16 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, item.conversionRate)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 min-w-8">
                        {item.conversionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
