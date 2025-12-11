import Link from "next/link";

import { LeadForm } from "@/components/lead-form";

const highlights = [
  "Güncel fiyatlarla seçili stüdyolar",
  "İl/ilçe bazında arama ve filtre",
  "Kayıt, prova, ders için uygun alanlar",
  "Rezervasyon öncesi hızlı dönüş",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
            Müzisyenler için keşif ve rezervasyon
          </p>
          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Studyom ile dakikalar içinde stüdyo bul, randevu al.
          </h1>
          <p className="text-lg text-gray-700">
            Türkiye&apos;nin stüdyo platformu: güvenilir mekanlar, şeffaf
            fiyatlar, hızlı iletişim. Prova, kayıt veya ders için ihtiyacınıza
            uygun stüdyoyu seçin.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/studios"
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-black/90"
            >
              Stüdyoları Gör
            </Link>
            <Link
              href="/#lead-form"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:border-black hover:-translate-y-0.5"
            >
              Teklif Al
            </Link>
          </div>

          <ul className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          id="lead-form"
          className="rounded-3xl border border-orange-100 bg-white/80 p-4 shadow-xl backdrop-blur"
        >
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-4 sm:p-6">
            <div className="mb-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Teklif formu
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                Hemen iletişime geçelim
              </h2>
              <p className="text-sm text-gray-600">
                İhtiyacını yaz, aynı gün içinde uygun stüdyo ve fiyat
                alternatifleriyle dönüş yapalım.
              </p>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 rounded-3xl border border-black/5 bg-white/70 p-8 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Şeffaf fiyat",
              text: "Saatlik/ günlük ücretler ve ek ekipman bilgisi açıkça listelenir.",
            },
            {
              title: "Seçili stüdyolar",
              text: "Her stüdyo çalışma alanı, ekipman ve akustik açısından kontrol edilir.",
            },
            {
              title: "Hızlı rezervasyon",
              text: "Formu doldurun, detaylı bilgi ve uygun saatler hemen gelsin.",
            },
            {
              title: "Destek",
              text: "Sorularınız için info@studyom.net üzerinden yanınızdayız.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
