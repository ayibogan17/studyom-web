"use client";

type QuickShareCardProps = {
  title: string;
  helper?: string;
  cta: string;
  onCopy: () => void;
};

export function QuickShareCard({ title, helper, cta, onCopy }: QuickShareCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
      {helper ? <p className="mt-2 text-sm text-[var(--color-muted)]">{helper}</p> : null}
      <button
        type="button"
        onClick={onCopy}
        className="mt-3 w-full rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
      >
        {cta}
      </button>
    </div>
  );
}
