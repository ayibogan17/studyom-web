import { Hero } from "@/components/design-system/components/shared/hero";
import { Section } from "@/components/design-system/components/shared/section";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { buildUniqueStudioSlug } from "@/lib/studio-slug";

const extractCoverImage = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return value.find((img) => typeof img === "string") ?? null;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.find((img) => typeof img === "string") ?? null;
      }
    } catch {
      // ignore parse errors and treat as direct url
    }
    return value || null;
  }
  if (value && typeof value === "object" && "url" in value) {
    const maybeUrl = (value as { url?: unknown }).url;
    return typeof maybeUrl === "string" ? maybeUrl : null;
  }
  return null;
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const contactCounts = await prisma.contactEvent.groupBy({
    by: ["entityId"],
    where: { entityType: "studio" },
    _count: { _all: true },
  });
  const contactMap = new Map(contactCounts.map((row) => [row.entityId, row._count._all]));
  const approvedReservationCounts = await prisma.studioReservationRequest.groupBy({
    by: ["studioId"],
    where: { status: "approved" },
    _count: { _all: true },
  });
  const approvedReservationMap = new Map(
    approvedReservationCounts.map((row) => [row.studioId, row._count._all]),
  );

  const studios = await prisma.studio.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      district: true,
      coverImageUrl: true,
      calendarSettings: { select: { happyHourEnabled: true } },
      rooms: {
        orderBy: { order: "asc" },
        select: {
          type: true,
          hourlyRate: true,
          minRate: true,
          flatRate: true,
          dailyRate: true,
          imagesJson: true,
          extrasJson: true,
        },
      },
    },
  });

  const usedSlugs = new Set(studios.map((studio) => studio.slug).filter((slug): slug is string => Boolean(slug)));
  const featured = studios
    .map((studio) => {
      const roomTypes = Array.from(
        new Set(
          studio.rooms
            .flatMap((room) => {
              const extras =
                room.extrasJson && typeof room.extrasJson === "object" && "alsoTypes" in room.extrasJson
                  ? (room.extrasJson as { alsoTypes?: string[] }).alsoTypes ?? []
                  : [];
              return [room.type, ...extras];
            })
            .filter(Boolean),
        ),
      );
      const coverImage =
        studio.coverImageUrl ??
        studio.rooms
          .map((room) => extractCoverImage(room.imagesJson))
          .find((img) => typeof img === "string" && img.length > 0) ??
        undefined;
      const primaryRoom = studio.rooms[0];
      const primaryRateRaw =
        primaryRoom?.hourlyRate ??
        primaryRoom?.minRate ??
        primaryRoom?.flatRate ??
        primaryRoom?.dailyRate ??
        null;
      const pricePerHour = primaryRateRaw
        ? (() => {
            const cleaned = primaryRateRaw.toString().replace(/[^\d.,]/g, "").replace(",", ".");
            const parsed = Number.parseFloat(cleaned);
            return Number.isFinite(parsed) ? parsed : undefined;
          })()
        : undefined;
      const interactionCount =
        (contactMap.get(studio.id) ?? 0) + (approvedReservationMap.get(studio.id) ?? 0);
      return {
        id: studio.id,
        slug: studio.slug ?? buildUniqueStudioSlug(studio.name, usedSlugs),
        name: studio.name,
        city: studio.city ?? "",
        district: studio.district ?? "",
        price: pricePerHour ? `₺${pricePerHour}/saat` : undefined,
        badges: roomTypes.slice(0, 3),
        imageUrl: coverImage,
        happyHourActive: studio.calendarSettings?.happyHourEnabled ?? false,
        interactionCount,
      };
    })
    .sort((a, b) => {
      if (a.interactionCount !== b.interactionCount) {
        return b.interactionCount - a.interactionCount;
      }
      return a.name.localeCompare(b.name, "tr");
    })
    .slice(0, 8);

  return (
    <main className="bg-[var(--color-secondary)]">
      <Hero
        title="Şehrindeki prova ve kayıt stüdyoları tek platformda"
        subtitle="Güvenilir stüdyolar, şeffaf fiyatlar, hızlı iletişim. Prova, kayıt veya ders için ihtiyacına göre filtrele."
      />

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Öne çıkan stüdyolar</p>
          </div>
          <Badge variant="outline">8 stüdyo</Badge>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((studio) => (
            <StudioCard
              key={studio.id}
              name={studio.name}
              city={studio.city}
              district={studio.district}
              price={studio.price}
              badges={studio.badges}
              imageUrl={studio.imageUrl}
              happyHourActive={studio.happyHourActive}
              href={`/studyo/${studio.slug}`}
            />
          ))}
        </div>
      </Section>

    </main>
  );
}
