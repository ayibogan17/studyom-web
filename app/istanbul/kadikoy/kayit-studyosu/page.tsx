import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Kadıköy kayıt stüdyoları | Studyom",
  description:
    "Kadıköy’de kayıt için stüdyo arıyorsan doğru yerdesin. İlçe ve kayıt kabini tercihlerine göre filtreleyip Studyom listelerinden uygun stüdyoları keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/kadikoy/kayit-studyosu",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Kadıköy kayıt stüdyoları | Studyom",
    description:
      "Kadıköy’de kayıt için stüdyo arıyorsan doğru yerdesin. İlçe ve kayıt kabini tercihlerine göre filtreleyip Studyom listelerinden uygun stüdyoları keşfedebilirsin.",
    url: "https://www.studyom.net/istanbul/kadikoy/kayit-studyosu",
  },
};

export default async function KadikoyRecordingStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Kadıköy kayıt stüdyoları
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Kadıköy’de kayıt için stüdyo arıyorsan doğru yerdesin. İlçe ve kayıt kabini tercihlerine göre filtreleyip
            Studyom listelerinden uygun stüdyoları keşfedebilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "istanbul",
            district: "kadikoy",
            roomType: "kayit-kabini",
            sort: "",
            happyHourOnly: false,
            advanced: {},
          }}
        />
      </Suspense>
    </div>
  );
}
