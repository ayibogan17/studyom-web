import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  type: z.enum(["manual_block", "reservation"]).optional(),
  title: z.string().max(120).optional().nullable(),
  status: z.string().max(40).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

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

export async function PATCH(
  req: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> },
) {
  const resolved = await Promise.resolve(params);
  const blockId = resolved?.id;
  if (!blockId) {
    return NextResponse.json({ error: "Blok bulunamadı" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const existing = await prisma.studioCalendarBlock.findUnique({
    where: { id: blockId },
  });
  if (!existing || existing.studioId !== studio.id) {
    return NextResponse.json({ error: "Blok bulunamadı" }, { status: 404 });
  }

  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : existing.startAt;
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : existing.endAt;
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Zaman aralığı geçersiz" }, { status: 400 });
  }

  const type = parsed.data.type ?? existing.type;

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
  });
  const openingHours =
    (settings?.weeklyHours as OpeningHours[] | null | undefined) ??
    (studio.openingHours as OpeningHours[] | null | undefined) ??
    [];

  if (type === "reservation") {
    const cutoff = settings?.dayCutoffHour ?? 4;
    if (!isWithinOpeningHours(startAt, endAt, openingHours, cutoff)) {
      return NextResponse.json({ error: "Rezervasyon saatleri açık saatler dışında." }, { status: 400 });
    }
  }

  const overlap = await prisma.studioCalendarBlock.findFirst({
    where: {
      roomId: existing.roomId,
      id: { not: existing.id },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlap) {
    return NextResponse.json({ error: "Bu saatlerde başka bir kayıt var." }, { status: 409 });
  }

  const updated = await prisma.studioCalendarBlock.update({
    where: { id: existing.id },
    data: {
      startAt,
      endAt,
      type,
      title: parsed.data.title ?? existing.title,
      status: parsed.data.status ?? existing.status,
      note: parsed.data.note ?? existing.note,
    },
  });

  return NextResponse.json({
    block: {
      id: updated.id,
      roomId: updated.roomId,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      type: updated.type,
      title: updated.title ?? "",
      status: updated.status ?? null,
      note: updated.note ?? "",
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> },
) {
  const resolved = await Promise.resolve(params);
  const blockId = resolved?.id;
  if (!blockId) {
    return NextResponse.json({ error: "Blok bulunamadı" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true },
  });
  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  const existing = await prisma.studioCalendarBlock.findUnique({
    where: { id: blockId },
  });
  if (!existing || existing.studioId !== studio.id) {
    return NextResponse.json({ error: "Blok bulunamadı" }, { status: 404 });
  }

  await prisma.studioCalendarBlock.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
