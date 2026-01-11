import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type HappyHourSlot } from "@/lib/happy-hour";

const slotSchema = z.object({
  roomId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  active: z.boolean(),
});

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getHours() < cutoffHour) {
    dayStart.setDate(dayStart.getDate() - 1);
  }
  return dayStart;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!roomId || !start || !end) {
    return NextResponse.json({ error: "roomId, start, end required" }, { status: 400 });
  }

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

  const startAt = new Date(start);
  const endAt = new Date(end);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
    select: { dayCutoffHour: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;

  const slots = await prisma.studioHappyHourSlot.findMany({
    where: {
      studioId: studio.id,
      roomId,
    },
    orderBy: { startAt: "asc" },
  });
  const templatesByRoom = new Map<string, Array<{ weekday: number; startMinutes: number; endMinutes: number }>>();
  (slots as HappyHourSlot[]).forEach((slot) => {
    const businessStart = getBusinessDayStart(slot.startAt, dayCutoffHour);
    const weekday = weekdayIndex(businessStart);
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
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
  const templates = templatesByRoom.get(roomId) ?? [];

  const expanded: { startAt: string; endAt: string; roomId: string }[] = [];
  const cursor = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
  const endCursor = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate());
  for (let d = new Date(cursor); d <= endCursor; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayWeekday = weekdayIndex(dayStart);
    templates.forEach((tpl) => {
      if (tpl.weekday !== dayWeekday) return;
      const slotStart = addMinutes(dayStart, tpl.startMinutes);
      const slotEnd = addMinutes(dayStart, tpl.endMinutes);
      if (slotStart < endAt && slotEnd > startAt) {
        expanded.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          roomId,
        });
      }
    });
  }

  return NextResponse.json({
    slots: expanded,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = slotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: parsed.data.roomId, studioId: studio.id },
    select: { id: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Zaman aralığı geçersiz" }, { status: 400 });
  }

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
    select: { dayCutoffHour: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;
  const businessStart = getBusinessDayStart(startAt, dayCutoffHour);
  const startMinutes = Math.round((startAt.getTime() - businessStart.getTime()) / 60000);
  const endMinutes = Math.round((endAt.getTime() - businessStart.getTime()) / 60000);
  const duration = Math.max(0, endMinutes - startMinutes);
  const weekday = weekdayIndex(businessStart);

  const existing = await prisma.studioHappyHourSlot.findMany({
    where: { studioId: studio.id, roomId: parsed.data.roomId },
    select: { id: true, startAt: true, endAt: true },
  });
  const hasExactMatch = existing.some(
    (slot) => slot.startAt.getTime() === startAt.getTime() && slot.endAt.getTime() === endAt.getTime(),
  );
  const matchingIds = existing
    .filter((slot) => {
      const slotBusinessStart = getBusinessDayStart(slot.startAt, dayCutoffHour);
      const slotWeekday = weekdayIndex(slotBusinessStart);
      const slotStartMinutes = Math.round(
        (slot.startAt.getTime() - slotBusinessStart.getTime()) / 60000,
      );
      const slotEndMinutes = Math.round(
        (slot.endAt.getTime() - slotBusinessStart.getTime()) / 60000,
      );
      return (
        slotWeekday === weekday &&
        slotStartMinutes === startMinutes &&
        Math.max(0, slotEndMinutes - slotStartMinutes) === duration
      );
    })
    .map((slot) => slot.id);

  if (parsed.data.active) {
    if (!matchingIds.length && !hasExactMatch) {
      await prisma.studioHappyHourSlot.create({
        data: {
          studioId: studio.id,
          roomId: parsed.data.roomId,
          startAt,
          endAt,
          createdByUserId: userId ?? null,
        },
      });
    }
  } else if (matchingIds.length) {
    await prisma.studioHappyHourSlot.deleteMany({
      where: { id: { in: matchingIds } },
    });
  }

  return NextResponse.json({ ok: true });
}
