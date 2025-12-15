import { cn } from "../../lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "outline" | "muted";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition";
  const styles = {
    default: "bg-[var(--color-accent)] text-white",
    outline: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]",
    muted: "bg-[var(--color-secondary)] text-[var(--color-primary)]",
  }[variant];
  return <span className={cn(base, styles, className)}>{children}</span>;
}
