"use client";

import { Hero } from "@/components/design-system/components/shared/hero";
import { Section } from "@/components/design-system/components/shared/section";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { BookingCalendar } from "@/components/design-system/components/shared/booking-calendar";
import { LeadForm } from "@/components/design-system/components/shared/lead-form";
import { Card } from "@/components/design-system/components/ui/card";
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
            <p className="text-sm text-[var(--color-muted)]">Şehrine yakın, yüksek puanlı öneriler</p>
          </div>
          <Badge variant="outline">8 stüdyo</Badge>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((studio) => (
            <StudioCard key={studio.name} {...studio} />
          ))}
        </div>
      </Section>

      <Section className="bg-[var(--color-secondary)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Takvim (demo)</p>
            <BookingCalendar />
          </div>
          <Card className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Teklif Formu</p>
              <p className="text-sm text-[var(--color-muted)]">
                Talebini bırak, en kısa sürede dönüş yapalım.
              </p>
            </div>
            <LeadForm />
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Randevu Bul", text: "Şehrini ve oda türünü seç, uygun stüdyoları listele." },
            { title: "Odayı Seç", text: "Fiyat, ekipman ve konuma göre filtrele, detayları incele." },
            { title: "Kaydet/Öde", text: "Formu gönder, ekip uygun saatler ve fiyatla dönüş yapsın." },
          ].map((item) => (
            <Card key={item.title}>
              <p className="text-base font-semibold text-[var(--color-primary)]">{item.title}</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{item.text}</p>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
