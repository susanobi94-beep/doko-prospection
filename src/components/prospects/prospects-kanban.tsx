"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { KANBAN_COLUMNS, groupProspectsByStatus } from "./kanban-utils";
import { TagBadge } from "@/components/tags/tag-badge";
import { changeProspectStatus } from "@/server/prospects-actions";
import { PROSPECT_STATUSES, type ProspectStatus } from "@/server/prospects-filter";
import type { Prospect } from "@/server/prospects";

const STATUS_LABELS: Record<ProspectStatus, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

export function ProspectsKanban({ rows }: { rows: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(rows);
  const [, startTransition] = useTransition();

  // Synchronise lorsque les props changent (filtres appliqués)
  useEffect(() => {
    setProspects(rows);
  }, [rows]);

  const grouped = groupProspectsByStatus(prospects);

  const handleStatusChange = (prospectId: string, nextStatus: ProspectStatus) => {
    // Mise à jour optimiste immédiate
    const previous = prospects;
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, status: nextStatus } : p))
    );

    startTransition(async () => {
      const res = await changeProspectStatus(prospectId, nextStatus);
      if (!res.ok) {
        // En cas d'échec, rétablir l'état antérieur
        setProspects(previous);
        alert(res.error || "Impossible de mettre à jour le statut");
      }
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
      {KANBAN_COLUMNS.map((col) => {
        const columnProspects = grouped[col.status] || [];

        return (
          <div
            key={col.status}
            className="flex w-72 shrink-0 flex-col rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3"
          >
            {/* Header de la colonne */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg)]">
                  {col.title}
                </h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeBg} ${col.badgeFg}`}
              >
                {columnProspects.length}
              </span>
            </div>

            {/* Liste des cartes de prospects */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
              {columnProspects.length === 0 ? (
                <div className="rounded-[6px] border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--fg-muted)]">
                  Aucun prospect
                </div>
              ) : (
                columnProspects.map((prospect) => {
                  const rawWa = prospect.whatsapp || prospect.phone;
                  const waClean = rawWa.replace(/\D/g, "");

                  return (
                    <div
                      key={prospect.id}
                      className="group rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs transition-shadow hover:shadow-md"
                    >
                      {/* Titre & Lien */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="font-semibold text-xs text-[var(--fg)] hover:underline hover:text-[var(--primary)] line-clamp-1"
                          title={prospect.name}
                        >
                          {prospect.name}
                        </Link>
                      </div>

                      {/* Métadonnées : Ville & Assignation */}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
                        <span>📍 {prospect.city}</span>
                        {prospect.assigned_staff?.name && (
                          <span
                            className="font-medium text-[var(--fg)]"
                            title={`Assigné à ${prospect.assigned_staff.name}`}
                          >
                            👤 {prospect.assigned_staff.name.split(" ")[0]}
                          </span>
                        )}
                      </div>

                      {/* Contacts rapides (Appel & WhatsApp) */}
                      <div className="mt-2 flex items-center gap-2 border-t border-[var(--border)] pt-2 text-[11px]">
                        <a
                          href={`tel:${prospect.phone}`}
                          className="text-[var(--fg)] hover:underline hover:text-[var(--primary)] truncate"
                          title="Appeler"
                        >
                          📞 {prospect.phone}
                        </a>
                        {waClean && (
                          <a
                            href={`https://wa.me/${waClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-emerald-600 hover:text-emerald-700"
                            title="WhatsApp"
                          >
                            💬
                          </a>
                        )}
                      </div>

                      {/* Étiquettes / Tags */}
                      {prospect.tags && prospect.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {prospect.tags.map((t) => (
                            <TagBadge key={t.id} tag={t} size="sm" />
                          ))}
                        </div>
                      )}

                      {/* Sélecteur de changement de statut rapide */}
                      <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
                        <select
                          value={prospect.status}
                          onChange={(e) =>
                            handleStatusChange(
                              prospect.id,
                              e.target.value as ProspectStatus
                            )
                          }
                          className="w-full rounded-[4px] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none"
                        >
                          {PROSPECT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              Déplacer vers : {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
