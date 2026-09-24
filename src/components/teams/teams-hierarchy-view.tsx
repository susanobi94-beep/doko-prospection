"use client";

import { useState, useTransition } from "react";
import { buildTeamTree, type FlatTeam, type TeamNode } from "@/lib/team-tree-utils";
import type { StaffMember } from "@/server/staff";
import { deleteTeamAction, assignStaffToTeamAction } from "@/server/team-hierarchy-actions";

export function TeamsHierarchyView({
  teams,
  staff,
}: {
  teams: FlatTeam[];
  staff: StaffMember[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tree = buildTeamTree(teams);

  // Carte des membres assignés par ID d'équipe
  const staffByTeamId: Record<string, StaffMember[]> = {};
  for (const s of staff) {
    if (s.team_id) {
      if (!staffByTeamId[s.team_id]) staffByTeamId[s.team_id] = [];
      staffByTeamId[s.team_id].push(s);
    }
  }

  // Collaborateurs actifs non encore assignés
  const unassignedStaff = staff.filter((s) => s.active && !s.team_id);

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de l'équipe "${teamName}" ?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteTeamAction(teamId);
      if (!res.ok) {
        setError(res.error || "Impossible de supprimer l'équipe");
      }
    });
  };

  const handleAssignStaff = (staffId: string, teamId: string | null) => {
    setError(null);
    startTransition(async () => {
      const res = await assignStaffToTeamAction(staffId, teamId);
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'assignation du collaborateur");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {tree.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--fg-muted)]">
          Aucune équipe configurée pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {tree.map((rootNode) => (
            <div
              key={rootNode.id}
              className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Header de la zone principale / Métropole */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <h2 className="text-lg font-bold text-[var(--fg)]">
                      {rootNode.name}
                    </h2>
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {rootNode.country}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">
                    {rootNode.children.length > 0
                      ? `${rootNode.children.length} sous-équipe${rootNode.children.length > 1 ? "s" : ""} de secteur • `
                      : ""}
                    {rootNode.totalMembers} collaborateur{rootNode.totalMembers > 1 ? "s" : ""} dans la zone
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDeleteTeam(rootNode.id, rootNode.name)}
                    className="rounded-[6px] border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                  >
                    Supprimer zone
                  </button>
                </div>
              </div>

              {/* Sous-équipes ou membres directs de la zone */}
              <div className="mt-4 space-y-4">
                {rootNode.children.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rootNode.children.map((subTeam) => {
                      const members = staffByTeamId[subTeam.id] || [];

                      return (
                        <div
                          key={subTeam.id}
                          className="flex flex-col justify-between rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4 shadow-xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-[var(--fg)]">
                                ↳ {subTeam.name}
                              </h3>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleDeleteTeam(subTeam.id, subTeam.name)}
                                className="text-xs text-[var(--fg-muted)] hover:text-red-600"
                                title="Supprimer la sous-équipe"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Chef d'équipe */}
                            <div className="mt-2 text-xs">
                              {subTeam.leader?.name ? (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                  👑 Chef : {subTeam.leader.name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--fg-muted)] italic">
                                  Pas de chef d&apos;équipe assigné
                                </span>
                              )}
                            </div>

                            {/* Membres assignés */}
                            <div className="mt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                                Commerciaux ({members.length}) :
                              </p>
                              {members.length === 0 ? (
                                <p className="mt-1 text-xs text-[var(--fg-muted)] italic">
                                  Aucun commercial dans ce secteur.
                                </p>
                              ) : (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {members.map((m) => (
                                    <span
                                      key={m.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--fg)]"
                                    >
                                      👤 {m.name}
                                      <button
                                        type="button"
                                        disabled={pending}
                                        onClick={() => handleAssignStaff(m.id, null)}
                                        className="ml-1 text-[var(--fg-muted)] hover:text-red-500"
                                        title="Désassigner du secteur"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick assign dropdown */}
                          <div className="mt-4 pt-3 border-t border-[var(--border)]">
                            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--fg-muted)]">
                              + Affecter un commercial :
                            </label>
                            <select
                              disabled={pending}
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignStaff(e.target.value, subTeam.id);
                                }
                              }}
                              className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--fg)]"
                            >
                              <option value="">Sélectionner un collaborateur...</option>
                              {unassignedStaff.length > 0 && (
                                <optgroup label="Non assignés">
                                  {unassignedStaff.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.role})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="Tous les collaborateurs">
                                {staff
                                  .filter((s) => s.active && s.team_id !== subTeam.id)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.team?.name ? `Actuellement: ${s.team.name}` : s.role})
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Si la zone principale n'a pas de sous-équipes, afficher ses membres directs */
                  <div>
                    <p className="text-xs text-[var(--fg-muted)] italic mb-2">
                      Zone sans sous-équipes définies. Les collaborateurs peuvent y être affectés directement :
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {(staffByTeamId[rootNode.id] || []).map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--fg)]"
                        >
                          👤 {m.name}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleAssignStaff(m.id, null)}
                            className="ml-1 text-[var(--fg-muted)] hover:text-red-500"
                            title="Désassigner"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <div className="w-56">
                        <select
                          disabled={pending}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignStaff(e.target.value, rootNode.id);
                            }
                          }}
                          className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--fg)]"
                        >
                          <option value="">+ Affecter à cette zone...</option>
                          {staff
                            .filter((s) => s.active && s.team_id !== rootNode.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
