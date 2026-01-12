import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Konya prova stüdyoları | Studyom",
  description:
    "Konya’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip Studyom listelerinden sana uygun prova stüdyolarını hızlıca keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/konya/prova-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Konya prova stüdyoları | Studyom",
    description:
      "Konya’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip Studyom listelerinden sana uygun prova stüdyolarını hızlıca keşfedebilirsin.",
    url: "https://www.studyom.net/konya/prova-studyosu",
  },
};

export default async function KonyaRehearsalStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">Konya prova stüdyoları</h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Konya’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip Studyom listelerinden
            sana uygun prova stüdyolarını hızlıca keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "konya",
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
