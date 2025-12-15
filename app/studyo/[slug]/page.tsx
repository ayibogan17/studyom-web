"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { BookingCalendar } from "@/components/design-system/components/shared/booking-calendar";
import { LeadForm } from "@/components/design-system/components/shared/lead-form";

type PageProps = {
  params: { slug: string };
};

export default function StudioDetailPage({ params }: PageProps) {
  const mock = useMemo(
    () => ({
      name: params.slug?.replace(/-/g, " ") || "Stüdyo",
      city: "İstanbul",
      district: "Kadıköy",
      price: "₺450/saat",
      images: [
        "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
      ],
      gear: ["Davul seti", "Mikrofon", "Amfi", "Kabin"],
      rules: ["Sigara içilmez", "Rezerve saatinde çıkış", "Ekipman hasarına karşı dikkat"],
    }),
    [params.slug],
  );

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="relative h-72 w-full overflow-hidden rounded-xl">
                <Image
                  src={mock.images[0]}
                  alt={mock.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {mock.images.slice(0, 3).map((img) => (
                  <div key={img} className="relative h-24 overflow-hidden rounded-xl">
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-[var(--color-primary)]">{mock.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-[var(--color-muted)]">
                <span>{mock.city}</span>
                <span>•</span>
                <span>{mock.district}</span>
                <Badge variant="muted">{mock.price}</Badge>
              </div>
            </div>
            <Card className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ekipman</p>
              <div className="flex flex-wrap gap-2">
                {mock.gear.map((g) => (
                  <Badge key={g} variant="muted">
                    {g}
                  </Badge>
                ))}
              </div>
            </Card>
            <Card className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Kurallar & İzinler</p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-muted)]">
                {mock.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="space-y-6">
            <BookingCalendar />
            <Card className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">İletişim</p>
              <LeadForm studioSlug={params.slug} />
            </Card>
          </div>
        </div>
      </Section>
    </main>
  );
}
