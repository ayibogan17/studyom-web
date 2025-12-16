"use client";

import { Chrome } from "lucide-react";
import { signIn } from "next-auth/react";
import clsx from "clsx";

type OAuthButtonsProps = {
  provider?: string;
  label?: string;
  callbackUrl?: string;
  className?: string;
};

export function OAuthButtons({
  provider = "google",
  label = "Google ile giriş yap",
  callbackUrl = "/dashboard",
  className,
}: OAuthButtonsProps) {
  return (
    <button
      type="button"
      onClick={() => signIn(provider, { callbackUrl })}
      className={clsx(
        "flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        className,
      )}
    >
      <Chrome size={16} />
      {label}
    </button>
  );
}
