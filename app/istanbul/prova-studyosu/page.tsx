import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "İstanbul prova stüdyoları | Studyom",
  description:
    "İstanbul’da prova için stüdyo arıyorsan doğru yerdesin. Stüdyo Bul üzerinden ekipman ve konumuna göre filtreleyip sana uygun prova stüdyolarını keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/prova-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "İstanbul prova stüdyoları | Studyom",
    description:
      "İstanbul’da prova için stüdyo arıyorsan doğru yerdesin. Stüdyo Bul üzerinden ekipman ve konumuna göre filtreleyip sana uygun prova stüdyolarını keşfedebilirsin.",
    url: "https://www.studyom.net/istanbul/prova-studyosu",
  },
};

export default async function IstanbulRehearsalStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            İstanbul prova stüdyoları
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            İstanbul’da prova için stüdyo arıyorsan doğru yerdesin. Stüdyo Bul üzerinden ekipman ve konumuna göre
            filtreleyip sana uygun prova stüdyolarını hızlıca keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "istanbul",
            roomType: "prova-odasi",
            district: "",
            sort: "",
            happyHourOnly: false,
            advanced: {},
          }}
        />
      </Suspense>
    </div>
  );
}
