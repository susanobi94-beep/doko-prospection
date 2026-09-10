import { notFound } from "next/navigation";
import { getProspect } from "@/server/prospects";
import { updateProspect } from "@/server/prospects-actions";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default async function EditProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const action = updateProspect.bind(null, id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-[var(--fg)]">Modifier {prospect.name}</h1>
      <ProspectForm action={action} defaultValues={prospect} />
    </div>
  );
}
