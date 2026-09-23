import { requireAdmin, listAllStaff } from "@/server/staff";
import { TeamManagementTable } from "@/components/team/team-management-table";
import { AddStaffForm } from "@/components/team/add-staff-form";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const currentAdmin = await requireAdmin();
  const members = await listAllStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--fg)]">Gestion de l&apos;Équipe & Accès Centralisés</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Gérez les membres de votre équipe commerciale, attribuez les rôles et coupez l&apos;accès en 1 clic si nécessaire.
        </p>
      </div>

      <AddStaffForm />

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--fg)]">
          Collaborateurs enregistrés ({members.length})
        </h2>
        <TeamManagementTable members={members} currentAdminId={currentAdmin.id} />
      </div>
    </div>
  );
}
