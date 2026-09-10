import { redirect } from "next/navigation";
import { requireActiveStaff } from "@/server/staff";

export default async function RootPage() {
  await requireActiveStaff();
  redirect("/prospects");
}
