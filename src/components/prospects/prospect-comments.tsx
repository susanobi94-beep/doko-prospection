"use client";

import { useState, useTransition } from "react";
import { addCommentAction, deleteCommentAction } from "@/server/comments-actions";
import type { ProspectComment } from "@/server/prospects";

type Props = {
  prospectId: string;
  comments: ProspectComment[];
  currentUserId: string;
  isAdmin: boolean;
};

export function ProspectComments({
  prospectId,
  comments,
  currentUserId,
  isAdmin,
}: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await addCommentAction(prospectId, body);
      if (!res.ok) {
        setError(res.error || "Une erreur est survenue");
      } else {
        setBody("");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;

    startTransition(async () => {
      const res = await deleteCommentAction(commentId, prospectId);
      if (!res.ok) {
        alert(res.error || "Erreur lors de la suppression");
      }
    });
  };

  return (
    <section className="space-y-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--fg)]">
          💬 Notes de suivi & Commentaires ({comments.length})
        </h2>
      </div>

      {/* Formulaire d'ajout de note */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ajouter une note d'appel, un compte-rendu de visite, une objection client..."
            rows={3}
            maxLength={2000}
            disabled={isPending}
            className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-[var(--fg-muted)]">
            {body.length} / 2000
          </span>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-[6px] bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-[var(--primary-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Enregistrement..." : "Ajouter la note"}
          </button>
        </div>
      </form>

      {/* Liste des commentaires */}
      <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] pt-2">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--fg-muted)]">
            Aucune note pour le moment. Utilisez le formulaire ci-dessus pour consigner les échanges avec ce prospect.
          </p>
        ) : (
          comments.map((comment) => {
            const authorName = comment.author?.name || "Collaborateur";
            const initials = authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const canDelete = isAdmin || comment.author_id === currentUserId;
            const formattedDate = new Date(comment.created_at).toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={comment.id} className="py-3 first:pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-subtle)] text-[10px] font-bold text-[var(--primary)]">
                      {initials}
                    </span>
                    <span className="text-xs font-semibold text-[var(--fg)]">{authorName}</span>
                    <span className="text-[11px] text-[var(--fg-muted)]">• {formattedDate}</span>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 opacity-70 hover:opacity-100 transition-opacity"
                      title="Supprimer cette note"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <p className="mt-1.5 whitespace-pre-wrap pl-8 text-xs leading-relaxed text-[var(--fg)]">
                  {comment.body}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
