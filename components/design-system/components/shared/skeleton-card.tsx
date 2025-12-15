export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]">
      <div className="h-40 w-full rounded-t-2xl bg-[var(--color-muted)]/30" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/2 rounded bg-[var(--color-muted)]/40" />
        <div className="h-3 w-1/3 rounded bg-[var(--color-muted)]/30" />
        <div className="h-8 w-full rounded bg-[var(--color-muted)]/20" />
      </div>
    </div>
  );
}
