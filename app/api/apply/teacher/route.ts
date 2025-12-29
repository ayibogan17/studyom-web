import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/admin-notify";

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

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  let userId = sessionUser?.id;
  let userEmail = sessionUser?.email?.toLowerCase() ?? null;
  let userName = sessionUser?.name ?? null;
  let dbUser =
    userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, fullName: true, name: true },
        })
      : null;
  if (!dbUser && sessionUser?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true, email: true, fullName: true, name: true },
    });
  }
  if (dbUser) {
    userId = dbUser.id;
    userEmail = dbUser.email ?? userEmail;
    userName = dbUser.fullName ?? dbUser.name ?? userName;
  }
  if (!userId) {
    return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  }
  if (!dbUser) {
    return NextResponse.json(
      { error: "Kullanıcı bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const rawLinks = Array.isArray(body?.links) ? body.links : [];
  const normalizedLinks: string[] = [];
  for (const raw of rawLinks) {
    if (typeof raw !== "string") continue;
    if (!raw.trim()) continue;
    const normalized = normalizeHttpUrl(raw);
    if (!normalized) {
      return NextResponse.json({ error: "Geçerli bir URL girin" }, { status: 400 });
    }
    normalizedLinks.push(normalized);
  }
  const parsed = schema.safeParse({ ...body, links: normalizedLinks });
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
    await prisma.teacherApplication.create({
      data: {
        userId,
        data: appData,
        status: "pending",
      },
    });

    await prisma.user.update({ where: { id: userId }, data: { isTeacher: true } });

    const emailText = [
      "Yeni hoca başvurusu alındı.",
      `Kullanıcı: ${userName || "-"}`,
      `E-posta: ${userEmail || "-"}`,
      `Şehir: ${appData.city ?? "-"}`,
      `Formatlar: ${appData.formats.join(", ")}`,
      `Seviyeler: ${appData.levels.join(", ")}`,
      `Enstrümanlar: ${appData.instruments.join(", ")}`,
      `Diller: ${appData.languages.length ? appData.languages.join(", ") : "-"}`,
      `Ücret beklentisi: ${appData.price ?? "-"}`,
      `Linkler: ${appData.links.length ? appData.links.join(", ") : "-"}`,
      `Tecrübe: ${appData.years ?? "-"}`,
      `Öğrenci sayısı: ${appData.students ?? "-"}`,
      "",
      "Kısa açıklama:",
      appData.statement,
    ].join("\n");
    await notifyAdmin("Yeni Hoca Başvurusu", emailText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("teacher apply error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
