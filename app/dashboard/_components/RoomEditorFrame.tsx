"use client";

import type { ReactNode } from "react";

type RoomEditorFrameProps = {
  title: string;
  children: ReactNode;
};

export function RoomEditorFrame({ title, children }: RoomEditorFrameProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
