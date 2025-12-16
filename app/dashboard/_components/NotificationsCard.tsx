"use client";

type NotificationsCardProps = {
  title: string;
  items: string[];
};

export function NotificationsCard({ title, items }: NotificationsCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
