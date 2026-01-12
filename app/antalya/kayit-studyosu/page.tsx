import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Antalya kayıt stüdyoları | Studyom",
  description:
    "Antalya’da kayıt için stüdyo arıyorsan doğru yerdesin. Kayıt kabini, ekipman ve konuma göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/antalya/kayit-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Antalya kayıt stüdyoları | Studyom",
    description:
      "Antalya’da kayıt için stüdyo arıyorsan doğru yerdesin. Kayıt kabini, ekipman ve konuma göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
    url: "https://www.studyom.net/antalya/kayit-studyosu",
  },
};

export default async function AntalyaRecordingStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Antalya kayıt stüdyoları
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Antalya’da kayıt için stüdyo arıyorsan doğru yerdesin. Kayıt kabini, ekipman ve konuma göre filtreleyip sana
            uygun stüdyoları hızlıca keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "antalya",
            roomType: "kayit-kabini",
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
