import { Inbox } from "lucide-react";
import { Button } from "../../components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionClassName?: string;
};

export function EmptyState({ title, description, actionLabel, onAction, actionClassName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)]">
        <Inbox />
      </div>
      <p className="text-base font-semibold text-[var(--color-primary)]">{title}</p>
      {description ? <p className="max-w-md text-sm text-[var(--color-muted)]">{description}</p> : null}
      {actionLabel ? (
        <Button variant="primary" onClick={onAction} className={actionClassName}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
