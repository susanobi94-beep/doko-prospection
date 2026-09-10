"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <h1 className="mb-2 text-2xl font-bold text-[var(--fg)]">Doko Prospection</h1>
        <p className="mb-6 text-sm text-[var(--fg-muted)]">Suivi de la prospection boutiques</p>
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--primary-hover)]"
        >
          Se connecter avec Google
        </button>
      </div>
    </main>
  );
}
