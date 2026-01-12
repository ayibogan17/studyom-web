import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Türkiye prova stüdyoları | Studyom",
  description:
    "Türkiye genelinde prova stüdyosu arıyorsan doğru yerdesin. Şehir ve oda türüne göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/turkiye/prova-studyolari",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Türkiye prova stüdyoları | Studyom",
    description:
      "Türkiye genelinde prova stüdyosu arıyorsan doğru yerdesin. Şehir ve oda türüne göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
    url: "https://www.studyom.net/turkiye/prova-studyolari",
  },
};

export default async function TurkeyRehearsalStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Türkiye prova stüdyoları
          </h1>
          <div className="max-w-2xl space-y-3 text-sm text-[var(--color-muted)] md:text-base">
            <p>
              Türkiye genelinde prova stüdyosu arıyorsan doğru yerdesin. Şehir ve oda türüne göre filtreleyip sana uygun
              stüdyoları hızlıca keşfedebilirsin.
            </p>
            <p>
              İstanbul, Ankara ve İzmir için özel sayfalardan başlayabilir veya listeden dilediğin şehri seçerek devam
              edebilirsin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
            <Link href="/istanbul/prova-studyosu" className="underline hover:text-[var(--color-primary)]">
              İstanbul prova stüdyoları
            </Link>
            <Link href="/ankara/prova-studyosu" className="underline hover:text-[var(--color-primary)]">
              Ankara prova stüdyoları
            </Link>
            <Link href="/izmir/prova-studyosu" className="underline hover:text-[var(--color-primary)]">
              İzmir prova stüdyoları
            </Link>
          </div>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "",
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
