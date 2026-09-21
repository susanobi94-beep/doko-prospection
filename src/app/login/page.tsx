"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type LoginState } from "@/server/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      >
        <div className="text-center">
          <h1 className="mb-1 text-2xl font-bold text-[var(--fg)]">Doko Prospection</h1>
          <p className="text-sm text-[var(--fg-muted)]">Suivi de la prospection boutiques</p>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-[var(--destructive)]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="w-full rounded-[6px] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] transition-colors duration-[120ms] ease-out hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
