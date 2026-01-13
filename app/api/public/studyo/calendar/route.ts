import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  studioId: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < cutoffHour) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    studioId: searchParams.get("studioId"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "studioId, start, end required" }, { status: 400 });
  }

  const { studioId, start, end } = parsed.data;
  const startAt = new Date(start);
  const endAt = new Date(end);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      calendarSettings: { select: { dayCutoffHour: true, happyHourEnabled: true } },
    },
  });
  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 });
  }

  const blocks = await prisma.studioCalendarBlock.findMany({
    where: {
      studioId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
    orderBy: { startAt: "asc" },
  });

  const happyHourEnabled = studio.calendarSettings?.happyHourEnabled ?? false;
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;
  const happyHourSlots = happyHourEnabled
    ? await prisma.studioHappyHourSlot.findMany({
        where: { studioId },
        select: { roomId: true, startAt: true, endAt: true },
        orderBy: { startAt: "asc" },
      })
    : [];

  const templatesByRoom = new Map<string, Array<{ weekday: number; startMinutes: number; endMinutes: number }>>();
  happyHourSlots.forEach((slot) => {
    const businessStart = getBusinessDayStart(slot.startAt, dayCutoffHour);
    const weekday = weekdayIndex(businessStart);
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
      templatesByRoom.forEach((templates, roomId) => {
        templates.forEach((tpl) => {
          if (tpl.weekday !== dayWeekday) return;
          const slotStart = addMinutes(dayStart, tpl.startMinutes);
          const slotEnd = addMinutes(dayStart, tpl.endMinutes);
          if (slotStart < endAt && slotEnd > startAt) {
            expandedHappyHours.push({
              roomId,
              startAt: slotStart.toISOString(),
              endAt: slotEnd.toISOString(),
            });
          }
        });
      });
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
  });
}
