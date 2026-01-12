import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import ProductionPageClient from "@/app/uretim/production-client";
import { getProducerListings } from "@/lib/producer-db";
import { productionRobots } from "@/lib/seo/productionIndexing";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "İstanbul müzik prodüksiyonu | Studyom",
  description:
    "İstanbul’da müzik prodüksiyonu hizmeti veren üreticileri burada bulabilirsin. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/muzik-produksiyonu",
  },
  robots: productionRobots(),
  openGraph: {
    title: "İstanbul müzik prodüksiyonu | Studyom",
    description:
      "İstanbul’da müzik prodüksiyonu hizmeti veren üreticileri burada bulabilirsin. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
    url: "https://www.studyom.net/istanbul/muzik-produksiyonu",
  },
};

export default async function IstanbulMusicProductionPage() {
  const producers = await getProducerListings();
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/istanbul/muzik-produksiyonu`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "İstanbul müzik prodüksiyonu",
    url: canonical,
    description:
      "İstanbul’da müzik prodüksiyonu hizmeti veren üreticileri listeler. Tür ve çalışma moduna göre filtreleyerek uygun seçenekleri görebilirsin.",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studyom", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Üretim", item: `${baseUrl}/uretim` },
      { "@type": "ListItem", position: 3, name: "İstanbul müzik prodüksiyonu", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Müzik prodüksiyonu hizmeti neleri kapsar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Aranje, kayıt, düzenleme ve genel prodüksiyon akışını kapsayabilir; kapsam üreticiye göre değişir.",
        },
      },
      {
        "@type": "Question",
        name: "Tür ve çalışma moduna göre filtreleyebilir miyim?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. Tür ve çalışma modu filtreleriyle sonuçları daraltabilirsin.",
        },
      },
      {
        "@type": "Question",
        name: "Online prodüksiyon mümkün mü?",
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
        defaultFilters={{ city: "İstanbul", areas: ["Müzik prodüksiyonu"] }}
        header={{
          label: "Üretim",
          title: "İstanbul müzik prodüksiyonu",
          description:
            "Bu sayfada İstanbul’da müzik prodüksiyonu hizmeti veren üreticileri listeliyoruz. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
        }}
        emptyState={{
          title: "Şu anda sınırlı sayıda sonuç var",
          description:
            "İstanbul’da müzik prodüksiyonu için listelenen üretici sayısı düşük olabilir. Mixing/mastering veya beat sayfalarına göz atabilir ya da üretici başvurusu yapabilirsin.",
          cta: { label: "İstanbul mixing & mastering", href: "/istanbul/mixing-mastering" },
          secondaryCta: { label: "Üretici olmak istiyorum", href: "/apply/producer" },
        }}
        lowSupplyNotice={{
          title: "Sınırlı sonuç",
          description:
            "Bu kategoride az sayıda üretici listeleniyor. Dilersen İstanbul mixing/mastering veya beat sayfasına geçebilirsin.",
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
              <Link href="/istanbul/aranjor" className="underline hover:text-[var(--color-primary)]">
                İstanbul aranjör
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Sık sorulan sorular</h2>
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Müzik prodüksiyonu hizmeti neleri kapsar?</p>
                <p>Aranje, kayıt ve düzenleme dahil olabilir; kapsam üreticiye göre değişir.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Tür ve çalışma moduna göre filtreleyebilir miyim?</p>
                <p>Tür ve çalışma modu filtreleriyle sonuçları daraltabilirsin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Online prodüksiyon mümkün mü?</p>
                <p>Bazı üreticiler online çalışır. Uygun profilleri filtrelerden görebilirsin.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Suspense>
  );
}
