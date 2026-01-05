import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

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
const yearsOptions = ["0-1", "2-4", "5-9", "10+"] as const;
const projectOptions = ["1-5", "6-20", "20+"] as const;

const cityOptions = [
  "İstanbul",
  "İzmir",
  "Ankara",
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkâri",
  "Hatay",
  "Iğdır",
  "Isparta",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
] as const;

const schema = z
  .object({
    areas: z.array(z.enum(productionAreas)).min(1).max(10),
    workTypes: z.array(z.enum(workTypes)).min(1),
    modes: z.array(z.enum(workingModes)).min(1),
    city: z.enum(cityOptions).optional().or(z.literal("")),
    genres: z.array(z.enum(genreOptions)),
    price: z.enum(priceOptions).optional().or(z.literal("")),
    years: z.enum(yearsOptions).optional().or(z.literal("")),
    projects: z.enum(projectOptions).optional().or(z.literal("")),
    statement: z.string().min(10).max(200),
    bio: z.string().max(1500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.modes.some((mode) => mode !== "Online") && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const application = await prisma.producerApplication.findFirst({
    where: { userId, status: { in: ["approved", "pending"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }

  const data = (application.data || {}) as Record<string, unknown>;
  const nextData = {
    ...data,
    areas: parsed.data.areas,
    workTypes: parsed.data.workTypes,
    modes: parsed.data.modes,
    city: parsed.data.city || null,
    genres: parsed.data.genres,
    price: parsed.data.price || null,
    years: parsed.data.years || null,
    projects: parsed.data.projects || null,
    statement: parsed.data.statement,
    bio: parsed.data.bio || null,
  };

  await prisma.producerApplication.update({
    where: { id: application.id },
    data: { data: nextData },
  });

  return NextResponse.json({ ok: true });
}
