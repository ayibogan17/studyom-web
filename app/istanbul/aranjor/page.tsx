import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import ProductionPageClient from "@/app/uretim/production-client";
import { getProducerListings } from "@/lib/producer-db";
import { productionRobots } from "@/lib/seo/productionIndexing";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "İstanbul aranjör | Studyom",
  description:
    "İstanbul’da aranje hizmeti veren üreticileri burada bulabilirsin. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/aranjor",
  },
  robots: productionRobots(),
  openGraph: {
    title: "İstanbul aranjör | Studyom",
    description:
      "İstanbul’da aranje hizmeti veren üreticileri burada bulabilirsin. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
    url: "https://www.studyom.net/istanbul/aranjor",
  },
};

export default async function IstanbulArrangerPage() {
  const producers = await getProducerListings();
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/istanbul/aranjor`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "İstanbul aranjör",
    url: canonical,
    description:
      "İstanbul’da aranje hizmeti veren üreticileri listeler. Tür ve çalışma moduna göre filtreleyerek uygun seçenekleri görebilirsin.",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studyom", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Üretim", item: `${baseUrl}/uretim` },
      { "@type": "ListItem", position: 3, name: "İstanbul aranjör", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Aranje hizmeti hangi işleri kapsar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Şarkı düzeni, enstrüman seçimi ve prodüksiyon akışı gibi başlıkları kapsayabilir.",
        },
      },
      {
        "@type": "Question",
        name: "Tür ve çalışma moduna göre filtreleme yapabilir miyim?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. Tür ve çalışma modu filtreleriyle sonuçları daraltabilirsin.",
        },
      },
      {
        "@type": "Question",
        name: "Online aranje çalışması mümkün mü?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bazı üreticiler online çalışır. Uygun profilleri filtrelerden görebilirsin.",
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
        defaultFilters={{ city: "İstanbul", areas: ["Aranje"] }}
        header={{
          label: "Üretim",
          title: "İstanbul aranjör",
          description:
            "Bu sayfada İstanbul’da aranje hizmeti veren üreticileri listeliyoruz. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
        }}
        emptyState={{
          title: "Şu anda sınırlı sayıda sonuç var",
          description:
            "İstanbul’da aranje hizmeti sunan üretici sayısı düşük olabilir. Müzik prodüksiyonu veya mixing/mastering sayfalarına göz atabilir ya da üretici başvurusu yapabilirsin.",
          cta: { label: "İstanbul müzik prodüksiyonu", href: "/istanbul/muzik-produksiyonu" },
          secondaryCta: { label: "Üretici olmak istiyorum", href: "/apply/producer" },
        }}
        lowSupplyNotice={{
          title: "Sınırlı sonuç",
          description:
            "Bu kategoride az sayıda üretici listeleniyor. Dilersen İstanbul müzik prodüksiyonu veya mixing/mastering sayfasına geçebilirsin.",
          cta: { label: "İstanbul mixing & mastering", href: "/istanbul/mixing-mastering" },
        }}
      />
      <Section className="pt-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Diğer üretim hizmetleri
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
              <Link href="/istanbul/mixing-mastering" className="underline hover:text-[var(--color-primary)]">
                İstanbul mixing & mastering
              </Link>
              <Link href="/online/mixing-mastering" className="underline hover:text-[var(--color-primary)]">
                Online mixing & mastering
              </Link>
              <Link href="/istanbul/beat-yapimi" className="underline hover:text-[var(--color-primary)]">
                İstanbul beat yapımı
              </Link>
              <Link href="/rap-hiphop/beat-yapimi" className="underline hover:text-[var(--color-primary)]">
                Rap / Hip-hop beat yapımı
              </Link>
              <Link href="/istanbul/muzik-produksiyonu" className="underline hover:text-[var(--color-primary)]">
                İstanbul müzik prodüksiyonu
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Sık sorulan sorular</h2>
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Aranje hizmeti hangi işleri kapsar?</p>
                <p>Şarkı düzeni, enstrüman seçimi ve prodüksiyon akışı gibi başlıkları kapsayabilir.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Tür ve çalışma moduna göre filtreleme yapabilir miyim?</p>
                <p>Tür ve çalışma modu filtreleriyle sonuçları daraltabilirsin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Online aranje çalışması mümkün mü?</p>
                <p>Bazı üreticiler online çalışır. Uygun profilleri filtrelerden görebilirsin.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Suspense>
  );
}
