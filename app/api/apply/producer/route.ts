import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/admin-notify";

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
    await prisma.producerApplication.create({
      data: {
        userId,
        data: appData,
        status: "pending",
        visibilityStatus: "draft",
      },
    });

    await prisma.user.update({ where: { id: userId }, data: { isProducer: true } });

    const emailText = [
      "Yeni üretici başvurusu alındı.",
      `Kullanıcı: ${userName || "-"}`,
      `E-posta: ${userEmail || "-"}`,
      `Şehir: ${appData.city ?? "-"}`,
      `Çalışma modları: ${appData.modes.join(", ")}`,
      `Çalışma türleri: ${appData.workTypes.join(", ")}`,
      `Üretim alanları: ${appData.areas.join(", ")}`,
      `Türler: ${appData.genres.length ? appData.genres.join(", ") : "-"}`,
      `Ücret beklentisi: ${appData.price ?? "-"}`,
      `Linkler: ${appData.links.length ? appData.links.join(", ") : "-"}`,
      `Proje sayısı: ${appData.projects ?? "-"}`,
      `Tecrübe: ${appData.years ?? "-"}`,
      "",
      "Kısa açıklama:",
      appData.statement,
    ].join("\n");
    await notifyAdmin("Yeni Üretici Başvurusu", emailText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("producer apply error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
