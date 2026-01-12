import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Ankara prova stüdyoları | Studyom",
  description:
    "Ankara’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip sana uygun prova stüdyolarını hızlıca keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/ankara/prova-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Ankara prova stüdyoları | Studyom",
    description:
      "Ankara’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip sana uygun prova stüdyolarını hızlıca keşfedebilirsin.",
    url: "https://www.studyom.net/ankara/prova-studyosu",
  },
};

export default async function AnkaraRehearsalStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Ankara prova stüdyoları
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Ankara’da prova için stüdyo arıyorsan doğru yerdesin. Konum ve ekipmana göre filtreleyip sana uygun prova
            stüdyolarını hızlıca keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "ankara",
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
