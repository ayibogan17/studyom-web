import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const productionAreas = [
  "Davul yazımı",
  "Bas yazımı",
  "Gitar yazımı",
  "Telli enstrüman yazımı",
  "Üflemeli enstrüman yazımı",
  "Yaylı enstrüman yazımı",
  "Beat yapımı",
  "Aranje",
  "Müzik prodüksiyonu",
  "Mixing",
  "Mastering",
  "Sound design",
  "Beste & söz yazımı",
  "DJ edit / set hazırlama",
] as const;

const workTypes = [
  "Şarkıya ekleme yapma (enstrüman, synth vs)",
  "Var olan projeye katkı",
  "Baştan sona prodüksiyon",
  "Revizyon / edit",
] as const;
const workingModes = ["Online", "Kendi stüdyomda", "Müşteri stüdyosunda"] as const;
const genreOptions = [
  "Rock",
  "Metal",
  "Pop",
  "Hip-hop / Rap",
  "Electronic",
  "Jazz",
  "Folk / Türk halk müziği",
  "Classical",
  "Experimental",
] as const;
const priceOptions = ["Proje bazlı çalışırım", "Saatlik çalışırım", "İşe göre değişir"] as const;
const projectCountOptions = ["1-5", "6-20", "20+"] as const;
const yearsOptions = ["0-1", "2-4", "5-9", "10+"] as const;

const schema = z
  .object({
    areas: z.array(z.enum(productionAreas)).min(1).max(10),
    workTypes: z.array(z.enum(workTypes)).min(1),
    modes: z.array(z.enum(workingModes)).min(1),
    city: z.string().optional(),
    genres: z.array(z.enum(genreOptions)).max(5).optional().default([]),
    statement: z.string().min(10).max(400),
    links: z.array(z.string().url()).max(5).optional().default([]),
    projects: z.enum(projectCountOptions).optional(),
    years: z.enum(yearsOptions).optional(),
    price: z.enum(priceOptions).optional(),
    acknowledge: z.literal(true),
  })
  .superRefine((data, ctx) => {
    const linkCount = (data.links?.filter((l) => l.trim().length > 0).length ?? 0);
    if (linkCount === 0) {
      if (!data.projects) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gerekli", path: ["projects"] });
      if (!data.years) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gerekli", path: ["years"] });
    }
    if ((data.modes.includes("Kendi stüdyomda") || data.modes.includes("Müşteri stüdyosunda")) && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  let userId = sessionUser?.id;
  if (!userId && sessionUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true },
    });
    userId = dbUser?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const data = parsed.data;
  const appData = {
    areas: data.areas,
    workTypes: data.workTypes,
    modes: data.modes,
    city: data.city ?? null,
    genres: data.genres ?? [],
    statement: data.statement,
    links: data.links ?? [],
    projects: data.projects ?? null,
    years: data.years ?? null,
    price: data.price ?? null,
    status: "pending" as const,
  };

  try {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ProducerApplication" ("id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL, "data" JSONB NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now())'
    );

    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "ProducerApplication" ("userId", "data", "status") VALUES (${userId}, ${JSON.stringify(
        appData,
      )}, 'pending')`
    );

    await prisma.user.update({ where: { id: userId }, data: { isProducer: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("producer apply error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
