import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { StudyoClientPage, type ServerStudio } from "./studyo-client";

export const metadata: Metadata = {
  title: "Stüdyo Bul | Studyom",
  description: "Şehrindeki prova ve kayıt stüdyolarını filtrele ve keşfet.",
};

export const dynamic = "force-dynamic";

export default async function StudioListPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  const studios = await prisma.studio.findMany({
    where: userEmail
      ? { OR: [{ isActive: true }, { ownerEmail: userEmail }] }
      : { isActive: true },
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
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
          equipmentJson: true,
          featuresJson: true,
          extrasJson: true,
        },
      },
    },
  });

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
      studio.rooms
        .map((room) => extractCoverImage(room.imagesJson))
        .find((img) => typeof img === "string" && img.length > 0) ?? undefined;
    const numericRates = studio.rooms
      .map((room) => [room.hourlyRate, room.flatRate])
      .flat()
      .map((value) => {
        if (!value) return null;
        const cleaned = value.toString().replace(/[^\d.,]/g, "").replace(",", ".");
        const parsed = Number.parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value): value is number => value !== null);
    const pricePerHour = numericRates.length ? Math.min(...numericRates) : undefined;

    return {
      id: studio.id,
      name: studio.name,
      province: studio.city ?? "",
      district: studio.district ?? "",
      roomTypes,
      rooms: studio.rooms.map((room) => ({
        name: room.name,
        type: room.type,
        pricingModel: room.pricingModel,
        flatRate: room.flatRate,
        minRate: room.minRate,
        dailyRate: room.dailyRate,
        hourlyRate: room.hourlyRate,
        equipmentJson: room.equipmentJson,
        featuresJson: room.featuresJson,
        extrasJson: room.extrasJson,
      })),
      pricePerHour,
      badges: roomTypes.slice(0, 3),
      imageUrl: coverImage,
    };
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <StudyoClientPage serverStudios={serverStudios} />
    </Suspense>
  );
}
