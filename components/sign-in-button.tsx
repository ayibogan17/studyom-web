"use client";

import { signIn } from "next-auth/react";

type Props = {
  callbackUrl?: string;
};

export function SignInButton({ callbackUrl = "/dashboard" }: Props) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black/90"
    >
      Google ile giriş
    </button>
  );
}
