"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = token && email && password.length >= 8 && password === confirm;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Şifre güncellenemedi.");
        return;
      }
      setStatus("Şifren güncellendi. Giriş yapabilirsin.");
    } catch (err) {
      console.error(err);
      setStatus("Şifre güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-secondary)] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--color-primary)]">Şifre Sıfırlama</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Yeni şifreni belirle.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)]">E-posta</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-muted)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)]">Yeni şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)]">Şifreyi doğrula</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="flex h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>

        {status ? <p className="mt-3 text-xs text-[var(--color-primary)]">{status}</p> : null}
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)]">
          Giriş sayfasına dön
        </Link>
      </div>
    </main>
  );
}
