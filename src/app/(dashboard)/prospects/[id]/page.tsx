import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect, listActivity } from "@/server/prospects";
import { StatusSelect } from "@/components/prospects/status-select";
import { DeleteProspectDialog } from "@/components/prospects/delete-prospect-dialog";
import { ProspectActivityFeed } from "@/components/prospects/prospect-activity-feed";
import { RelanceForm } from "@/components/relances/relance-form";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const activity = await listActivity(id);

  return (
    <div className="max-w-[720px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">{prospect.name}</h1>
          <StatusSelect prospectId={id} status={prospect.status} />
        </div>
        <div className="flex gap-2">
          <Link
            href={`/prospects/${id}/edit`}
            className="rounded-[6px] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--surface)]"
          >
            Modifier
          </Link>
          <DeleteProspectDialog id={id} name={prospect.name} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        <Detail label="Ville" value={prospect.city} />
        <Detail label="Catégorie" value={prospect.category} />
        <Detail label="Téléphone" value={prospect.phone} />
        <Detail label="WhatsApp" value={prospect.whatsapp} />
        <Detail label="Adresse" value={prospect.address} />
        <Detail label="Source" value={prospect.source} />
      </dl>

      {prospect.notes && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--fg)]">{prospect.notes}</p>
      )}

      <h2 className="mt-8 mb-3 text-sm font-bold text-[var(--fg)]">Relance</h2>
      <RelanceForm prospectId={id} />

      <h2 className="mt-8 mb-3 text-sm font-bold text-[var(--fg)]">Activité</h2>
      <ProspectActivityFeed entries={activity} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-[var(--fg-muted)]">{label}</dt>
      <dd className="text-[var(--fg)]">{value || "—"}</dd>
    </div>
  );
}
