import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  containerClassName?: string;
};

export function Section({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-8 md:py-12", className)} {...props}>
      <div className={cn("mx-auto max-w-7xl px-6", containerClassName)}>{children}</div>
    </section>
  );
}
