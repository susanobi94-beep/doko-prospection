import { createProspect } from "@/server/prospects-actions";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-[var(--fg)]">Ajouter un prospect</h1>
      <ProspectForm action={createProspect} />
    </div>
  );
}
