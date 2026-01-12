import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildUniqueStudioSlug } from "@/lib/studio-slug";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { OpeningHours } from "@/types/panel";
import { StudyoClientPage, type ServerStudio } from "./studyo-client";

export const metadata: Metadata = {
  title: "Stüdyo Bul | Studyom",
  description: "Şehrindeki prova ve kayıt stüdyolarını filtrele ve keşfet.",
};

export const dynamic = "force-dynamic";

const getPublicStudios = unstable_cache(
  async () => {
    const contactCounts = await prisma.contactEvent.groupBy({
      by: ["entityId"],
      where: { entityType: "studio" },
      _count: { _all: true },
    });
    const approvedReservationCounts = await prisma.studioReservationRequest.groupBy({
      by: ["studioId"],
      where: { status: "approved" },
      _count: { _all: true },
    });

    const studios = await prisma.studio.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        district: true,
        coverImageUrl: true,
        openingHours: true,
        calendarSettings: { select: { happyHourEnabled: true } },
        rooms: {
          orderBy: { order: "asc" },
          select: {
            name: true,
            type: true,
            pricingModel: true,
            hourlyRate: true,
            flatRate: true,
            minRate: true,
            dailyRate: true,
            imagesJson: true,
            extrasJson: true,
          },
        },
      },
    });

    return { studios, contactCounts, approvedReservationCounts };
  },
  ["studyo-public-list"],
  { revalidate: 60 },
);

export default async function StudioListPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  const publicData = await getPublicStudios();
  let studios = [...publicData.studios];
  const contactMap = new Map(publicData.contactCounts.map((row) => [row.entityId, row._count._all]));
  const approvedReservationMap = new Map(
    publicData.approvedReservationCounts.map((row) => [row.studioId, row._count._all]),
  );

  if (userEmail) {
    const ownerStudios = await prisma.studio.findMany({
      where: { ownerEmail: userEmail, isActive: false },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        district: true,
        coverImageUrl: true,
        openingHours: true,
        calendarSettings: { select: { happyHourEnabled: true } },
        rooms: {
          orderBy: { order: "asc" },
          select: {
            name: true,
            type: true,
            pricingModel: true,
            hourlyRate: true,
            flatRate: true,
            minRate: true,
            dailyRate: true,
            imagesJson: true,
            extrasJson: true,
          },
        },
      },
    });
    const byId = new Map(studios.map((studio) => [studio.id, studio]));
    ownerStudios.forEach((studio) => {
      if (!byId.has(studio.id)) {
        studios.push(studio);
      }
    });
  }

  const usedSlugs = new Set(studios.map((studio) => studio.slug).filter((slug): slug is string => Boolean(slug)));
  const missingSlugs: Array<{ id: string; slug: string }> = [];
  const studioSlugMap = new Map<string, string>();

  studios.forEach((studio) => {
    let slug = studio.slug;
    if (!slug) {
      slug = buildUniqueStudioSlug(studio.name, usedSlugs);
      usedSlugs.add(slug);
      missingSlugs.push({ id: studio.id, slug });
    }
    studioSlugMap.set(studio.id, slug);
  });

  if (missingSlugs.length) {
    await prisma.$transaction(
      missingSlugs.map((item) => prisma.studio.update({ where: { id: item.id }, data: { slug: item.slug } })),
    );
  }

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

  const serverStudios: ServerStudio[] = studios.map((studio) => {
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

    return {
      id: studio.id,
      slug: studioSlugMap.get(studio.id) ?? studio.slug ?? buildUniqueStudioSlug(studio.name, usedSlugs),
      name: studio.name,
      province: studio.city ?? "",
      district: studio.district ?? "",
      openingHours: (studio.openingHours as OpeningHours[] | null | undefined) ?? null,
      happyHourEnabled: studio.calendarSettings?.happyHourEnabled ?? false,
      roomTypes,
      rooms: studio.rooms.map((room) => ({
        name: room.name,
        type: room.type,
        pricingModel: room.pricingModel,
        flatRate: room.flatRate,
        minRate: room.minRate,
        dailyRate: room.dailyRate,
        hourlyRate: room.hourlyRate,
        equipmentJson: null,
        featuresJson: null,
        extrasJson: null,
      })),
      pricePerHour,
      badges: roomTypes.slice(0, 3),
      imageUrl: coverImage,
      interactionCount: (contactMap.get(studio.id) ?? 0) + (approvedReservationMap.get(studio.id) ?? 0),
    };
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <StudyoClientPage serverStudios={serverStudios} />
    </Suspense>
  );
}
