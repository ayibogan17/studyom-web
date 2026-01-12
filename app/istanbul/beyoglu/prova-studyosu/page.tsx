import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Beyoğlu prova stüdyoları | Studyom",
  description:
    "Beyoğlu’nda prova için stüdyo arıyorsan doğru yerdesin. İlçe, oda türü ve ihtiyaçlarına göre filtreleyip Studyom listelerinden uygun stüdyoları keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/beyoglu/prova-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Beyoğlu prova stüdyoları | Studyom",
    description:
      "Beyoğlu’nda prova için stüdyo arıyorsan doğru yerdesin. İlçe, oda türü ve ihtiyaçlarına göre filtreleyip Studyom listelerinden uygun stüdyoları keşfedebilirsin.",
    url: "https://www.studyom.net/istanbul/beyoglu/prova-studyosu",
  },
};

export default async function BeyogluRehearsalStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Beyoğlu prova stüdyoları
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Beyoğlu’nda prova için stüdyo arıyorsan doğru yerdesin. İlçe, oda türü ve ihtiyaçlarına göre filtreleyip
            Studyom listelerinden uygun stüdyoları keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "istanbul",
            district: "beyoglu",
            roomType: "prova-odasi",
            sort: "",
            happyHourOnly: false,
            advanced: {},
          }}
        />
      </Suspense>
    </div>
  );
}
