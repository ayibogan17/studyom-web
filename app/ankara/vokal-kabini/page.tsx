import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "@/app/studyo/studyo-client";
import { Section } from "@/components/design-system/components/shared/section";
import { getStudyoServerStudios } from "@/app/studyo/studyo-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Ankara vokal kabini | Studyom",
  description:
    "Ankara’da vokal kabini arıyorsan doğru yerdesin. Konum ve ekipman tercihlerine göre filtreleyip sana uygun vokal kabinlerini hızlıca bulabilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/ankara/vokal-kabini",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Ankara vokal kabini | Studyom",
    description:
      "Ankara’da vokal kabini arıyorsan doğru yerdesin. Konum ve ekipman tercihlerine göre filtreleyip sana uygun vokal kabinlerini hızlıca bulabilirsin.",
    url: "https://www.studyom.net/ankara/vokal-kabini",
  },
};

export default async function AnkaraVocalCabinPage() {
  const serverStudios = await getStudyoServerStudios(null);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <Section className="pt-8 md:pt-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Studyom</p>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">
            Ankara vokal kabini
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)] md:text-base">
            Ankara’da vokal kabini arıyorsan doğru yerdesin. Konum ve ekipman tercihlerine göre filtreleyip sana uygun
            vokal kabinlerini hızlıca bulabilirsin.
          </p>
        </div>
      </Section>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
        <StudyoClientPage
          serverStudios={serverStudios}
          defaultFilters={{
            province: "ankara",
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
