import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";

const querySchema = z.object({
  roomId: z.string().optional(),
  roomIds: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  includeSchedule: z.string().optional(),
  includeSummary: z.string().optional(),
});

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const getZonedParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.get("year") ?? "0"),
    month: Number(map.get("month") ?? "1"),
    day: Number(map.get("day") ?? "1"),
    hour: Number(map.get("hour") ?? "0"),
    minute: Number(map.get("minute") ?? "0"),
    second: Number(map.get("second") ?? "0"),
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
};

const makeZonedDate = (year: number, month: number, day: number, minutes: number, timeZone: string) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
};

const getBusinessDayStartZoned = (date: Date, cutoffHour: number, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const hour = parts.hour + parts.minute / 60;
  let baseYear = parts.year;
  let baseMonth = parts.month;
  let baseDay = parts.day;
  if (hour < cutoffHour) {
    const prev = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - 1));
    baseYear = prev.getUTCFullYear();
    baseMonth = prev.getUTCMonth() + 1;
    baseDay = prev.getUTCDate();
  }
  return makeZonedDate(baseYear, baseMonth, baseDay, 0, timeZone);
};

const weekdayIndexFromZonedDate = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return (utcDate.getUTCDay() + 6) % 7;
};

const minutesToTime = (minutes: number) => {
  const safe = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const parseTimeMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    roomId: searchParams.get("roomId") ?? undefined,
    roomIds: searchParams.get("roomIds") ?? undefined,
    start: searchParams.get("start"),
    end: searchParams.get("end"),
    includeSchedule: searchParams.get("includeSchedule") ?? undefined,
    includeSummary: searchParams.get("includeSummary") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "roomId or roomIds, start, end required" }, { status: 400 });
  }

  const { roomId, roomIds, start, end, includeSchedule } = parsed.data;
  const startAt = new Date(start);
  const endAt = new Date(end);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
    select: { dayCutoffHour: true, weeklyHours: true, timezone: true, happyHourEnabled: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;
  const timeZone = settings?.timezone ?? "Europe/Istanbul";
  const openingHours = normalizeOpeningHours(
    (settings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );

  let targetRoomIds: string[] = [];
  if (roomIds) {
    targetRoomIds = roomIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  } else if (roomId === "all") {
    const rooms = await prisma.room.findMany({
      where: { studioId: studio.id },
      select: { id: true },
    });
    targetRoomIds = rooms.map((room) => room.id);
  } else if (roomId) {
    targetRoomIds = [roomId];
  }

  if (!targetRoomIds.length) {
    return NextResponse.json({ blocks: [], happyHours: [] });
  }

  const allowedRooms = await prisma.room.findMany({
    where: { studioId: studio.id, id: { in: targetRoomIds } },
    select: { id: true },
  });
  const allowedRoomIds = allowedRooms.map((room) => room.id);
  if (!allowedRoomIds.length) {
    return NextResponse.json({ blocks: [], happyHours: [] });
  }

  const blocks = await prisma.studioCalendarBlock.findMany({
    where: {
      studioId: studio.id,
      roomId: { in: allowedRoomIds },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
    orderBy: { startAt: "asc" },
  });

  const happyHourEnabled = settings?.happyHourEnabled ?? false;
  const happyHourSlots = happyHourEnabled
    ? await prisma.studioHappyHourSlot.findMany({
        where: { studioId: studio.id, roomId: { in: allowedRoomIds } },
        select: { roomId: true, startAt: true, endAt: true },
        orderBy: { startAt: "asc" },
      })
    : [];

  const templatesByRoom = new Map<string, Array<{ weekday: number; startMinutes: number; endMinutes: number }>>();
  happyHourSlots.forEach((slot) => {
    const businessStart = getBusinessDayStartZoned(slot.startAt, dayCutoffHour, timeZone);
    const weekday = weekdayIndexFromZonedDate(businessStart, timeZone);
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    const list = templatesByRoom.get(slot.roomId) ?? [];
    const existing = list.find((tpl) => tpl.weekday === weekday && tpl.startMinutes === startMinutes);
    if (!existing || endMinutes > existing.endMinutes) {
      const next = list.filter((tpl) => !(tpl.weekday === weekday && tpl.startMinutes === startMinutes));
      next.push({ weekday, startMinutes, endMinutes });
      templatesByRoom.set(slot.roomId, next);
    } else {
      templatesByRoom.set(slot.roomId, list);
    }
  });

  const expandedHappyHours: Array<{ roomId: string; startAt: string; endAt: string }> = [];
  if (templatesByRoom.size) {
    const cursor = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
    const endCursor = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate());
    for (let d = new Date(cursor); d <= endCursor; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayWeekday = weekdayIndex(dayStart);
      templatesByRoom.forEach((templates, roomKey) => {
        templates.forEach((tpl) => {
          if (tpl.weekday !== dayWeekday) return;
          const slotStart = addMinutes(dayStart, tpl.startMinutes);
          const slotEnd = addMinutes(dayStart, tpl.endMinutes);
          if (slotStart < endAt && slotEnd > startAt) {
            expandedHappyHours.push({
              roomId: roomKey,
              startAt: slotStart.toISOString(),
              endAt: slotEnd.toISOString(),
            });
          }
        });
      });
    }
  }

  let roomsSchedule: Record<string, { weekday: number; enabled: boolean; endTime: string }[]> | undefined;
  let daysSchedule: { weekday: number; enabled: boolean; endTime: string }[] | undefined;
  if (includeSchedule === "1") {
    const byRoomWeekday = new Map<string, Map<number, number>>();
    happyHourSlots.forEach((slot) => {
      const businessStart = getBusinessDayStartZoned(slot.startAt, dayCutoffHour, timeZone);
      const weekday = weekdayIndexFromZonedDate(businessStart, timeZone);
      const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
      let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;
      let map = byRoomWeekday.get(slot.roomId);
      if (!map) {
        map = new Map<number, number>();
        byRoomWeekday.set(slot.roomId, map);
      }
      const current = map.get(weekday);
      if (current === undefined || endMinutes > current) {
        map.set(weekday, endMinutes);
      }
    });

    roomsSchedule = {};
    allowedRoomIds.forEach((id) => {
      const byWeekday = byRoomWeekday.get(id) ?? new Map<number, number>();
      roomsSchedule![id] = Array.from({ length: 7 }, (_, idx) => {
        const info = openingHours[idx];
        const fallback = info?.closeTime ?? "22:00";
        const endMinutes = byWeekday.get(idx);
        return {
          weekday: idx,
          enabled: endMinutes !== undefined,
          endTime: endMinutes !== undefined ? minutesToTime(endMinutes) : fallback,
        };
      });
    });

    if (roomId && roomId !== "all") {
      daysSchedule = roomsSchedule[roomId];
    }
  }

  return NextResponse.json({
    blocks: blocks.map((block) => ({
      roomId: block.roomId,
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
      type: block.type ?? null,
      status: block.status ?? null,
    })),
    happyHours: expandedHappyHours,
    rooms: roomsSchedule,
    days: daysSchedule,
  });
}
