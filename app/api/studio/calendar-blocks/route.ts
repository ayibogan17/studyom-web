import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toTimeZoneDate } from "@/lib/studio-availability";

const blockSchema = z.object({
  roomId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(["manual_block", "reservation"]),
  title: z.string().max(120).optional().nullable(),
  status: z.string().max(40).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

const settingsDefaults = {
  slotStepMinutes: 60,
  dayCutoffHour: 4,
  timezone: "Europe/Istanbul",
};

type OpeningHours = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < cutoffHour) {
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

const isWithinOpeningHours = (
  startAt: Date,
  endAt: Date,
  openingHours: OpeningHours[],
  cutoffHour: number,
) => {
  const businessStart = getBusinessDayStart(startAt, cutoffHour);
  const range = getOpenRangeForDay(businessStart, openingHours);
  if (!range) return false;
  const startMinutes = (startAt.getTime() - businessStart.getTime()) / 60000;
  const endMinutes = (endAt.getTime() - businessStart.getTime()) / 60000;
  return startMinutes >= range.start && endMinutes <= range.end;
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
  if ((!roomId && !roomIdsParam) || !start || !end) {
    return NextResponse.json({ error: "roomId or roomIds, start, end required" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  let roomIds: string[] = [];
  if (roomIdsParam) {
    roomIds = roomIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
  } else if (roomId === "all") {
    const rooms = await prisma.room.findMany({
      where: { studioId: studio.id },
      select: { id: true },
    });
    roomIds = rooms.map((room) => room.id);
  } else if (roomId) {
    roomIds = [roomId];
  }

  const allowedRooms = await prisma.room.findMany({
    where: { studioId: studio.id, id: { in: roomIds } },
    select: { id: true },
  });
  const allowedRoomIds = allowedRooms.map((room) => room.id);
  if (!allowedRoomIds.length) {
    return NextResponse.json({ blocks: [] });
  }

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

  return NextResponse.json({
    blocks: blocks.map((b) => ({
      id: b.id,
      roomId: b.roomId,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      type: b.type,
      title: b.title ?? "",
      status: b.status ?? null,
      note: b.note ?? "",
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
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

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Zaman aralığı geçersiz" }, { status: 400 });
  }

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
  });
  const openingHours =
    (settings?.weeklyHours as OpeningHours[] | null | undefined) ??
    (studio.openingHours as OpeningHours[] | null | undefined) ??
    [];

  if (parsed.data.type === "reservation") {
    const cutoff = settings?.dayCutoffHour ?? settingsDefaults.dayCutoffHour;
    const timeZone = settings?.timezone ?? settingsDefaults.timezone;
    const startAtLocal = toTimeZoneDate(startAt, timeZone);
    const endAtLocal = toTimeZoneDate(endAt, timeZone);
    if (!isWithinOpeningHours(startAtLocal, endAtLocal, openingHours, cutoff)) {
      return NextResponse.json({ error: "Rezervasyon saatleri açık saatler dışında." }, { status: 400 });
    }
  }

  const overlap = await prisma.studioCalendarBlock.findFirst({
    where: {
      roomId: parsed.data.roomId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlap) {
    return NextResponse.json({ error: "Bu saatlerde başka bir kayıt var." }, { status: 409 });
  }

  const block = await prisma.studioCalendarBlock.create({
    data: {
      studioId: studio.id,
      roomId: parsed.data.roomId,
      startAt,
      endAt,
      type: parsed.data.type,
      title: parsed.data.title?.trim() || null,
      status: parsed.data.status ?? null,
      note: parsed.data.note?.trim() || null,
      createdByUserId: userId ?? null,
    },
  });

  return NextResponse.json({
    block: {
      id: block.id,
      roomId: block.roomId,
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
      type: block.type,
      title: block.title ?? "",
      status: block.status ?? null,
      note: block.note ?? "",
    },
  });
}
