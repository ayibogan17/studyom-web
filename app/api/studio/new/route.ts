import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { loadGeo } from "@/lib/geo";
import { notifyAdmin } from "@/lib/admin-notify";
import { createStudioSlug } from "@/lib/studio-slug";
import { mergeRoles, normalizeRoles } from "@/lib/roles";

const applicantRoles = ["Sahibiyim", "Ortağım", "Yetkili yöneticiyim"] as const;
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
    linkPortfolio: urlOptional,
    linkGoogle: urlOptional,
    ackAuthority: z.boolean().refine((v) => v === true),
    ackPlatform: z.boolean().refine((v) => v === true),
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const rawEmail = session?.user?.email;
  const email = rawEmail?.toLowerCase();
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

  const openingHours = [{ open: true, openTime: "Esnek", closeTime: "Esnek" }];

  const geo = loadGeo();
  const province = geo.find((p) => p.id === data.city);
  const district = province?.districts.find((d) => d.id === data.district);
  const neighborhood = district?.neighborhoods.find((n) => n.id === data.neighborhood);

  const baseSlug = createStudioSlug(data.studioName);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.studio.findUnique({ where: { slug } })) {
    slug = createStudioSlug(data.studioName, suffix);
    suffix += 1;
  }

  try {
    const studio = await prisma.studio.create({
      data: {
        name: data.studioName,
        slug,
        city: province?.name ?? data.city,
        district: district?.name ?? data.district,
        address: `${neighborhood?.name ?? data.neighborhood} - ${data.address}`,
        ownerEmail: email,
        phone: data.phone,
        openingHours,
        isActive: false,
        applicationStatus: "pending",
        visibilityStatus: "draft",
        notifications: {
          create: [
            { message: "Başvuru durumu: pending_review" },
            data.linkPortfolio ? { message: `Instagram/Web: ${data.linkPortfolio}` } : undefined,
            data.linkGoogle ? { message: `Google Business: ${data.linkGoogle}` } : undefined,
            data.mapsUrl ? { message: `Maps: ${data.mapsUrl}` } : undefined,
            needsManualReview ? { message: "Manuel inceleme: evet (doğrulama linki yok)" } : undefined,
          ].filter(Boolean) as { message: string }[],
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, roles: true, role: true, isTeacher: true, isProducer: true, isStudioOwner: true },
    });
    const updateData = user
      ? {
          isStudioOwner: true,
          roles: { set: mergeRoles(normalizeRoles(user), ["studio_owner"]) },
          role: "STUDIO" as const,
          fullName: name || undefined,
        }
      : { isStudioOwner: true, fullName: name || undefined };
    await prisma.user.update({
      where: { email },
      data: updateData,
    });

    const emailText = [
      "Yeni stüdyo başvurusu alındı.",
      `Başvuran: ${name || "-"}`,
      `E-posta: ${rawEmail || email}`,
      `Telefon: ${data.phone}`,
      `Rol: ${data.applicantRole}`,
      `Stüdyo adı: ${data.studioName}`,
      `Şehir: ${province?.name ?? data.city}`,
      `İlçe: ${district?.name ?? data.district}`,
      `Mahalle: ${neighborhood?.name ?? data.neighborhood}`,
      `Açık adres: ${data.address}`,
      `Google Maps: ${data.mapsUrl}`,
      data.linkPortfolio ? `Instagram/Web: ${data.linkPortfolio}` : null,
      data.linkGoogle ? `Google Business: ${data.linkGoogle}` : null,
      needsManualReview ? "Manuel inceleme: evet (doğrulama linki yok)" : null,
    ]
      .filter(Boolean)
      .join("\n");
    await notifyAdmin("Yeni Stüdyo Başvurusu", emailText);

    return NextResponse.json({ ok: true, studioId: studio.id });
  } catch (err) {
    console.error("studio create error", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
