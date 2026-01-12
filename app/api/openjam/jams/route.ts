import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  studioId: z.string().min(1),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(240),
  neededInstruments: z.array(z.string().min(1)).min(1),
  note: z.string().max(200).optional().nullable(),
  genre: z.string().max(20).optional().nullable(),
  playlistLink: z.string().optional().nullable(),
  creatorLevel: z.string().optional().nullable(),
  creatorInstrument: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const instrument = searchParams.get("instrument");
  const dateRange = searchParams.get("date_range");

  const now = new Date();
  let rangeFilter: { gte?: Date; lt?: Date } | undefined;
  if (dateRange === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    rangeFilter = { gte: start, lt: end };
  } else if (dateRange === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    rangeFilter = { gte: start, lt: end };
  }

  if (process.env.NODE_ENV !== "production") {
    const existingCount = await prisma.openJam.count({ where: { status: "active" } });
    if (existingCount < 8) {
      const [creator, studios] = await Promise.all([
        prisma.user.findFirst({ select: { id: true } }),
        prisma.studio.findMany({
          where: { isActive: true, visibilityStatus: "published" },
          select: { id: true, name: true, city: true, district: true },
          take: 8,
        }),
      ]);
      if (creator && studios.length) {
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
        const genres = ["Rock", "Indie", "Blues", "Metal", "Funk", "Pop", "Jazz", "Punk"];
        const levels = [
          "enstrümanı tutmayı biliyorum",
          "takılacak kadar biliyorum",
          "iyiyim ya bence",
          "öttürürüm",
        ];
        const instruments = ["Gitar", "Bas", "Davul", "Klavye", "Vokal"];
        const neededCount = Math.max(0, 8 - existingCount);
        const jams = Array.from({ length: neededCount }, (_, index) => {
          const studio = studios[index % studios.length];
          const needed = instruments.filter((_, i) => (i + index) % 2 === 0).slice(0, 3);
          return prisma.openJam.create({
            data: {
              createdByUserId: creator.id,
              studioId: studio.id,
              title: `Jam @ ${studio.name}`,
              note: "Hızlı jam için katıl.",
              genre: index % 2 === 0 ? genres[index % genres.length] : null,
              playlistLink:
                index % 2 === 1
                  ? "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                  : null,
              creatorLevel: levels[index % levels.length],
              startAt: new Date(baseDate.getTime() + index * 60 * 60 * 1000),
              durationMinutes: 60,
              neededInstruments: needed.length ? needed : ["Gitar", "Davul"],
              city: studio.city ?? "İstanbul",
              district: studio.district ?? null,
              participants: {
                create: {
                  userId: creator.id,
                  status: "joined",
                },
              },
            },
          });
        });
        await prisma.$transaction(jams);
      }
    }
  }

  const jams = await prisma.openJam.findMany({
    where: {
      status: "active",
      ...(city ? { city } : {}),
      ...(instrument ? { neededInstruments: { has: instrument } } : {}),
      ...(rangeFilter ? { startAt: rangeFilter } : {}),
    },
    orderBy: { startAt: "asc" },
    take: 50,
    select: {
      id: true,
      title: true,
      note: true,
      genre: true,
      playlistLink: true,
      creatorLevel: true,
      startAt: true,
      durationMinutes: true,
      neededInstruments: true,
      capacity: true,
      createdByUser: { select: { name: true, fullName: true, image: true } },
      studio: { select: { name: true, city: true, district: true } },
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json({ jams });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const studio = await prisma.studio.findUnique({
    where: { id: parsed.data.studioId },
    select: { id: true, name: true, city: true, district: true },
  });
  if (!studio) return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });

  const title = `Jam @ ${studio.name}`;
  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  const jam = await prisma.$transaction(async (tx) => {
    const capacity = parsed.data.neededInstruments.length + 1;
    const created = await tx.openJam.create({
      data: {
        createdByUserId: userId,
        studioId: studio.id,
        title,
        note: parsed.data.note ?? null,
        genre: parsed.data.genre ?? null,
        playlistLink: parsed.data.playlistLink ?? null,
        creatorLevel: parsed.data.creatorLevel ?? null,
        startAt,
        durationMinutes: parsed.data.durationMinutes,
        neededInstruments: parsed.data.neededInstruments,
        city: studio.city ?? "İstanbul",
        district: studio.district ?? null,
        capacity,
      },
    });
    await tx.openJamParticipant.create({
      data: {
        jamId: created.id,
        userId,
        instrument: parsed.data.creatorInstrument ?? null,
        status: "joined",
      },
    });
    return created;
  });

  return NextResponse.json({ id: jam.id });
}
