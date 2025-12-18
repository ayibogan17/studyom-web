import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName: z.string().min(2, "Ad Soyad gerekli"),
  city: z.string().min(2, "Şehir gerekli"),
  intent: z.array(z.string()).min(1, "En az bir tercih seçin"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { fullName, city, intent } = parsed.data;
  try {
    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: {
        fullName,
        name: fullName,
        city,
        intent,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("profile complete error", err);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
