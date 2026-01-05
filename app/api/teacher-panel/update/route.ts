import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

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
const priceOptions = [
  "Saatlik 500–750 TL",
  "Saatlik 750–1000 TL",
  "Saatlik 1000 TL+",
  "Ücreti öğrenciyle konuşurum",
] as const;
const yearOptions = ["0-1", "2-4", "5-9", "10+"] as const;
const studentOptions = ["Henüz çalışmadım", "1-5", "6-20", "20+"] as const;

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

const linkSchema = z.string().trim().min(1).max(300);

const schema = z
  .object({
    instruments: z.array(z.enum(instrumentOptions)).min(1).max(10),
    levels: z.array(z.enum(levelOptions)).min(1),
    formats: z.array(z.enum(formatOptions)).min(1),
    city: z.enum(cityOptions).optional().or(z.literal("")),
    languages: z.array(z.enum(languageOptions)),
    price: z.enum(priceOptions).optional().or(z.literal("")),
    statement: z.string().min(10).max(200),
    bio: z.string().max(1500).optional().or(z.literal("")),
    links: z.array(linkSchema).max(3),
    years: z.enum(yearOptions).optional().or(z.literal("")),
    students: z.enum(studentOptions).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.formats.includes("Yüz yüze") && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
    if (data.links.length === 0) {
      if (!data.years) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["years"] });
      if (!data.students) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["students"] });
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

  const application = await prisma.teacherApplication.findFirst({
    where: { userId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }

  const data = (application.data || {}) as Record<string, unknown>;
  const nextData = {
    ...data,
    instruments: parsed.data.instruments,
    levels: parsed.data.levels,
    formats: parsed.data.formats,
    city: parsed.data.city || null,
    languages: parsed.data.languages,
    price: parsed.data.price || null,
    statement: parsed.data.statement,
    bio: parsed.data.bio || null,
    links: parsed.data.links,
    years: parsed.data.years || null,
    students: parsed.data.students || null,
  };

  await prisma.teacherApplication.update({
    where: { id: application.id },
    data: { data: nextData },
  });

  return NextResponse.json({ ok: true });
}
