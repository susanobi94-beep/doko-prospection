import { createProspect } from "@/server/prospects-actions";
import { listAllStaff } from "@/server/staff";
import { ProspectForm } from "@/components/prospects/prospect-form";

export const dynamic = "force-dynamic";

export default async function NewProspectPage() {
  const staffList = await listAllStaff();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-[var(--fg)]">Ajouter une boutique</h1>
      <ProspectForm action={createProspect} staffList={staffList} />
    </div>
  );
}
