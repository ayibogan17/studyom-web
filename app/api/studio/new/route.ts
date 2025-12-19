import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { loadGeo } from "@/lib/geo";

const applicantRoles = ["Sahibiyim", "Ortağım", "Yetkili yöneticiyim"] as const;
const contactMethods = ["Phone", "WhatsApp", "Email"] as const;
const roomTypeOptions = ["Prova odası", "Kayıt odası", "Vokal kabini", "Kontrol odası", "Prodüksiyon odası"] as const;
const bookingModes = ["Onaylı talep (ben onaylarım)", "Direkt rezervasyon (sonra açılabilir)"] as const;
const priceRanges = ["500–750", "750–1000", "1000–1500", "1500+"] as const;

const urlOptional = z.string().trim().optional().or(z.literal(""));

const schema = z
  .object({
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => /^(?:90)?5\d{9}$/.test(v), "Telefon formatı hatalı"),
    applicantRole: z.enum(applicantRoles),
    studioName: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2),
    district: z.string().trim().min(1),
    neighborhood: z.string().trim().min(1),
    address: z.string().trim().min(10),
    mapsUrl: z.string().trim().url("Geçerli link"),
    contactMethods: z.array(z.enum(contactMethods)).min(1),
    contactHours: z.string().trim().max(80).optional(),
    roomsCount: z.number().int().min(1).max(10),
    roomTypes: z.array(z.enum(roomTypeOptions)).min(1),
    isFlexible: z.boolean(),
    weekdayHours: z.string().trim().max(30).optional(),
    weekendHours: z.string().trim().max(30).optional(),
    bookingMode: z.enum(bookingModes),
    equipment: z.object({
      drum: z.boolean(),
      guitarAmp: z.boolean(),
      bassAmp: z.boolean(),
      pa: z.boolean(),
      mic: z.boolean(),
    }),
    equipmentHighlight: z.string().trim().max(200).optional(),
    priceRange: z.enum(priceRanges),
    priceVaries: z.boolean(),
    linkPortfolio: urlOptional,
    linkGoogle: urlOptional,
    ackAuthority: z.boolean().refine((v) => v === true),
    ackPlatform: z.boolean().refine((v) => v === true),
  })
  .superRefine((data, ctx) => {
    if (!data.isFlexible) {
      if (!data.weekdayHours) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hafta içi saat girin", path: ["weekdayHours"] });
      }
      if (!data.weekendHours) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hafta sonu saat girin", path: ["weekendHours"] });
      }
    }
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const name = session?.user?.name || session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const data = parsed.data;
  const needsManualReview = !data.linkPortfolio && !data.linkGoogle;

  const openingHours =
    data.isFlexible
      ? [{ open: true, openTime: "Esnek", closeTime: "Esnek" }]
      : [
          { open: true, openTime: data.weekdayHours ?? "10:00", closeTime: data.weekdayHours ?? "22:00" },
          { open: true, openTime: data.weekendHours ?? "10:00", closeTime: data.weekendHours ?? "22:00" },
        ];

  const geo = loadGeo();
  const province = geo.find((p) => p.id === data.city);
  const district = province?.districts.find((d) => d.id === data.district);
  const neighborhood = district?.neighborhoods.find((n) => n.id === data.neighborhood);

  try {
    const studio = await prisma.studio.create({
      data: {
        name: data.studioName,
        city: province?.name ?? data.city,
        district: district?.name ?? data.district,
        address: `${neighborhood?.name ?? data.neighborhood} - ${data.address}`,
        ownerEmail: email,
        phone: data.phone,
        openingHours,
        isActive: false,
        notifications: {
          create: [
            { message: "Başvuru durumu: pending_review" },
            { message: `İletişim tercihleri: ${data.contactMethods.join(", ")}` },
            { message: `Booking modu: ${data.bookingMode}` },
            { message: `Oda sayısı: ${data.roomsCount}, tipler: ${data.roomTypes.join(", ")}` },
            { message: `Ekipman sinyali: ${Object.entries(data.equipment)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ") || "Belirtilmedi"}` },
            data.equipmentHighlight ? { message: `Öne çıkan ekipman: ${data.equipmentHighlight}` } : undefined,
            data.mapsUrl ? { message: `Maps: ${data.mapsUrl}` } : undefined,
            data.contactHours ? { message: `İletişim saatleri: ${data.contactHours}` } : undefined,
            { message: `Fiyat aralığı: ${data.priceRange}${data.priceVaries ? " (odaya göre değişir)" : ""}` },
            needsManualReview ? { message: "Manuel inceleme: evet (doğrulama linki yok)" } : undefined,
          ].filter(Boolean) as { message: string }[],
        },
      },
    });

    await prisma.user.update({
      where: { email },
      data: { isStudioOwner: true, fullName: name || undefined },
    });

    return NextResponse.json({ ok: true, studioId: studio.id });
  } catch (err) {
    console.error("studio create error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
