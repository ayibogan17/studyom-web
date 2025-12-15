import * as React from "react";
import { cn } from "../../lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] shadow-sm transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
