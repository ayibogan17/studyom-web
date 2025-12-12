import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white">
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
                Stüdyo paneli
              </p>
              <h1 className="text-3xl font-bold text-gray-900">
                Hoş geldin{user?.name ? `, ${user.name}` : ""}!
              </h1>
              <p className="text-sm text-gray-600">
                Yakında burada stüdyo bilgilerini düzenleyip talepleri
                yönetebileceksin. Şimdilik girişini doğruladık.
              </p>
              {user?.email && (
                <p className="text-sm text-gray-700">
                  Giriş yaptığın e-posta:{" "}
                  <span className="font-semibold">{user.email}</span>
                </p>
              )}
            </div>
            <SignOutButton />
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 p-4 text-sm text-gray-800">
            <p className="font-semibold text-orange-900">Sıradaki adımlar</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Stüdyo profilini oluşturma ve ekipman bilgisi ekleme</li>
              <li>Rezervasyon talebi listesi ve hızlı yanıt butonları</li>
              <li>Şehir/ilçe bazlı filtre ve fiyat düzenleme</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
