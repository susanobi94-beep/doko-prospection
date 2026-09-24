import { requireAdmin, listAllStaff } from "@/server/staff";
import { listAllTeamsWithStats } from "@/server/team-hierarchy-actions";
import { TeamsHierarchyView } from "@/components/teams/teams-hierarchy-view";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";

export const dynamic = "force-dynamic";

export default async function TeamsSettingsPage() {
  await requireAdmin();
  const [teams, staff] = await Promise.all([
    listAllTeamsWithStats(),
    listAllStaff(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">
            🏢 Équipes & Sous-Équipes de Secteur
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Structurez vos équipes de prospection terrain par métropoles (Douala, Yaoundé...), sous-secteurs commerciaux et chefs d&apos;équipe.
          </p>
        </div>

        <CreateTeamDialog teams={teams} staff={staff} />
      </div>

      <TeamsHierarchyView teams={teams} staff={staff} />
    </div>
  );
}
