import * as React from "react";
import { cn } from "../../lib/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
