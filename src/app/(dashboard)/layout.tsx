import { requireActiveStaff } from "@/server/staff";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireActiveStaff();

  return <div className="min-h-screen bg-[var(--background)]">{children}</div>;
}
