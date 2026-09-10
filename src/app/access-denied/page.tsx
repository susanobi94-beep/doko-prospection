export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="max-w-sm text-center">
        <h1 className="mb-2 text-xl font-bold text-[var(--fg)]">Accès refusé</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Ce compte Google n&apos;est pas autorisé sur Doko Prospection. Contacte un administrateur
          pour être ajouté à l&apos;équipe.
        </p>
      </div>
    </main>
  );
}
