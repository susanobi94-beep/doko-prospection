import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll() appelé depuis un Server Component (pas une Server Action ni une
          // Route Handler) : écriture de cookie refusée par Next.js, sans conséquence
          // ici car proxy.ts (étape 2) rafraîchit déjà la session à chaque requête.
        }
      },
    },
  });
}
