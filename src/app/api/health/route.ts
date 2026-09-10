import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(5000),
    });

    // PostgREST répond toujours (200 avec le schéma OpenAPI, ou au pire 401/404 selon la
    // configuration) tant que le projet est joignable et la clé bien formée. Seule une
    // panne réseau réelle (DNS, timeout, projet en pause) lève une exception ici.
    if (res.status >= 500) {
      return NextResponse.json({ ok: false, error: "database unreachable" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "database unreachable" }, { status: 500 });
  }
}
