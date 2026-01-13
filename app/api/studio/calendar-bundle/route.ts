import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBlockingBlock, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";
import { type HappyHourSlot } from "@/lib/happy-hour";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

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

type HappyHourTemplate = { weekday: number; startMinutes: number; endMinutes: number };

const buildHappyHourTemplatesByRoom = (slots: HappyHourSlot[], cutoffHour: number) => {
  const byRoomWeekday = new Map<string, HappyHourTemplate>();
  slots.forEach((slot) => {
    const businessStart = getBusinessDayStart(slot.startAt, cutoffHour);
    const weekday = weekdayIndex(businessStart);
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    const key = `${slot.roomId}-${weekday}`;
    const existing = byRoomWeekday.get(key);
    if (!existing || endMinutes > existing.endMinutes) {
      byRoomWeekday.set(key, { weekday, startMinutes, endMinutes });
    }
  });

  const result = new Map<string, HappyHourTemplate[]>();
  byRoomWeekday.forEach((entry, key) => {
    const roomId = key.split("-").slice(0, -1).join("-");
    const list = result.get(roomId) ?? [];
    list.push(entry);
    result.set(roomId, list);
  });
  return result;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const roomIdsParam = searchParams.get("roomIds");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const includeSummary = searchParams.get("includeSummary") !== "0";
  const includeBlocks = searchParams.get("includeBlocks") !== "0";
  const includeHappy = searchParams.get("includeHappy") !== "0";

  if ((includeBlocks || includeHappy) && (!start || !end)) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: {
      id: true,
      openingHours: true,
      calendarSettings: { select: { weeklyHours: true, dayCutoffHour: true, timezone: true } },
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

  let roomIds: string[] = [];
  if (roomIdsParam) {
    roomIds = roomIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
  } else if (roomId) {
    roomIds = [roomId];
  }

  const allowedRoomIds = roomIds.length
    ? studio.rooms.map((room) => room.id).filter((id) => roomIds.includes(id))
    : studio.rooms.map((room) => room.id);

  const openingHours = normalizeOpeningHours(
    (studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;

  const response: {
    blocks?: Array<{
      id: string;
      roomId: string;
      startAt: string;
      endAt: string;
      type: string;
      title: string;
      status: string | null;
      note: string;
    }>;
    happyHours?: Array<{ startAt: string; endAt: string; roomId: string }>;
    summary?: { weekOccupancy: number; monthOccupancy: number; monthRevenue: number };
  } = {};

  if (includeBlocks && allowedRoomIds.length && start && end) {
    const startAt = new Date(start);
    const endAt = new Date(end);
    const blocks = await prisma.studioCalendarBlock.findMany({
      where: {
        studioId: studio.id,
        roomId: { in: allowedRoomIds },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        roomId: true,
        startAt: true,
        endAt: true,
        type: true,
        title: true,
        status: true,
        note: true,
      },
    });
    response.blocks = blocks.map((b) => ({
      id: b.id,
      roomId: b.roomId,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      type: b.type,
      title: b.title ?? "",
      status: b.status ?? null,
      note: b.note ?? "",
    }));
  }

  if (includeHappy && allowedRoomIds.length && start && end) {
    const startAt = new Date(start);
    const endAt = new Date(end);
    const slots = await prisma.studioHappyHourSlot.findMany({
      where: { studioId: studio.id, roomId: { in: allowedRoomIds } },
      orderBy: { startAt: "asc" },
    });
    const templatesByRoom = buildHappyHourTemplatesByRoom(
      slots.map((slot) => ({
        roomId: slot.roomId,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })) as HappyHourSlot[],
      dayCutoffHour,
    );

    const expanded: { startAt: string; endAt: string; roomId: string }[] = [];
    const cursor = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
    const endCursor = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate());
    for (let d = new Date(cursor); d <= endCursor; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayWeekday = weekdayIndex(dayStart);
      allowedRoomIds.forEach((id) => {
        const templates = templatesByRoom.get(id) ?? [];
        templates.forEach((tpl) => {
          if (tpl.weekday !== dayWeekday) return;
          const slotStart = addMinutes(dayStart, tpl.startMinutes);
          const slotEnd = addMinutes(dayStart, tpl.endMinutes);
          if (slotStart < endAt && slotEnd > startAt) {
            expanded.push({
              startAt: slotStart.toISOString(),
              endAt: slotEnd.toISOString(),
              roomId: id,
            });
          }
        });
      });
    }
    response.happyHours = expanded;
  }

  if (includeSummary) {
    const now = getIstanbulNow();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const monthStart = startOfMonth(now);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
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

    const monthRevenue = blocks.reduce((acc, block) => {
      if (!isBlockingBlock(block)) return acc;
      const start = new Date(block.startAt);
      const end = new Date(block.endAt);
      if (end <= monthStart || start >= monthEnd) return acc;
      const clampedStart = Math.max(start.getTime(), monthStart.getTime());
      const clampedEnd = Math.min(end.getTime(), monthEnd.getTime());
      if (clampedEnd <= clampedStart) return acc;
      const price = roomPriceById.get(block.roomId) ?? 0;
      return acc + ((clampedEnd - clampedStart) / 3600000) * price;
    }, 0);

    response.summary = {
      weekOccupancy,
      monthOccupancy,
      monthRevenue: Math.round(monthRevenue),
    };
  }

  return NextResponse.json(response);
}
