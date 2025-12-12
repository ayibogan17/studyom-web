import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { SignInButton } from "@/components/sign-in-button";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <section className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
            Stüdyo sahipleri
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel girişini Google ile yapın
          </h1>
          <p className="text-sm text-gray-600">
            Google hesabınızla giriş yaparak stüdyo bilgilerinizi yönetebilir ve
            rezervasyon taleplerini takip edebilirsiniz.
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white/80 p-6 shadow-md backdrop-blur">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Google ile devam et
            </h2>
            <p className="text-sm text-gray-600">
              Tek tıkla giriş yapın, ek parola gerekmez.
            </p>
          </div>
          <div className="mt-6">
            <SignInButton callbackUrl="/dashboard" />
          </div>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold text-black underline decoration-2 underline-offset-4 transition hover:text-orange-700"
        >
          ← Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
