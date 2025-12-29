import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const phoneDigits = (value: string) => value.replace(/\D/g, "");

const schema = z.object({
  fullName: z.string().min(2, "Ad Soyad gerekli").max(60).optional(),
  city: z.string().min(2, "Şehir gerekli").optional(),
  phone: z.string().optional(),
  image: z.string().url("Geçerli bir görsel linki girin").optional().nullable(),
}).superRefine((data, ctx) => {
  if (!data.fullName && !data.city && data.image === undefined && data.phone === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Değişiklik yok", path: ["fullName"] });
  }
  if (data.phone !== undefined) {
    const digits = phoneDigits(data.phone);
    if (!/^(?:90)?5\d{9}$/.test(digits)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Geçerli bir telefon girin", path: ["phone"] });
    }
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

  const { fullName, city, phone, image } = parsed.data;
  const updateData: { fullName?: string; name?: string; city?: string; phone?: string; image?: string | null } = {};
  if (fullName) {
    updateData.fullName = fullName;
    updateData.name = fullName;
  }
  if (city) {
    updateData.city = city;
  }
  if (phone !== undefined) {
    updateData.phone = phoneDigits(phone);
  }
  if (image !== undefined) {
    updateData.image = image;
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("profile update error", err);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
