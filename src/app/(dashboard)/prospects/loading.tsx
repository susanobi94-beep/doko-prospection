export default function ProspectsLoading() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-[6px] bg-[var(--border)]" />
      ))}
    </div>
  );
}
