"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { OAuthButtons } from "@/components/shared/OAuthButtons";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "En az 6 karakter"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "", remember: false },
  });

  const email = watch("email");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setStatus(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      callbackUrl: "/studyo",
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      setStatus("Giriş başarısız. Bilgileri kontrol edin.");
      return;
    }

    if (res?.url) {
      window.location.assign(res.url);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setStatus("Şifre sıfırlamak için e-posta girin.");
      return;
    }
    setLoading(true);
    setStatus("Şifre sıfırlama e-postası gönderiliyor...");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("Eğer kayıtlıysa, şifre sıfırlama e-postası gönderildi.");
      } else {
        setStatus(json.error || "Gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-secondary)] px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg md:p-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Kullanıcı Girişi
            </p>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyom hesabınla giriş yap</h1>
            <p className="text-sm text-[var(--color-muted)]">
              Müzisyenler, hocalar, teknisyenler ve stüdyo sahipleri burada.
            </p>
          </header>

          {status ? (
            <div className="mt-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
              {status}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-sm font-medium text-[var(--color-primary)]">
              Kullanıcı adı (mail)
              <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                <Mail size={16} className="text-[var(--color-muted)]" />
                <input
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                  placeholder="ornek@mail.com"
                  {...register("email")}
                />
              </div>
              {errors.email ? (
                <span className="mt-1 block text-xs text-[var(--color-danger)]">{errors.email.message}</span>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-[var(--color-primary)]">
              Şifre
              <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                <Lock size={16} className="text-[var(--color-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Şifre görünürlüğünü değiştir"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? (
                <span className="mt-1 block text-xs text-[var(--color-danger)]">{errors.password.message}</span>
              ) : null}
            </label>

            <label className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                {...register("remember")}
              />
              Beni hatırla
            </label>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-accent)]"
            >
              Şifremi hatırlamıyorum
            </button>
          </form>

          <Divider label="VEYA" />

          <OAuthButtons />

          <Divider label="VEYA" />

          <Link
            href="/signup"
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Üye Ol
          </Link>
        </div>
      </div>
    </main>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
      <span className="h-px w-full bg-[var(--color-border)]" />
      <span>{label}</span>
      <span className="h-px w-full bg-[var(--color-border)]" />
    </div>
  );
}
