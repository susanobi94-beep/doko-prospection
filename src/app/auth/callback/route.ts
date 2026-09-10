import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Étape 2 : vérification de l'allowlist inline. L'étape 3 extrait cette logique dans
// requireActiveStaff() (src/server/staff.ts) pour la réutiliser sur tout (dashboard).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: staffRow } = await supabase
    .from("staff")
    .select("active")
    .eq("id", user.id)
    .single();

  if (!staffRow || !staffRow.active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/access-denied`);
  }

  return NextResponse.redirect(`${origin}/prospects`);
}
