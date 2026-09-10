"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { softDeleteProspect } from "@/server/prospects-actions";

export function DeleteProspectDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await softDeleteProspect(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/prospects");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-[6px] border border-[var(--destructive)] px-4 py-2 text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white">
        Supprimer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer {name} ?</DialogTitle>
          <DialogDescription>
            Cette action retire {name} du pipeline. Son historique reste consultable mais il n&apos;apparaîtra
            plus dans la liste.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
        <DialogFooter>
          <DialogClose className="rounded-[6px] px-4 py-2 text-sm text-[var(--fg-muted)]">
            Annuler
          </DialogClose>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-[6px] bg-[var(--destructive)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Suppression…" : "Confirmer la suppression"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
