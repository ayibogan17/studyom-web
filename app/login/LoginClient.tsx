"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

const Divider = () => (
  <div className="relative my-6 flex items-center">
    <span className="h-px w-full bg-white/15" />
    <span className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      veya
    </span>
    <span className="h-px w-full bg-white/15" />
  </div>
);

export default function LoginClient() {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!userEmail || !userPassword) {
      setStatus("E-posta ve şifre girin");
      return;
    }
    setStatus("Giriş yapılıyor...");
    const res = await signIn("credentials", {
      email: userEmail,
      password: userPassword,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    if (res?.error) {
      setStatus("Giriş başarısız. Bilgileri kontrol edin.");
    } else {
      setStatus(null);
      window.location.assign(res?.url || "/");
    }
  };

  const handleReset = async (email: string) => {
    if (!email) {
      setStatus("E-posta girin");
      return;
    }
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
        setStatus(json.error || "Gönderilemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Gönderilemedi");
    }
  };

  return (
    <main className="min-h-screen bg-[#2C2C2C]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-[#262626] p-8 shadow-sm backdrop-blur">
          <header className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Kullanıcı girişi
            </p>
            <h1 className="text-2xl font-bold text-white">Studyom hesabınla giriş yap</h1>
            <p className="text-sm text-gray-200">
              Rezervasyonlarını yönetmek ve stüdyo aramak için giriş yap.
            </p>
          </header>

          {status && (
            <div className="mb-4 rounded-xl border border-[#2D9CDB]/30 bg-[#2D9CDB]/10 px-4 py-3 text-sm text-[#2D9CDB]">
              {status}
            </div>
          )}

          <form className="space-y-4">
            <label className="block text-sm font-semibold text-white">
              Kullanıcı adı (mail)
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="ornek@mail.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-white">
              Şifre
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="••••••••"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLogin}
                className="w-full rounded-xl bg-[#2D9CDB] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => handleReset(userEmail)}
                className="w-full rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
              >
                Şifremi hatırlamıyorum
              </button>
            </div>
          </form>

          <Divider />

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
          >
            Google ile giriş yap
          </button>

          <Divider />

          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
          >
            Üye Ol
          </Link>
        </section>
      </div>
    </main>
  );
}
