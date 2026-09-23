"use client";

import { useTransition, useState } from "react";
import type { StaffMember, StaffRole } from "@/server/staff";
import { toggleStaffActive, changeStaffRole } from "@/server/team-actions";

export function TeamManagementTable({
  members,
  currentAdminId,
}: {
  members: StaffMember[];
  currentAdminId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = (id: string, active: boolean) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await toggleStaffActive(id, active);
      if (!res.ok) {
        setErrorMessage(res.error);
      }
    });
  };

  const handleRoleChange = (id: string, newRole: StaffRole) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await changeStaffRole(id, newRole);
      if (!res.ok) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <table className="w-full text-left text-sm text-[var(--fg)]">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs uppercase text-[var(--fg-muted)]">
            <tr>
              <th className="px-4 py-3">Collaborateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut Accès</th>
              <th className="px-4 py-3 text-right">Actions Centrales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {members.map((member) => {
              const isSelf = member.id === currentAdminId;
              return (
                <tr
                  key={member.id}
                  className={`hover:bg-[var(--surface-hover)] transition-colors ${
                    !member.active ? "bg-red-50/20 dark:bg-red-950/10 opacity-75" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {member.name} {isSelf && <span className="text-xs text-[var(--primary)] font-normal">(Vous)</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">{member.email}</td>
                  <td className="px-4 py-3">
                    <select
                      disabled={pending || isSelf}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as StaffRole)}
                      className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--fg)] disabled:opacity-50"
                    >
                      <option value="commercial">Commercial</option>
                      <option value="admin">Administrateur</option>
                      <option value="lecture">Lecture seule</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {member.active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ● Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                        ✕ Bloqué
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSelf ? (
                      <span className="text-xs italic text-[var(--fg-muted)]">Compte actuel</span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggle(member.id, member.active)}
                        className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          member.active
                            ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                            : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {member.active ? "🔴 Couper l'accès" : "🟢 Rétablir l'accès"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
