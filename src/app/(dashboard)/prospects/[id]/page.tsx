import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect, listActivity, listCommentsForProspect } from "@/server/prospects";
import { listRelancesForProspect } from "@/server/relances";
import { requireActiveStaff } from "@/server/staff";
import { StatusSelect } from "@/components/prospects/status-select";
import { DeleteProspectDialog } from "@/components/prospects/delete-prospect-dialog";
import { ProspectActivityFeed } from "@/components/prospects/prospect-activity-feed";
import { ProspectComments } from "@/components/prospects/prospect-comments";
import { RelanceForm } from "@/components/relances/relance-form";
import { RelanceList } from "@/components/relances/relance-list";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const [activity, relances, comments, currentStaff] = await Promise.all([
    listActivity(id),
    listRelancesForProspect(id),
    listCommentsForProspect(id),
    requireActiveStaff(),
  ]);

  const assignedName = prospect.assigned_staff?.name || (prospect.assigned_to ? "Collaborateur assigné" : "Non assigné");

  return (
    <div className="max-w-[760px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">{prospect.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusSelect prospectId={id} status={prospect.status} />
            <span className="text-xs text-[var(--fg-muted)]">
              Assigné à : <strong className="text-[var(--fg)]">{assignedName}</strong>
            </span>
          </div>
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

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm sm:grid-cols-2">
        <Detail label="Ville" value={prospect.city} />
        <Detail label="Catégorie" value={prospect.category} />
        <div>
          <dt className="text-xs text-[var(--fg-muted)]">Téléphone</dt>
          <dd className="text-[var(--fg)]">
            <a href={`tel:${prospect.phone}`} className="hover:underline font-medium text-[var(--primary)]">
              {prospect.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--fg-muted)]">WhatsApp</dt>
          <dd className="text-[var(--fg)]">
            {prospect.whatsapp ? (
              <a
                href={`https://wa.me/${prospect.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline font-medium"
              >
                💬 {prospect.whatsapp} (Ouvrir WhatsApp)
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <Detail label="Adresse" value={prospect.address} />
        <Detail label="Source" value={prospect.source} />
        <Detail label="Assigné à" value={assignedName} />
      </dl>

      {prospect.notes && (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase text-[var(--fg-muted)]">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--fg)]">{prospect.notes}</p>
        </div>
      )}

      {/* Section Relances */}
      <section className="space-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-bold text-[var(--fg)]">Planifier une relance</h2>
        <RelanceForm prospectId={id} />

        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--fg-muted)]">
            Relances programmées & passées ({relances.length})
          </h3>
          <RelanceList
            relances={relances}
            emptyMessage="Aucune relance enregistrée pour cette boutique."
          />
        </div>
      </section>

      {/* Section Commentaires / Notes datées */}
      <ProspectComments
        prospectId={id}
        comments={comments}
        currentUserId={currentStaff.id}
        isAdmin={currentStaff.role === "admin"}
      />

      {/* Section Historique d'activité */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[var(--fg)]">Historique d&apos;activité</h2>
        <ProspectActivityFeed entries={activity} />
      </section>
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
