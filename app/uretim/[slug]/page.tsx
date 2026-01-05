import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { getProducerBySlug } from "@/lib/producer-db";
import { ProducerMessageThread } from "@/components/design-system/components/producers/producer-message-thread";
import { BioCard } from "./producer-bio-card";
import { Gallery } from "./producer-gallery";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Params | Promise<Params>;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const producer = await getProducerBySlug(resolved?.slug);
  if (!producer) {
    return { title: "Üretici bulunamadı | Studyom" };
  }
  const areas = producer.areas.slice(0, 3).join(", ");
  return {
    title: `${producer.displayName} | Üretim | Studyom`,
    description: `${producer.displayName} üretim alanları: ${areas || "Üretim"}`,
  };
}

export default async function ProducerDetailPage({ params }: { params: Params | Promise<Params> }) {
  const resolved = await Promise.resolve(params);
  const producer = await getProducerBySlug(resolved.slug);
  if (!producer) {
    notFound();
  }

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-6xl space-y-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ProducerProfileHeader producer={producer} />
          <MessageCard producerSlug={producer.slug} producerName={producer.displayName} />
        </div>

        <BioCard bio={producer.bio} />

        <div className="grid gap-6 lg:grid-cols-2">
          <TagsCard producer={producer} />
          <StudiosCard studios={producer.studiosUsed} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <PortfolioCard links={producer.links} />
          <Gallery urls={producer.galleryUrls} />
        </div>
      </Section>
    </main>
  );
}

function ProducerProfileHeader({
  producer,
}: {
  producer: {
    displayName: string;
    image?: string | null;
    city?: string | null;
    status: string;
    statement: string;
  };
}) {
  const initials =
    producer.displayName
      ?.split(" ")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {producer.image ? (
            <img
              src={producer.image}
              alt={producer.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] text-base font-semibold text-[var(--color-primary)]">
              {initials}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">{producer.displayName}</h1>
            {producer.city ? <p className="text-sm text-[var(--color-muted)]">{producer.city}</p> : null}
          </div>
        </div>
        {producer.status === "pending" ? (
          <Badge variant="muted">İncelemede</Badge>
        ) : (
          <Badge variant="outline">Onaylı</Badge>
        )}
      </div>

      <p className="text-sm text-[var(--color-muted)]">{producer.statement}</p>

    </Card>
  );
}

function MessageCard({ producerSlug, producerName }: { producerSlug: string; producerName: string }) {
  return (
    <div id="message">
      <Card className="p-6">
        <ProducerMessageThread producerSlug={producerSlug} producerName={producerName} />
      </Card>
    </div>
  );
}

function TagsCard({
  producer,
}: {
  producer: {
    areas: string[];
    workTypes: string[];
    modes: string[];
    genres: string[];
  };
}) {
  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Detaylar</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TagSection title="Üretim alanları" items={producer.areas} />
        <TagSection title="Çalışma tipi" items={producer.workTypes} />
        <TagSection title="Çalışma modu" items={producer.modes} />
        <TagSection title="Türler" items={producer.genres} />
      </div>
    </Card>
  );
}

function TagSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
        )}
      </div>
    </div>
  );
}

function StudiosCard({ studios }: { studios?: string[] }) {
  const list = studios ?? [];
  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Çalıştığı stüdyolar</p>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((studio) => (
            <span
              key={studio}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-primary)]"
            >
              {studio}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">Henüz eklenmemiş.</p>
      )}
    </Card>
  );
}

function PortfolioCard({ links }: { links: string[] }) {
  const items = links ?? [];
  const getDomain = (value: string) => {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch {
      return value;
    }
  };

  return (
    <Card id="portfolio" className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Portföy</p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
      ) : (
        <div className="space-y-3">
          {items.map((link) => (
            <div
              key={link}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">Portföyü Aç</p>
                <p className="text-xs text-[var(--color-muted)]">{getDomain(link)}</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <a href={link} target="_blank" rel="noreferrer">
                  Portföyü Aç
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
