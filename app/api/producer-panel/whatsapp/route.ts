import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const phoneDigits = (value: string) => value.replace(/\D/g, "");

const schema = z.object({
  whatsappNumber: z.string().optional().or(z.literal("")),
  whatsappEnabled: z.boolean().optional(),
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

  const whatsappNumberRaw = parsed.data.whatsappNumber ?? "";
  const whatsappNumber = phoneDigits(whatsappNumberRaw);
  const whatsappEnabled = Boolean(parsed.data.whatsappEnabled);

  if (whatsappEnabled && !/^(?:90)?5\d{9}$/.test(whatsappNumber)) {
    return NextResponse.json({ error: "Geçerli bir WhatsApp numarası girin" }, { status: 400 });
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
    whatsappNumber: whatsappNumber || null,
    whatsappEnabled,
  };

  await prisma.producerApplication.update({
    where: { id: application.id },
    data: { data: nextData },
  });

  return NextResponse.json({ ok: true });
}
