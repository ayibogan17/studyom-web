import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import ProductionPageClient from "@/app/uretim/production-client";
import { getProducerListings } from "@/lib/producer-db";
import { productionRobots } from "@/lib/seo/productionIndexing";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Online mixing & mastering | Studyom",
  description:
    "Online mixing & mastering hizmeti veren üreticileri burada bulabilirsin. Uzaktan çalışma modeliyle şehir bağımsız şekilde üretim yapabilirsin.",
  alternates: {
    canonical: "https://www.studyom.net/online/mixing-mastering",
  },
  robots: productionRobots(),
  openGraph: {
    title: "Online mixing & mastering | Studyom",
    description:
      "Online mixing & mastering hizmeti veren üreticileri burada bulabilirsin. Uzaktan çalışma modeliyle şehir bağımsız şekilde üretim yapabilirsin.",
    url: "https://www.studyom.net/online/mixing-mastering",
  },
};

export default async function OnlineMixingMasteringPage() {
  const producers = await getProducerListings();
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/online/mixing-mastering`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Online mixing & mastering hizmetleri",
    url: canonical,
    description:
      "Online mixing & mastering hizmeti veren üreticileri listeler. Uzaktan çalışma modeliyle şehir bağımsız seçenekler sunar.",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Studyom", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Üretim", item: `${baseUrl}/uretim` },
      { "@type": "ListItem", position: 3, name: "Online mixing & mastering", item: canonical },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Online mixing & mastering nasıl çalışır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Dosyalarını üreticiyle paylaşır, geri bildirim ve revizyonları online olarak yönetirsin.",
        },
      },
      {
        "@type": "Question",
        name: "Online çalışmada iletişim nasıl sağlanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mesajlaşma ve dosya paylaşımıyla ilerlenir; çalışma akışını üreticiyle netleştirebilirsin.",
        },
      },
      {
        "@type": "Question",
        name: "Teslim süresi neye bağlıdır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Teslim süresi üreticinin takvimine ve işin kapsamına göre değişir.",
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
        defaultFilters={{ mode: "Online", areas: ["Mixing", "Mastering"] }}
        header={{
          label: "Üretim",
          title: "Online mixing & mastering hizmetleri",
          description:
            "Bu sayfada online çalışmaya uygun mixing & mastering üreticilerini listeliyoruz. Büyük şehirler dışında da uzaktan iş teslimiyle çalışabilirsin.",
        }}
        emptyState={{
          title: "Şu anda sınırlı sayıda sonuç var",
          description:
            "Online mixing & mastering için listelenen üretici sayısı düşük olabilir. İstanbul sayfasına göz atabilir veya üretici başvurusu yapabilirsin.",
          cta: { label: "İstanbul mixing & mastering", href: "/istanbul/mixing-mastering" },
          secondaryCta: { label: "Üretici olmak istiyorum", href: "/apply/producer" },
        }}
        lowSupplyNotice={{
          title: "Sınırlı sonuç",
          description:
            "Online mixing & mastering için az sayıda üretici bulunuyor. Dilersen İstanbul sayfasına göz atabilirsin.",
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
                <p className="font-semibold text-[var(--color-primary)]">Online mixing & mastering nasıl çalışır?</p>
                <p>Dosyalarını üreticiyle paylaşır, geri bildirim ve revizyonları online takip edersin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Online çalışmada iletişim nasıl sağlanır?</p>
                <p>Mesajlaşma ve dosya paylaşımıyla ilerlenir; akışı üreticiyle netleştirebilirsin.</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Teslim süresi neye bağlıdır?</p>
                <p>Teslim süresi üreticinin takvimine ve işin kapsamına göre değişir.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Suspense>
  );
}
