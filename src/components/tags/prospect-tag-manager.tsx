"use client";

import { useState, useTransition } from "react";
import { TagBadge } from "./tag-badge";
import {
  attachTagAction,
  detachTagAction,
  createTagAction,
  type Tag,
} from "@/server/tags-actions";
import type { ProspectTag } from "@/server/prospects";

type Props = {
  prospectId: string;
  currentTags: ProspectTag[];
  allTags: Tag[];
  isEditor: boolean;
};

const PRESET_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6B7280", // Gray
];

export function ProspectTagManager({
  prospectId,
  currentTags,
  allTags,
  isEditor,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentTagIds = new Set(currentTags.map((t) => t.id));
  const availableTags = allTags.filter((t) => !currentTagIds.has(t.id));

  const handleAttach = (tagId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await attachTagAction(prospectId, tagId);
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'ajout de l'étiquette");
      }
    });
  };

  const handleDetach = (tagId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await detachTagAction(prospectId, tagId);
      if (!res.ok) {
        setError(res.error || "Erreur lors du retrait");
      }
    });
  };

  const handleCreateAndAttach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setError(null);
    startTransition(async () => {
      const created = await createTagAction(newLabel.trim(), newColor);
      if (!created.ok || !created.tag) {
        setError(created.error || "Impossible de créer l'étiquette");
        return;
      }

      await attachTagAction(prospectId, created.tag.id);
      setNewLabel("");
      setIsCreating(false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {currentTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="md"
            onRemove={isEditor ? () => handleDetach(tag.id) : undefined}
          />
        ))}

        {isEditor && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--fg-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              + Étiquette
            </button>

            {isOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-64 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--fg)]">
                    {isCreating ? "Nouvelle étiquette" : "Choisir une étiquette"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsCreating(false);
                    }}
                    className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  >
                    ✕
                  </button>
                </div>

                {error && <p className="mt-2 text-[11px] text-red-500 font-medium">{error}</p>}

                {!isCreating ? (
                  <div className="mt-2 space-y-2">
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {availableTags.length === 0 ? (
                        <p className="py-2 text-center text-xs text-[var(--fg-muted)]">
                          Toutes les étiquettes existantes sont déjà associées.
                        </p>
                      ) : (
                        availableTags.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleAttach(t.id)}
                            disabled={isPending}
                            className="flex w-full items-center justify-between rounded-[4px] px-2 py-1 text-left text-xs hover:bg-[var(--surface-hover)]"
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: t.color }}
                              />
                              <span className="text-[var(--fg)]">{t.label}</span>
                            </span>
                            <span className="text-[10px] text-[var(--primary)] font-semibold">+ Ajouter</span>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                    >
                      + Créer une nouvelle étiquette
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateAndAttach} className="mt-2 space-y-2">
                    <div>
                      <label className="text-[11px] text-[var(--fg-muted)]">Nom de l&apos;étiquette</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Ex: Client VIP, Marché Mokolo..."
                        maxLength={50}
                        autoFocus
                        className="mt-1 w-full rounded-[4px] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--fg-muted)]">Couleur</label>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            className={`h-5 w-5 rounded-full border-2 transition-transform ${
                              newColor === c ? "scale-115 border-white shadow-sm ring-2 ring-[var(--primary)]" : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="flex-1 rounded-[4px] border border-[var(--border)] px-2 py-1 text-xs text-[var(--fg-muted)] hover:bg-[var(--surface-hover)]"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isPending || !newLabel.trim()}
                        className="flex-1 rounded-[4px] bg-[var(--primary)] px-2 py-1 text-xs font-medium text-[var(--primary-fg)] hover:opacity-90 disabled:opacity-50"
                      >
                        Créer & lier
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
