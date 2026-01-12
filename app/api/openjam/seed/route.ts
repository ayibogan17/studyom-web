import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const existing = await prisma.openJam.count();
  if (existing > 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  const creator = await prisma.user.findFirst({ select: { id: true } });
  const studios = await prisma.studio.findMany({
    where: { isActive: true, visibilityStatus: "published" },
    select: { id: true, name: true, city: true, district: true },
    take: 3,
  });
  if (!creator || !studios.length) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  const created = await prisma.$transaction(
    studios.map((studio, index) =>
      prisma.openJam.create({
        data: {
          createdByUserId: creator.id,
          studioId: studio.id,
          title: `Jam @ ${studio.name}`,
          note: "Hızlı jam için katıl.",
          startAt: new Date(baseDate.getTime() + index * 2 * 60 * 60 * 1000),
          durationMinutes: 60,
          neededInstruments: ["Gitar", "Bas", "Davul"].slice(0, 2 + (index % 2)),
          city: studio.city ?? "İstanbul",
          district: studio.district ?? null,
          participants: {
            create: {
              userId: creator.id,
              status: "joined",
            },
          },
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, created: created.length });
}
