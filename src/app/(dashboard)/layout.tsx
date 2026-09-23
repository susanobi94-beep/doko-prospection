import { requireActiveStaff } from "@/server/staff";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireActiveStaff();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] md:flex-row">
      <Sidebar role={staff.role} />
      <div className="flex flex-1 flex-col">
        <Header staffName={staff.name} staffRole={staff.role} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
