import * as React from "react";
import { cn } from "../../lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] shadow-sm transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
