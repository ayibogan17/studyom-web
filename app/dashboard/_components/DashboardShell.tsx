"use client";

import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  status?: string | null;
};

export function DashboardShell({ children, status }: DashboardShellProps) {
  return (
    <main className="bg-[var(--color-secondary)]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10 space-y-6">
        {status ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-primary)] shadow-sm">
            {status}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  );
}
