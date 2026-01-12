import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Türkiye vokal kabinleri | Studyom",
  description:
    "Türkiye genelinde vokal kabini arıyorsan doğru yerdesin. Şehir ve ekipman tercihlerine göre filtreleyip sana uygun vokal kabinlerini hızlıca bulabilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/turkiye/vokal-kabinleri",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Türkiye vokal kabinleri | Studyom",
    description:
      "Türkiye genelinde vokal kabini arıyorsan doğru yerdesin. Şehir ve ekipman tercihlerine göre filtreleyip sana uygun vokal kabinlerini hızlıca bulabilirsin.",
    url: "https://www.studyom.net/turkiye/vokal-kabinleri",
  },
};

export default async function TurkeyVocalCabinsPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Türkiye vokal kabinleri
          </h1>
          <div className="max-w-2xl space-y-3 text-sm text-[var(--color-muted)] md:text-base">
            <p>
              Türkiye genelinde vokal kabini arıyorsan doğru yerdesin. Şehir ve ekipman tercihlerine göre filtreleyip
              sana uygun vokal kabinlerini hızlıca bulabilirsin.
            </p>
            <p>
              İstanbul, Ankara ve İzmir vokal kabini sayfalarına göz atarak bulunduğun şehre uygun seçenekleri
              keşfedebilirsin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
            <Link href="/istanbul/vokal-kabini" className="underline hover:text-[var(--color-primary)]">
              İstanbul vokal kabini
            </Link>
            <Link href="/ankara/vokal-kabini" className="underline hover:text-[var(--color-primary)]">
              Ankara vokal kabini
            </Link>
            <Link href="/izmir/vokal-kabini" className="underline hover:text-[var(--color-primary)]">
              İzmir vokal kabini
            </Link>
          </div>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "",
            roomType: "vokal-kabini",
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
