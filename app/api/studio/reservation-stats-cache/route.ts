import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildHappyHourTemplatesByRoom, type HappyHourSlot } from "@/lib/happy-hour";
import { isBlockingBlock, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";

const ALL_ROOMS_KEY = "__all__";

type CachedRoomStats = {
  occupancy: number;
  revenue: number;
};

type ReservationStatsCache = {
  generatedAt: string;
  summary: {
    weekOccupancy: number;
    monthOccupancy: number;
    monthRevenue: number;
  };
  months: Record<
    string,
    {
      rooms: Record<string, CachedRoomStats>;
    }
  >;
};

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < cutoffHour * 60) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const getOpenRangeForDay = (day: Date, openingHours: OpeningHours[]) => {
  const info = openingHours[weekdayIndex(day)];
  if (!info || !info.open) return null;
  const start = minutesFromTime(info.openTime);
  let end = minutesFromTime(info.closeTime);
  if (end <= start) end += 24 * 60;
  return { start, end };
};

const getIstanbulNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));

const startOfWeek = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - weekdayIndex(d));
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const parsePrice = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
};

const getCacheFromExtras = (extrasJson: unknown): ReservationStatsCache | null => {
  if (!extrasJson || typeof extrasJson !== "object" || Array.isArray(extrasJson)) return null;
  const extras = extrasJson as Record<string, unknown>;
  const raw = extras.reservationStatsCache;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ReservationStatsCache;
};

const getTotalOpenMinutes = (openingHours: OpeningHours[], rangeStart: Date, rangeEnd: Date) => {
  let minutes = 0;
  const cursor = new Date(rangeStart);
  while (cursor < rangeEnd) {
    const range = getOpenRangeForDay(cursor, openingHours);
    if (range) {
      minutes += Math.max(0, range.end - range.start);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return minutes;
};

const getOccupiedMinutes = (
  blocks: { startAt: Date; endAt: Date; type: string | null; status: string | null }[],
  openingHours: OpeningHours[],
  cutoffHour: number,
  rangeStart: Date,
  rangeEnd: Date,
) => {
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();
  return blocks.reduce((acc, block) => {
    if (!isBlockingBlock(block)) return acc;
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    const clampedStart = Math.max(start.getTime(), rangeStartMs);
    const clampedEnd = Math.min(end.getTime(), rangeEndMs);
    if (clampedEnd <= clampedStart) return acc;
    const businessStart = getBusinessDayStart(new Date(clampedStart), cutoffHour);
    const openRange = getOpenRangeForDay(businessStart, openingHours);
    if (!openRange) return acc;
    const openStartMs = businessStart.getTime() + openRange.start * 60000;
    const openEndMs = businessStart.getTime() + openRange.end * 60000;
    const finalStart = Math.max(clampedStart, openStartMs);
    const finalEnd = Math.min(clampedEnd, openEndMs);
    if (finalEnd <= finalStart) return acc;
    return acc + (finalEnd - finalStart) / 60000;
  }, 0);
};

const buildMonthOptions = (now: Date) =>
  Array.from({ length: 25 }, (_, idx) => {
    const offset = idx - 12;
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { key: monthKeyFromDate(date), start: startOfMonth(date) };
  });

async function loadStudioForOwner(email: string) {
  return prisma.studio.findFirst({
    where: { ownerEmail: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      openingHours: true,
      calendarSettings: {
        select: { weeklyHours: true, dayCutoffHour: true },
      },
      rooms: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          pricingModel: true,
          hourlyRate: true,
          flatRate: true,
          minRate: true,
          dailyRate: true,
          happyHourRate: true,
          extrasJson: true,
        },
      },
    },
  });
}

async function computeCache(studio: NonNullable<Awaited<ReturnType<typeof loadStudioForOwner>>>) {
  const now = getIstanbulNow();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const monthOptions = buildMonthOptions(now);
  const rangeStart = monthOptions[0]?.start ?? monthStart;
  const lastMonth = monthOptions[monthOptions.length - 1]?.start ?? monthStart;
  const rangeEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);

  const openingHours = normalizeOpeningHours(
    (studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;
  const roomCount = studio.rooms.length || 1;

  const blocks = await prisma.studioCalendarBlock.findMany({
    where: {
      studioId: studio.id,
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
    },
    select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
  });

  const roomPriceById = new Map(
    studio.rooms.map((room) => {
      const price =
        parsePrice(room.hourlyRate) ??
        parsePrice(room.flatRate) ??
        parsePrice(room.minRate) ??
        parsePrice(room.dailyRate) ??
        0;
      return [room.id, price] as const;
    }),
  );
  const happyHourPriceById = new Map(
    studio.rooms.map((room) => {
      const base =
        parsePrice(room.hourlyRate) ??
        parsePrice(room.flatRate) ??
        parsePrice(room.minRate) ??
        parsePrice(room.dailyRate) ??
        0;
      const happy = parsePrice(room.happyHourRate);
      return [room.id, happy ?? base] as const;
    }),
  );

  const happyHourSlots = await prisma.studioHappyHourSlot.findMany({
    where: { studioId: studio.id },
    select: { roomId: true, startAt: true, endAt: true },
  });
  const happyHourByRoom = buildHappyHourTemplatesByRoom(
    happyHourSlots.map((slot) => ({
      roomId: slot.roomId,
      startAt: slot.startAt,
      endAt: slot.endAt,
    })) as HappyHourSlot[],
    openingHours,
    dayCutoffHour,
  );

  const getBlockRevenue = (
    block: { startAt: Date; endAt: Date; roomId: string; type?: string | null; status?: string | null },
    blockRangeStart: Date,
    blockRangeEnd: Date,
  ) => {
    if (!isBlockingBlock(block)) return 0;
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    if (end <= blockRangeStart || start >= blockRangeEnd) return 0;
    const clampedStart = Math.max(start.getTime(), blockRangeStart.getTime());
    const clampedEnd = Math.min(end.getTime(), blockRangeEnd.getTime());
    if (clampedEnd <= clampedStart) return 0;
    const hourly = roomPriceById.get(block.roomId) ?? 0;
    if (!hourly) return 0;
    const happyHourly = happyHourPriceById.get(block.roomId) ?? hourly;
    const businessStart = getBusinessDayStart(new Date(clampedStart), dayCutoffHour);
    const weekday = weekdayIndex(businessStart);
    const blockStartMinutes = (clampedStart - businessStart.getTime()) / 60000;
    const blockEndMinutes = (clampedEnd - businessStart.getTime()) / 60000;
    const templates = happyHourByRoom.get(block.roomId) ?? [];
    let happyMinutes = 0;
    templates.forEach((tpl) => {
      if (tpl.weekday !== weekday) return;
      const overlapStart = Math.max(blockStartMinutes, tpl.startMinutes);
      const overlapEnd = Math.min(blockEndMinutes, tpl.endMinutes);
      if (overlapEnd > overlapStart) {
        happyMinutes += overlapEnd - overlapStart;
      }
    });
    const totalMinutes = Math.max(0, blockEndMinutes - blockStartMinutes);
    const normalMinutes = Math.max(0, totalMinutes - happyMinutes);
    return (happyMinutes / 60) * happyHourly + (normalMinutes / 60) * hourly;
  };

  const blocksByRoom = new Map<string, typeof blocks>();
  studio.rooms.forEach((room) => {
    blocksByRoom.set(room.id, blocks.filter((block) => block.roomId === room.id));
  });

  const weekOpenMinutes = getTotalOpenMinutes(openingHours, weekStart, weekEnd) * roomCount;
  const monthOpenMinutes = getTotalOpenMinutes(openingHours, monthStart, monthEnd) * roomCount;
  const weekOccupiedMinutes = getOccupiedMinutes(blocks, openingHours, dayCutoffHour, weekStart, weekEnd);
  const monthOccupiedMinutes = getOccupiedMinutes(blocks, openingHours, dayCutoffHour, monthStart, monthEnd);
  const weekOccupancy =
    weekOpenMinutes === 0 ? 0 : Math.round((weekOccupiedMinutes / weekOpenMinutes) * 1000) / 10;
  const monthOccupancy =
    monthOpenMinutes === 0 ? 0 : Math.round((monthOccupiedMinutes / monthOpenMinutes) * 1000) / 10;
  const monthRevenue = blocks.reduce((acc, block) => acc + getBlockRevenue(block, monthStart, monthEnd), 0);

  const months: ReservationStatsCache["months"] = {};
  for (const option of monthOptions) {
    const optionEnd = new Date(option.start.getFullYear(), option.start.getMonth() + 1, 1);
    const allRoomsOpenMinutes = getTotalOpenMinutes(openingHours, option.start, optionEnd) * roomCount;
    const allRoomsOccupiedMinutes = getOccupiedMinutes(blocks, openingHours, dayCutoffHour, option.start, optionEnd);
    const allRoomsRevenue = blocks.reduce((acc, block) => acc + getBlockRevenue(block, option.start, optionEnd), 0);
    const roomStats: Record<string, CachedRoomStats> = {
      [ALL_ROOMS_KEY]: {
        occupancy:
          allRoomsOpenMinutes === 0 ? 0 : Math.round((allRoomsOccupiedMinutes / allRoomsOpenMinutes) * 1000) / 10,
        revenue: Math.round(allRoomsRevenue),
      },
    };

    const singleRoomOpenMinutes = getTotalOpenMinutes(openingHours, option.start, optionEnd);
    studio.rooms.forEach((room) => {
      const roomBlocks = blocksByRoom.get(room.id) ?? [];
      const roomOccupiedMinutes = getOccupiedMinutes(roomBlocks, openingHours, dayCutoffHour, option.start, optionEnd);
      const roomRevenue = roomBlocks.reduce((acc, block) => acc + getBlockRevenue(block, option.start, optionEnd), 0);
      roomStats[room.id] = {
        occupancy:
          singleRoomOpenMinutes === 0 ? 0 : Math.round((roomOccupiedMinutes / singleRoomOpenMinutes) * 1000) / 10,
        revenue: Math.round(roomRevenue),
      };
    });

    months[option.key] = { rooms: roomStats };
  }

  const cache: ReservationStatsCache = {
    generatedAt: new Date().toISOString(),
    summary: {
      weekOccupancy,
      monthOccupancy,
      monthRevenue: Math.round(monthRevenue),
    },
    months,
  };

  return cache;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studio = await loadStudioForOwner(email);
  const holderRoom = studio?.rooms[0] ?? null;
  if (!holderRoom) {
    return NextResponse.json({ error: "Önce en az bir oda eklemelisiniz." }, { status: 404 });
  }

  const cache = getCacheFromExtras(holderRoom.extrasJson);
  return NextResponse.json({
    summary: cache?.summary ?? null,
    generatedAt: cache?.generatedAt ?? null,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studio = await loadStudioForOwner(email);
  const holderRoom = studio?.rooms[0] ?? null;
  if (!studio || !holderRoom) {
    return NextResponse.json({ error: "Önce en az bir oda eklemelisiniz." }, { status: 404 });
  }

  const cache = await computeCache(studio);
  const currentExtras =
    holderRoom.extrasJson && typeof holderRoom.extrasJson === "object" && !Array.isArray(holderRoom.extrasJson)
      ? (holderRoom.extrasJson as Record<string, unknown>)
      : {};
  const nextExtras = {
    ...currentExtras,
    reservationStatsCache: cache,
  } as Prisma.InputJsonValue;

  await prisma.room.update({
    where: { id: holderRoom.id },
    data: { extrasJson: nextExtras },
  });

  return NextResponse.json({
    ok: true,
    summary: cache.summary,
    generatedAt: cache.generatedAt,
  });
}
