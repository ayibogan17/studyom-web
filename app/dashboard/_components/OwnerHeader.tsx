"use client";

import { SignOutButton } from "@/components/sign-out-button";

type OwnerHeaderProps = {
  displayName?: string | null;
  email?: string | null;
};

export function OwnerHeader({ displayName, email }: OwnerHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
          Hoş geldin{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Flutter panelindeki akışın web uyarlaması. Slotları düzenleyebilir, kurs aç/kapa yapabilir ve açılış saatlerini görebilirsin. Veriler demo/moktur.
        </p>
        {email && (
          <p className="text-xs text-[var(--color-muted)]">
            Giriş yaptığın e-posta: <span className="font-semibold text-[var(--color-primary)]">{email}</span>
          </p>
        )}
      </div>
      <SignOutButton />
    </header>
  );
}
