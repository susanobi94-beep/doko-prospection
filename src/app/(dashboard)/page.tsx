import { redirect } from "next/navigation";

// La garde staff-actif est déjà appliquée par (dashboard)/layout.tsx.
export default function DashboardIndexPage() {
  redirect("/prospects");
}
