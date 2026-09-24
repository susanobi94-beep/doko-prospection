"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ViewSwitcher({ currentView }: { currentView: "table" | "kanban" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchView = (targetView: "table" | "kanban") => {
    if (targetView === currentView) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", targetView);
    router.push(`/prospects?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-xs">
      <button
        type="button"
        onClick={() => switchView("table")}
        className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-all ${
          currentView === "table"
            ? "bg-[var(--primary)] text-[var(--primary-fg)] shadow-xs"
            : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
        }`}
      >
        <span>📋</span>
        <span>Tableau</span>
      </button>

      <button
        type="button"
        onClick={() => switchView("kanban")}
        className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-all ${
          currentView === "kanban"
            ? "bg-[var(--primary)] text-[var(--primary-fg)] shadow-xs"
            : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
        }`}
      >
        <span>📊</span>
        <span>Kanban</span>
      </button>
    </div>
  );
}
