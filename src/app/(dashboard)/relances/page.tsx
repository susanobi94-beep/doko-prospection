import { listDueRelances } from "@/server/relances";
import { RelanceList } from "@/components/relances/relance-list";

export const dynamic = "force-dynamic";

export default async function RelancesPage() {
  const relances = await listDueRelances();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-[var(--fg)]">Relances</h1>
      <RelanceList relances={relances} />
    </div>
  );
}
