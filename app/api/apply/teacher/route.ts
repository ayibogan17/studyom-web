import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const instrumentOptions = [
  "Keman",
  "Viyola",
  "Viyolonsel",
  "Kontrbas",
  "Flüt",
  "Yan flüt",
  "Klarnet",
  "Saksafon",
  "Trompet",
  "Trombon",
  "Bağlama (kısa/uzun sap)",
  "Cura",
  "Divan sazı",
  "Ud",
  "Kanun",
  "Ney",
  "Kabak kemane",
  "Gitar (elektro/akustik)",
  "Bas gitar",
  "Davul",
  "Piyano / Klavye",
  "Müzik prodüksiyonu",
  "Beat yapımı",
  "Aranje",
  "Mixing",
  "Mastering",
  "Sound design",
  "Müzik teorisi",
  "Armoni",
  "Solfej",
  "Nota okuma",
  "Ritim & tempo",
  "Ear training (kulak eğitimi)",
  "Beste & söz yazımı",
  "DJ’lik",
] as const;

const levelOptions = ["Başlangıç", "Orta", "İleri"] as const;
const formatOptions = ["Yüz yüze", "Online"] as const;
const languageOptions = ["Türkçe", "İngilizce"] as const;
const priceOptions = ["Saatlik 500–750 TL", "Saatlik 750–1000 TL", "Saatlik 1000 TL+", "Ücreti öğrenciyle konuşurum"] as const;

const schema = z
  .object({
    instruments: z.array(z.enum(instrumentOptions)).min(1).max(10),
    levels: z.array(z.enum(levelOptions)).min(1),
    formats: z.array(z.enum(formatOptions)).min(1),
    city: z.string().optional(),
    languages: z.array(z.enum(languageOptions)).optional().default([]),
    price: z.enum(priceOptions).optional(),
    statement: z.string().min(10).max(400),
    links: z.array(z.string().url()).max(3).optional().default([]),
    years: z.enum(["0-1", "2-4", "5-9", "10+"]).optional(),
    students: z.enum(["Henüz çalışmadım", "1-5", "6-20", "20+"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.formats.includes("Yüz yüze") && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
    if ((data.links?.length ?? 0) === 0) {
      if (!data.years) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["years"] });
      if (!data.students) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["students"] });
    }
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
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
    instruments: data.instruments,
    levels: data.levels,
    formats: data.formats,
    city: data.city ?? null,
    languages: data.languages ?? [],
    price: data.price ?? null,
    statement: data.statement,
    links: data.links ?? [],
    years: data.years ?? null,
    students: data.students ?? null,
    status: "pending" as const,
  };

  try {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TeacherApplication" ("id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL, "data" JSONB NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now())'
    );

    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "TeacherApplication" ("userId", "data", "status") VALUES (${userId}, ${JSON.stringify(
        appData,
      )}, 'pending')`
    );

    await prisma.user.update({ where: { id: userId }, data: { isTeacher: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("teacher apply error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
