import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-[var(--fg)]">Accès refusé ou suspendu</h1>
        <p className="mb-6 text-sm text-[var(--fg-muted)]">
          Votre compte n&apos;est pas autorisé ou a été désactivé par un administrateur sur Doko Prospection.
          Veuillez contacter votre responsable pour toute question.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          Retour à la page de connexion
        </Link>
      </div>
    </main>
  );
}
