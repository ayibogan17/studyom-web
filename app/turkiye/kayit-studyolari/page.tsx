import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Türkiye kayıt stüdyoları | Studyom",
  description:
    "Türkiye genelinde kayıt stüdyosu arıyorsan doğru yerdesin. Kayıt kabini ve şehir tercihine göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/turkiye/kayit-studyolari",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Türkiye kayıt stüdyoları | Studyom",
    description:
      "Türkiye genelinde kayıt stüdyosu arıyorsan doğru yerdesin. Kayıt kabini ve şehir tercihine göre filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.",
    url: "https://www.studyom.net/turkiye/kayit-studyolari",
  },
};

export default async function TurkeyRecordingStudiosPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Türkiye kayıt stüdyoları
          </h1>
          <div className="max-w-2xl space-y-3 text-sm text-[var(--color-muted)] md:text-base">
            <p>
              Türkiye genelinde kayıt stüdyosu arıyorsan doğru yerdesin. Kayıt kabini ve şehir tercihine göre
              filtreleyip sana uygun stüdyoları hızlıca keşfedebilirsin.
            </p>
            <p>
              İstanbul, Ankara ve İzmir kayıt stüdyoları sayfalarından başlayarak şehrine göre doğru seçimi
              yapabilirsin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
            <Link href="/istanbul/kayit-studyosu" className="underline hover:text-[var(--color-primary)]">
              İstanbul kayıt stüdyoları
            </Link>
            <Link href="/ankara/kayit-studyosu" className="underline hover:text-[var(--color-primary)]">
              Ankara kayıt stüdyoları
            </Link>
            <Link href="/izmir/kayit-studyosu" className="underline hover:text-[var(--color-primary)]">
              İzmir kayıt stüdyoları
            </Link>
          </div>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "",
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
