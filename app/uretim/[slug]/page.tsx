import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { getProducerBySlug } from "@/lib/producer-db";
import { ProducerMessageThread } from "@/components/design-system/components/producers/producer-message-thread";

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
      <Section containerClassName="max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {producer.image ? (
                    <img
                      src={producer.image}
                      alt={producer.displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
                      {producer.displayName
                        .split(" ")
                        .map((part) => part.trim())
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-primary)]">{producer.displayName}</h1>
                    {producer.city ? (
                      <p className="text-sm text-[var(--color-muted)]">{producer.city}</p>
                    ) : null}
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

            <Card className="space-y-3 p-6">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Üretim alanları</p>
              <div className="flex flex-wrap gap-2">
                {producer.areas.length ? (
                  producer.areas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="space-y-3 p-6">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Çalışma tipi</p>
                <div className="flex flex-wrap gap-2">
                  {producer.workTypes.length ? (
                    producer.workTypes.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                  )}
                </div>
              </Card>
              <Card className="space-y-3 p-6">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Çalışma modu</p>
                <div className="flex flex-wrap gap-2">
                  {producer.modes.length ? (
                    producer.modes.map((mode) => (
                      <Badge key={mode} variant="outline">
                        {mode}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                  )}
                </div>
              </Card>
            </div>

            <Card className="space-y-3 p-6">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Türler</p>
              <div className="flex flex-wrap gap-2">
                {producer.genres.length ? (
                  producer.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </Card>

            <Card className="space-y-3 p-6">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Portföy</p>
              {producer.links.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {producer.links.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              )}
            </Card>

            {producer.galleryUrls && producer.galleryUrls.length > 0 ? (
              <Card className="space-y-3 p-6">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Görseller</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {producer.galleryUrls.map((url) => (
                    <div
                      key={url}
                      className="aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]"
                    >
                      <img src={url} alt="Üretici görseli" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <ProducerMessageThread producerSlug={producer.slug} producerName={producer.displayName} />
          </div>
        </div>
      </Section>
    </main>
  );
}
