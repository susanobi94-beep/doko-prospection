import type { ProspectStatus } from "@/server/prospects-filter";

const LABELS: Record<ProspectStatus, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  interesse: "Intéressé",
  client: "Client",
  refuse: "Refusé",
};

const COLORS: Record<ProspectStatus, string> = {
  a_contacter: "var(--fg-muted)",
  contacte: "var(--primary)",
  interesse: "var(--primary)",
  client: "var(--success)",
  refuse: "var(--destructive)",
};

export function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <span
      className="inline-block rounded-[9999px] px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: COLORS[status] }}
    >
      {LABELS[status]}
    </span>
  );
}
