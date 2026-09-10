import { requireActiveStaff } from "@/server/staff";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireActiveStaff();

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header staffName={staff.name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
