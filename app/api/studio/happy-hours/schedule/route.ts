import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildHappyHourDays, type HappyHourSlot } from "@/lib/happy-hour";
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

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

const parseTimeMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
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
    select: { dayCutoffHour: true, weeklyHours: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;

  const slots = await prisma.studioHappyHourSlot.findMany({
    where: { studioId: studio.id, roomId },
    select: { startAt: true, endAt: true },
  });
  const openingHours = normalizeOpeningHours(
    (settings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const days = buildHappyHourDays(
    slots.map((slot) => ({ roomId, startAt: slot.startAt, endAt: slot.endAt })) as HappyHourSlot[],
    openingHours,
    dayCutoffHour,
  );

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
    select: { dayCutoffHour: true, weeklyHours: true },
  });
  const dayCutoffHour = settings?.dayCutoffHour ?? 4;
  const weeklyHours =
    (settings?.weeklyHours as { openTime: string }[] | null | undefined) ??
    (studio.openingHours as { openTime: string }[] | null | undefined) ??
    [];

  const today = new Date();
  const currentWeekday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentWeekday);
  weekStart.setHours(0, 0, 0, 0);

  const entries = parsed.data.days
    .filter((day) => day.enabled)
    .map((day) => {
      const openTime = weeklyHours[day.weekday]?.openTime ?? "09:00";
      const openMinutes = parseTimeMinutes(openTime) ?? 0;
      const endMinutes = parseTimeMinutes(day.endTime) ?? 0;
      const baseDay = new Date(weekStart);
      baseDay.setDate(weekStart.getDate() + day.weekday);
      const startAt = addMinutes(baseDay, openMinutes);
      let endAt = addMinutes(baseDay, endMinutes);
      if (endMinutes <= openMinutes) {
        endAt = addMinutes(baseDay, endMinutes + 24 * 60);
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
