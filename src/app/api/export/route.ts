import { createClient } from "@/lib/supabase/server";
import { evaluateStaffAccess } from "@/server/staff-access";
import { buildProspectsFilter } from "@/server/prospects-filter";
import { writeCsvRow } from "@/lib/csv";

const HEADER = ["name", "city", "category", "phone", "whatsapp", "status", "created_at"];

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: staffRow } = await supabase.from("staff").select("active").eq("id", user.id).single();

  if (!evaluateStaffAccess(staffRow ? { active: staffRow.active } : null)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filter = buildProspectsFilter({
    status: searchParams.get("status") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  let query = supabase
    .from("prospects")
    .select("name, city, category, phone, whatsapp, status, created_at")
    .is("deleted_at", null);

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.city) query = query.ilike("city", `%${filter.city}%`);
  if (filter.search) {
    const term = filter.search.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(writeCsvRow(HEADER)));
      for (const row of data ?? []) {
        controller.enqueue(
          encoder.encode(
            writeCsvRow([
              row.name,
              row.city,
              row.category,
              row.phone,
              row.whatsapp ?? "",
              row.status,
              row.created_at,
            ])
          )
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="prospects.csv"',
    },
  });
}
