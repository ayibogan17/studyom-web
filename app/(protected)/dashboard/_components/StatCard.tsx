"use client";

type StatCardProps = {
  title: string;
  value?: string;
  items?: string[];
  linkText?: string;
  onLinkClick?: () => void;
};

export function StatCard({ title, value, items, linkText, onLinkClick }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
      {value ? <p className="mt-2 text-4xl font-bold text-[var(--color-primary)]">{value}</p> : null}
      {items ? (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {linkText ? (
        <button
          type="button"
          onClick={onLinkClick}
          className="mt-2 text-xs font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          {linkText}
        </button>
      ) : null}
    </div>
  );
}
