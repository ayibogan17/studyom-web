"use client";

import { Hero } from "@/components/design-system/components/shared/hero";
import { Section } from "@/components/design-system/components/shared/section";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { Badge } from "@/components/design-system/components/ui/badge";

const featured = Array.from({ length: 8 }).map((_, i) => ({
  name: `Örnek Stüdyo ${i + 1}`,
  city: "İstanbul",
  district: "Kadıköy",
  price: "₺450/saat",
  badges: ["Davul Seti", "Mikrofon", "Amfi"],
}));

export default function Home() {
  return (
    <main className="bg-[var(--color-secondary)]">
      <Hero
        title="Şehrindeki prova ve kayıt stüdyoları tek platformda"
        subtitle="Güvenilir stüdyolar, şeffaf fiyatlar, hızlı iletişim. Prova, kayıt veya ders için ihtiyacına göre filtrele."
      />

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Öne çıkan stüdyolar</p>
          </div>
          <Badge variant="outline">8 stüdyo</Badge>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((studio) => (
            <StudioCard key={studio.name} {...studio} />
          ))}
        </div>
      </Section>

    </main>
  );
}
