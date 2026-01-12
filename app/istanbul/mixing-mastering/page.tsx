import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import ProductionPageClient from "@/app/uretim/production-client";
import { getProducerListings } from "@/lib/producer-db";
import { productionRobots } from "@/lib/seo/productionIndexing";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "İstanbul mixing & mastering | Studyom",
  description:
    "İstanbul’da mixing & mastering hizmeti veren üreticileri burada bulabilirsin. Stüdyo tabanlı veya online seçenekler arasından ihtiyacına uygun olanı seçebilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/istanbul/mixing-mastering",
  },
  robots: productionRobots(),
  openGraph: {
    title: "İstanbul mixing & mastering | Studyom",
    description:
      "İstanbul’da mixing & mastering hizmeti veren üreticileri burada bulabilirsin. Stüdyo tabanlı veya online seçenekler arasından ihtiyacına uygun olanı seçebilirsin.",
    url: "https://www.studyom.net/istanbul/mixing-mastering",
  },
};

export default async function IstanbulMixingMasteringPage() {
  const producers = await getProducerListings();
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/istanbul/mixing-mastering`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "İstanbul mixing & mastering hizmetleri",
    url: canonical,
    description:
      "İstanbul’da mixing & mastering hizmeti veren üreticileri listeler. Tür ve çalışma moduna göre filtreleyerek ihtiyacına uygun seçenekleri görebilirsin.",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studyom", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Üretim", item: `${baseUrl}/uretim` },
      { "@type": "ListItem", position: 3, name: "İstanbul mixing & mastering", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Mixing ve mastering farkı nedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mixing, çoklu kayıtların dengelenmesi ve düzenlenmesi sürecidir. Mastering ise parçanın son hâlini yayın öncesi seviyelendirme ve tutarlılık için optimize eder.",
        },
      },
      {
        "@type": "Question",
        name: "Online mastering nasıl çalışır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Dosyalarını üreticiye iletir, geri bildirim ve revizyonları online olarak takip edersin. Teslimler dijital olarak yapılır.",
        },
      },
      {
        "@type": "Question",
        name: "Teslim süresi ve revizyon nasıl olur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Teslim süresi üreticiye göre değişir. Genelde kısa bir revizyon turu sunulur; ayrıntılar için üreticiyle görüşebilirsin.",
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
        defaultFilters={{ city: "İstanbul", areas: ["Mixing", "Mastering"] }}
        header={{
          label: "Üretim",
          title: "İstanbul mixing & mastering hizmetleri",
          description:
            "Bu sayfada mixing & mastering hizmeti sunan üreticileri listeliyoruz. İstanbul’da stüdyo tabanlı çalışmak isteyenler ve online teslim isteyenler için seçenekler bulunur.",
        }}
        emptyState={{
          title: "Şu anda sınırlı sayıda sonuç var",
          description:
            "İstanbul’da bu hizmeti sunan üretici sayısı düşük olabilir. Online mixing & mastering sayfasına göz atabilir veya üretici başvurusu yapabilirsin.",
          cta: { label: "Online mixing & mastering", href: "/online/mixing-mastering" },
          secondaryCta: { label: "Üretici olmak istiyorum", href: "/apply/producer" },
        }}
        lowSupplyNotice={{
          title: "Sınırlı sonuç",
          description:
            "Bu kategoride az sayıda üretici listeleniyor. Dilersen online mixing & mastering sayfasına geçebilirsin.",
          cta: { label: "Online mixing & mastering", href: "/online/mixing-mastering" },
        }}
      />
      <Section className="pt-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Diğer üretim hizmetleri
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
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
              <Link href="/istanbul/aranjor" className="underline hover:text-[var(--color-primary)]">
                İstanbul aranjör
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Sık sorulan sorular</h2>
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Mixing ve mastering farkı nedir?</p>
                <p>
                  Mixing, çoklu kayıtların dengelenmesi ve düzenlenmesi sürecidir. Mastering ise parçanın son hâlini
                  yayın öncesi seviyelendirme ve tutarlılık için optimize eder.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Online mastering nasıl çalışır?</p>
                <p>Dosyalarını üreticiye iletir, geri bildirim ve revizyonları online takip edersin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Teslim süresi ve revizyon nasıl olur?</p>
                <p>Teslim süresi üreticiye göre değişir; revizyon detaylarını üreticiyle netleştirebilirsin.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Suspense>
  );
}
