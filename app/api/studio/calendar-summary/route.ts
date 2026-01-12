import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBlockingBlock, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";
import { buildHappyHourTemplatesByRoom, type HappyHourSlot } from "@/lib/happy-hour";

export const revalidate = 60;

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

const parsePrice = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: {
      id: true,
      openingHours: true,
      calendarSettings: {
        select: { weeklyHours: true, dayCutoffHour: true },
      },
      rooms: {
        select: {
          id: true,
          pricingModel: true,
          hourlyRate: true,
          flatRate: true,
          minRate: true,
          dailyRate: true,
          happyHourRate: true,
        },
      },
    },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const now = getIstanbulNow();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const openingHours = normalizeOpeningHours(
    (studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;
  const roomCount = studio.rooms.length || 1;

  const blocks = await prisma.studioCalendarBlock.findMany({
    where: {
      studioId: studio.id,
      startAt: { lt: monthEnd },
      endAt: { gt: monthStart },
    },
    select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
  });

  const getTotalOpenMinutes = (rangeStart: Date, rangeEnd: Date) => {
    let minutes = 0;
    const cursor = new Date(rangeStart);
    while (cursor < rangeEnd) {
      const range = getOpenRangeForDay(cursor, openingHours);
      if (range) {
        minutes += Math.max(0, range.end - range.start);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return minutes * roomCount;
  };

  const getOccupiedMinutes = (rangeStart: Date, rangeEnd: Date) => {
    const rangeStartMs = rangeStart.getTime();
    const rangeEndMs = rangeEnd.getTime();
    return blocks.reduce((acc, block) => {
      if (!isBlockingBlock(block)) return acc;
      const start = new Date(block.startAt);
      const end = new Date(block.endAt);
      const clampedStart = Math.max(start.getTime(), rangeStartMs);
      const clampedEnd = Math.min(end.getTime(), rangeEndMs);
      if (clampedEnd <= clampedStart) return acc;
      const businessStart = getBusinessDayStart(new Date(clampedStart), dayCutoffHour);
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

  const weekOpenMinutes = getTotalOpenMinutes(weekStart, weekEnd);
  const monthOpenMinutes = getTotalOpenMinutes(monthStart, monthEnd);
  const weekOccupiedMinutes = getOccupiedMinutes(weekStart, weekEnd);
  const monthOccupiedMinutes = getOccupiedMinutes(monthStart, monthEnd);

  const weekOccupancy =
    weekOpenMinutes === 0 ? 0 : Math.round((weekOccupiedMinutes / weekOpenMinutes) * 1000) / 10;
  const monthOccupancy =
    monthOpenMinutes === 0 ? 0 : Math.round((monthOccupiedMinutes / monthOpenMinutes) * 1000) / 10;

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

  const monthRevenue = blocks.reduce((acc, block) => {
    if (!isBlockingBlock(block)) return acc;
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    if (end <= monthStart || start >= monthEnd) return acc;
    const clampedStart = Math.max(start.getTime(), monthStart.getTime());
    const clampedEnd = Math.min(end.getTime(), monthEnd.getTime());
    if (clampedEnd <= clampedStart) return acc;
    const hourly = roomPriceById.get(block.roomId) ?? 0;
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
    return acc + (happyMinutes / 60) * happyHourly + (normalMinutes / 60) * hourly;
  }, 0);

  return NextResponse.json({
    summary: {
      weekOccupancy,
      monthOccupancy,
      monthRevenue,
    },
  });
}
