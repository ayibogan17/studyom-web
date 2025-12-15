"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        className: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg",
      }}
    />
  );
}
