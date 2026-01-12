import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import ProductionPageClient from "@/app/uretim/production-client";
import { getProducerListings } from "@/lib/producer-db";
import { productionRobots } from "@/lib/seo/productionIndexing";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Rap / Hip-hop beat yapımı | Studyom",
  description:
    "Rap / hip-hop tarzında beat yapımı hizmeti veren üreticileri burada bulabilirsin. Tür filtreleriyle aradığın sound’a yakın üreticilere ulaşabilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/rap-hiphop/beat-yapimi",
  },
  robots: productionRobots(),
  openGraph: {
    title: "Rap / Hip-hop beat yapımı | Studyom",
    description:
      "Rap / hip-hop tarzında beat yapımı hizmeti veren üreticileri burada bulabilirsin. Tür filtreleriyle aradığın sound’a yakın üreticilere ulaşabilirsin.",
    url: "https://www.studyom.net/rap-hiphop/beat-yapimi",
  },
};

export default async function RapHipHopBeatMakingPage() {
  const producers = await getProducerListings();
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/rap-hiphop/beat-yapimi`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Rap / Hip-hop beat yapımı",
    url: canonical,
    description:
      "Rap / hip-hop odaklı beat yapımı hizmeti veren üreticileri listeler. Tür filtreleriyle sonuçları daraltabilirsin.",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studyom", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Üretim", item: `${baseUrl}/uretim` },
      { "@type": "ListItem", position: 3, name: "Rap / Hip-hop beat yapımı", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Beat yapımı süreci nasıl ilerler?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "İhtiyacın anlatılır, üretici taslak beat hazırlar ve geri bildirime göre revizyon yapılır.",
        },
      },
      {
        "@type": "Question",
        name: "Stems / trackout alabilir miyim?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Stems/trackout desteği üreticiye göre değişir; detayları üreticiyle netleştirebilirsin.",
        },
      },
      {
        "@type": "Question",
        name: "Online çalışma mümkün mü?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Birçok üretici online çalışır. Filtrelerden çalışma modunu seçebilirsin.",
        },
      },
    ],
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <ProductionPageClient
        initialProducers={producers}
        defaultFilters={{ areas: ["Beat yapımı"], genres: ["Hip-hop / Rap"] }}
        header={{
          label: "Üretim",
          title: "Rap / Hip-hop beat yapımı",
          description:
            "Bu sayfada rap / hip-hop odaklı beat yapımı hizmeti veren üreticileri listeliyoruz. Filtrelerle tür ve çalışma moduna göre sonuçları daraltabilirsin.",
        }}
        emptyState={{
          title: "Şu anda sınırlı sayıda sonuç var",
          description:
            "Rap / hip-hop odaklı beat üreticisi sayısı düşük olabilir. İstanbul sayfasına göz atabilir veya üretici başvurusu yapabilirsin.",
          cta: { label: "İstanbul beat yapımı", href: "/istanbul/beat-yapimi" },
          secondaryCta: { label: "Üretici olmak istiyorum", href: "/apply/producer" },
        }}
        lowSupplyNotice={{
          title: "Sınırlı sonuç",
          description:
            "Bu kategoride az sayıda üretici listeleniyor. İstanbul beat yapımı sayfasına geçebilirsin.",
          cta: { label: "İstanbul beat yapımı", href: "/istanbul/beat-yapimi" },
        }}
      />
      <Section className="pt-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Diğer üretim hizmetleri
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
              <Link href="/istanbul/beat-yapimi" className="underline hover:text-[var(--color-primary)]">
                İstanbul beat yapımı
              </Link>
              <Link href="/istanbul/mixing-mastering" className="underline hover:text-[var(--color-primary)]">
                İstanbul mixing & mastering
              </Link>
              <Link href="/online/mixing-mastering" className="underline hover:text-[var(--color-primary)]">
                Online mixing & mastering
              </Link>
              <Link href="/istanbul/muzik-produksiyonu" className="underline hover:text-[var(--color-primary)]">
                İstanbul müzik prodüksiyonu
              </Link>
              <Link href="/istanbul/aranjor" className="underline hover:text-[var(--color-primary)]">
                İstanbul aranjör
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Sık sorulan sorular</h2>
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Beat yapımı süreci nasıl ilerler?</p>
                <p>İhtiyacın anlatılır, üretici taslak beat hazırlar ve geri bildirime göre revizyon yapılır.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Stems / trackout alabilir miyim?</p>
                <p>Stems/trackout desteği üreticiye göre değişir; detayları üreticiyle netleştirebilirsin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Online çalışma mümkün mü?</p>
                <p>Birçok üretici online çalışır. Filtrelerden çalışma modunu seçebilirsin.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Suspense>
  );
}
