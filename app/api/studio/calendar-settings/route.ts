import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const openingHourSchema = z.object({
  open: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

const schema = z.object({
  slotStepMinutes: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]).optional(),
  dayCutoffHour: z.number().int().min(0).max(6).optional(),
  timezone: z.string().min(2).max(64).optional(),
  happyHourEnabled: z.boolean().optional(),
  weeklyHours: z.array(openingHourSchema).length(7).optional(),
});

const defaultHours = Array.from({ length: 7 }, () => ({
  open: true,
  openTime: "09:00",
  closeTime: "21:00",
}));

const normalizeHours = (value?: typeof defaultHours | null) =>
  Array.isArray(value) && value.length === 7 ? value : defaultHours;

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 });
  }

  const settings = await prisma.studioCalendarSettings.findUnique({
    where: { studioId: studio.id },
  });

  return NextResponse.json({
    settings: {
      slotStepMinutes: settings?.slotStepMinutes ?? 60,
      dayCutoffHour: settings?.dayCutoffHour ?? 4,
      timezone: settings?.timezone ?? "Europe/Istanbul",
      happyHourEnabled: settings?.happyHourEnabled ?? false,
      weeklyHours: normalizeHours(
        (settings?.weeklyHours as typeof defaultHours | null | undefined) ??
          (studio.openingHours as typeof defaultHours | null | undefined) ??
          null,
      ),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, openingHours: true },
  });
  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const weeklyHours = parsed.data.weeklyHours;
  if (weeklyHours) {
    await prisma.studio.update({
      where: { id: studio.id },
      data: { openingHours: weeklyHours },
    });
  }

  const updated = await prisma.studioCalendarSettings.upsert({
    where: { studioId: studio.id },
    update: {
      slotStepMinutes: parsed.data.slotStepMinutes,
      dayCutoffHour: parsed.data.dayCutoffHour,
      timezone: parsed.data.timezone,
      happyHourEnabled: parsed.data.happyHourEnabled,
      weeklyHours: weeklyHours ?? undefined,
    },
    create: {
      studioId: studio.id,
      slotStepMinutes: parsed.data.slotStepMinutes ?? 60,
      dayCutoffHour: parsed.data.dayCutoffHour ?? 4,
      timezone: parsed.data.timezone ?? "Europe/Istanbul",
      happyHourEnabled: parsed.data.happyHourEnabled ?? false,
      weeklyHours: weeklyHours ?? (studio.openingHours as typeof defaultHours | null) ?? defaultHours,
    },
  });

  return NextResponse.json({
    settings: {
      slotStepMinutes: updated.slotStepMinutes,
      dayCutoffHour: updated.dayCutoffHour,
      timezone: updated.timezone,
      happyHourEnabled: updated.happyHourEnabled ?? false,
      weeklyHours: normalizeHours(
        (updated.weeklyHours as typeof defaultHours | null | undefined) ??
          (studio.openingHours as typeof defaultHours | null | undefined) ??
          null,
      ),
    },
  });
}
