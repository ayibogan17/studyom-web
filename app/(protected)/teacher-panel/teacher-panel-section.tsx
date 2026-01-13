"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { cn } from "@/components/design-system/lib/cn";

type Props = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function TeacherPanelSection({ title, description, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="p-5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
          {description ? <p className="text-xs text-[var(--color-muted)]">{description}</p> : null}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-[var(--color-muted)] transition", open ? "rotate-180" : "")}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-4 space-y-4">{children}</div> : null}
    </Card>
  );
}
