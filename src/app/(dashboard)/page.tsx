import Link from "next/link";
import { requireActiveStaff } from "@/server/staff";
import { getDashboardStats } from "@/server/prospects";
import { listDueRelances, countOverdueRelances } from "@/server/relances";
import { getTeamKpiStats } from "@/server/team-hierarchy-actions";
import { RelanceList } from "@/components/relances/relance-list";
import { TeamKpiCard } from "@/components/dashboard/team-kpi-card";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  a_contacter: { label: "À contacter", color: "bg-slate-500" },
  contacte: { label: "Contacté", color: "bg-blue-500" },
  interesse: { label: "Intéressé", color: "bg-purple-500" },
  client: { label: "Clients signés", color: "bg-emerald-500" },
  refuse: { label: "Refusé", color: "bg-rose-500" },
};

export default async function DashboardIndexPage() {
  const [currentStaff, stats, dueRelances, overdueCount, teamKpis] = await Promise.all([
    requireActiveStaff(),
    getDashboardStats(),
    listDueRelances(),
    countOverdueRelances(),
    getTeamKpiStats(),
  ]);

  const total = stats.totalProspects;
  const conversionRate = total > 0 ? Math.round((stats.totalClients / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Salutation & Actions rapides */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">
            Bonjour, {currentStaff.name} 👋
          </h1>
          <p className="text-xs text-[var(--fg-muted)]">
            Rôle : <span className="capitalize font-medium text-[var(--fg)]">{currentStaff.role}</span> • Suivi en temps réel de la prospection Doko
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/prospects/new"
            className="rounded-[6px] bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
          >
            + Nouvelle boutique
          </Link>
          <a
            href="/api/export"
            download
            className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--fg-muted)]">Total Boutiques</p>
          <p className="mt-1 text-2xl font-bold text-[var(--fg)]">{stats.totalProspects}</p>
          <Link href="/prospects" className="mt-2 inline-block text-xs text-[var(--primary)] hover:underline">
            Voir tout l&apos;annuaire →
          </Link>
        </div>

        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--fg-muted)]">Ajoutées cette semaine</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">+{stats.newThisWeek}</p>
          <p className="mt-2 text-xs text-[var(--fg-muted)]">Rythme de prospection récent</p>
        </div>

        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--fg-muted)]">Clients Convertis</p>
          <div className="flex items-baseline gap-2">
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalClients}</p>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              {conversionRate}% conversion
            </span>
          </div>
          <Link href="/prospects?status=client" className="mt-2 inline-block text-xs text-[var(--primary)] hover:underline">
            Voir les clients signés →
          </Link>
        </div>

        <div className={`rounded-[10px] border p-4 shadow-sm ${
          overdueCount > 0
            ? "border-red-300 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
            : "border-[var(--border)] bg-[var(--surface)]"
        }`}>
          <p className="text-xs font-medium text-[var(--fg-muted)]">Relances urgentes</p>
          <div className="flex items-baseline gap-2">
            <p className={`mt-1 text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-[var(--fg)]"}`}>
              {dueRelances.length}
            </p>
            {overdueCount > 0 && (
              <span className="text-xs font-semibold text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                {overdueCount} en retard
              </span>
            )}
          </div>
          <Link href="/relances" className="mt-2 inline-block text-xs text-[var(--primary)] hover:underline">
            Traiter les relances →
          </Link>
        </div>
      </div>

      {/* Funnel Pipeline Commercial */}
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--fg)]">Entonnoir de Prospection (Pipeline)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {(["a_contacter", "contacte", "interesse", "client", "refuse"] as const).map((status) => {
            const count = stats.byStatus[status] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const cfg = STATUS_LABELS[status];

            return (
              <Link
                key={status}
                href={`/prospects?status=${status}`}
                className="group rounded-[8px] border border-[var(--border)] p-3 hover:border-[var(--primary)] transition-all bg-[var(--background)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--fg-muted)] group-hover:text-[var(--primary)]">
                    {cfg.label}
                  </span>
                  <span className="text-xs text-[var(--fg-muted)]">{pct}%</span>
                </div>
                <p className="mt-1 text-xl font-bold text-[var(--fg)]">{count}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Performance des Équipes & Secteurs (Cameroun & Afrique) */}
      <TeamKpiCard teamKpis={teamKpis} />

      {/* Relances prioritaires à traiter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--fg)]">
            Relances dues aujourd&apos;hui & en retard ({dueRelances.length})
          </h2>
          <Link href="/relances" className="text-xs text-[var(--primary)] hover:underline">
            Voir l&apos;agenda complet →
          </Link>
        </div>

        <RelanceList
          relances={dueRelances.slice(0, 5)}
          emptyMessage="Aucune relance urgente à traiter aujourd'hui. Bon travail !"
        />
      </div>
    </div>
  );
}
