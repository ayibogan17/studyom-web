import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import { isBlockingBlock, isWithinOpeningHours, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";

const roomTypeAliases: Record<string, string> = {
  prova: "prova-odasi",
  "prova-odasi": "prova-odasi",
  kayit: "kayit-kabini",
  "kayit-odasi": "kayit-kabini",
  "kayit-kabini": "kayit-kabini",
  "vokal-kabini": "vokal-kabini",
  "davul-odasi": "davul-kabini",
  "davul-kabini": "davul-kabini",
  "etut-odasi": "etut-odasi",
  "kontrol-odasi": "kayit-kabini",
  "produksiyon-odasi": "kayit-kabini",
};

const normalizeRoomType = (value: string) => {
  const slug = slugify(value);
  return roomTypeAliases[slug] ?? slug;
};

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value && typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as T;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const durationRaw = searchParams.get("duration");
  const province = searchParams.get("il") ?? "";
  const district = searchParams.get("ilce") ?? "";
  const roomType = searchParams.get("oda") ?? "";

  if (!date || !time) {
    return NextResponse.json({ studioIds: [] });
  }

  const startAt = new Date(`${date}T${time}:00+03:00`);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ studioIds: [] }, { status: 400 });
  }
  const duration = durationRaw ? Number.parseInt(durationRaw, 10) : 60;
  const durationMinutes = Number.isFinite(duration) && duration > 0 ? duration : 60;
  const endAt = new Date(startAt.getTime() + durationMinutes * 60000);

  const studios = await prisma.studio.findMany({
    where: { isActive: true },
    select: {
      id: true,
      city: true,
      district: true,
      openingHours: true,
      calendarSettings: {
        select: {
          dayCutoffHour: true,
          weeklyHours: true,
        },
      },
      rooms: {
        select: {
          id: true,
          type: true,
          extrasJson: true,
        },
      },
    },
  });

  const filteredStudios = studios.filter((studio) => {
    if (province && slugify(studio.city ?? "") !== province) return false;
    if (district && slugify(studio.district ?? "") !== district) return false;
    return true;
  });

  const candidates = filteredStudios
    .map((studio) => {
      const settingsHours = studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined;
      const openingHours = normalizeOpeningHours(settingsHours ?? (studio.openingHours as OpeningHours[] | null | undefined));
      const cutoff = studio.calendarSettings?.dayCutoffHour ?? 4;
      if (!isWithinOpeningHours(startAt, endAt, openingHours, cutoff)) return null;

      const roomIds = studio.rooms
        .filter((room) => {
          if (!roomType) return true;
          const extras = parseJson<{ alsoTypes?: string[] }>(room.extrasJson, {});
          const types = [room.type, ...(extras.alsoTypes ?? [])].filter(Boolean);
          const normalized = types.map((value) => normalizeRoomType(value));
          return normalized.includes(roomType);
        })
        .map((room) => room.id);

      if (!roomIds.length) return null;
      return { id: studio.id, roomIds };
    })
    .filter(Boolean) as Array<{ id: string; roomIds: string[] }>;

  const roomIds = candidates.flatMap((item) => item.roomIds);
  const blocks = roomIds.length
    ? await prisma.studioCalendarBlock.findMany({
        where: {
          roomId: { in: roomIds },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { roomId: true, type: true, status: true },
      })
    : [];

  const blockedRoomIds = new Set(blocks.filter(isBlockingBlock).map((block) => block.roomId));

  const studioIds = candidates
    .filter((studio) => studio.roomIds.some((roomId) => !blockedRoomIds.has(roomId)))
    .map((studio) => studio.id);

  return NextResponse.json({ studioIds });
}
