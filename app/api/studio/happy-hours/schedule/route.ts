import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type HappyHourSlot } from "@/lib/happy-hour";
import { normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  endTime: z.string().regex(timeRegex),
});

const schema = z.object({
  roomId: z.string().min(1),
  days: z.array(daySchema).length(7),
});

const parseTimeMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

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

const minutesToTime = (minutes: number) => {
  const safe = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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

const weekdayIndexFromUtcDate = (date: Date) => (date.getUTCDay() + 6) % 7;

const makeZonedDate = (year: number, month: number, day: number, minutes: number, timeZone: string) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: roomId, studioId: studio.id },
    select: { id: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
    select: { dayCutoffHour: true, weeklyHours: true, timezone: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;
  const timeZone = settings?.timezone ?? "Europe/Istanbul";

  const slots = await prisma.studioHappyHourSlot.findMany({
    where: { studioId: studio.id, roomId },
    select: { startAt: true, endAt: true },
  });
  const openingHours = normalizeOpeningHours(
    (settings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const byWeekday = new Map<number, number>();
  const slotList = slots.map((slot) => ({ roomId, startAt: slot.startAt, endAt: slot.endAt })) as HappyHourSlot[];
  slotList.forEach((slot) => {
    const businessStart = getBusinessDayStartZoned(slot.startAt, dayCutoffHour, timeZone);
    const weekday = weekdayIndexFromUtcDate(
      new Date(Date.UTC(
        businessStart.getUTCFullYear(),
        businessStart.getUTCMonth(),
        businessStart.getUTCDate(),
      )),
    );
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    const current = byWeekday.get(weekday);
    if (current === undefined || endMinutes > current) {
      byWeekday.set(weekday, endMinutes);
    }
  });

  const days = Array.from({ length: 7 }, (_, idx) => {
    const info = openingHours[idx];
    const fallback = info?.closeTime ?? "22:00";
    const endMinutes = byWeekday.get(idx);
    return {
      weekday: idx,
      enabled: endMinutes !== undefined,
      endTime: endMinutes !== undefined ? minutesToTime(endMinutes) : fallback,
    };
  });

  return NextResponse.json({ days });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: parsed.data.roomId, studioId: studio.id },
    select: { id: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
    select: { dayCutoffHour: true, weeklyHours: true, timezone: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;
  const timeZone = settings?.timezone ?? "Europe/Istanbul";
  const weeklyHours =
    (settings?.weeklyHours as { openTime: string }[] | null | undefined) ??
    (studio.openingHours as { openTime: string }[] | null | undefined) ??
    [];

  const today = new Date();
  const todayParts = getZonedParts(today, timeZone);
  const todayUtcDate = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
  const currentWeekday = (todayUtcDate.getUTCDay() + 6) % 7;
  const weekStartUtc = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day - currentWeekday),
  );

  const entries = parsed.data.days
    .filter((day) => day.enabled)
    .map((day) => {
      const openTime = weeklyHours[day.weekday]?.openTime ?? "09:00";
      const openMinutes = parseTimeMinutes(openTime) ?? 0;
      const endMinutes = parseTimeMinutes(day.endTime) ?? 0;
      const baseDayUtc = new Date(weekStartUtc);
      baseDayUtc.setUTCDate(weekStartUtc.getUTCDate() + day.weekday);
      const baseYear = baseDayUtc.getUTCFullYear();
      const baseMonth = baseDayUtc.getUTCMonth() + 1;
      const baseDay = baseDayUtc.getUTCDate();
      const startAt = makeZonedDate(baseYear, baseMonth, baseDay, openMinutes, timeZone);
      let endAt = makeZonedDate(baseYear, baseMonth, baseDay, endMinutes, timeZone);
      if (endMinutes <= openMinutes) {
        endAt = makeZonedDate(baseYear, baseMonth, baseDay, endMinutes + 24 * 60, timeZone);
      }
      return {
        studioId: studio.id,
        roomId: parsed.data.roomId,
        startAt,
        endAt,
        createdByUserId: userId ?? null,
      };
    });

  await prisma.studioHappyHourSlot.deleteMany({
    where: { studioId: studio.id, roomId: parsed.data.roomId },
  });

  if (entries.length) {
    await prisma.studioHappyHourSlot.createMany({ data: entries });
  }

  return NextResponse.json({ ok: true });
}
