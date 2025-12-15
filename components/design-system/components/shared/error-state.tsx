import { AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
        <AlertTriangle />
      </div>
      <p className="text-base font-semibold text-[var(--color-primary)]">{title}</p>
      {description ? <p className="max-w-md text-sm text-[var(--color-muted)]">{description}</p> : null}
      {onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          Tekrar dene
        </Button>
      ) : null}
    </div>
  );
}
