import Link from "next/link";

type Studio = { id: number; name: string; city: string; price: string };

const studios: Studio[] = [
  { id: 1, name: "Kadıköy Prova", city: "İstanbul", price: "₺600/saat" },
  { id: 2, name: "Alsancak Sound", city: "İzmir",    price: "₺500/saat" },
];

export default function StudiosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Seçili stüdyolar
            </p>
            <h1 className="text-4xl font-bold text-gray-900">Stüdyolar</h1>
            <p className="text-lg text-gray-700">
              Prova ve kayıt için öne çıkan iki stüdyo. Yakında daha fazla şehir
              ve mekân eklenecek.
            </p>
          </div>
          <Link
            href="/#lead-form"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black/90"
          >
            Teklif al
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {studios.map((s) => (
            <article
              key={s.id}
              className="group flex h-full flex-col rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {s.name}
                  </h3>
                  <p className="text-sm text-gray-600">{s.city}</p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {s.price}
                </span>
              </div>

              <p className="mt-4 text-sm text-gray-700">
                Modern ekipman, akustik düzenlenmiş oda ve saatlik kullanım.
                Rezervasyon öncesi dilediğiniz gün/saat için bilgi alın.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Ekipman dahil
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Akustik hazır
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Toplu taşıma yakın
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  {s.price}
                </div>
                <Link
                  href="/#lead-form"
                  className="text-sm font-semibold text-black underline decoration-2 underline-offset-4 transition hover:text-orange-700"
                >
                  Bilgi al
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
