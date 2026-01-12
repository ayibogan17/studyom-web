import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/user-notify";

export const runtime = "nodejs";

const joinSchema = z.object({
  instrument: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      capacity: true,
      status: true,
      studio: { select: { name: true, ownerEmail: true, slug: true } },
    },
  });
  if (!jam || jam.status !== "active") {
    return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  }

  const existing = await prisma.openJamParticipant.findUnique({
    where: { jamId_userId: { jamId: id, userId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, status: existing.status });
  }

  const count = await prisma.openJamParticipant.count({ where: { jamId: id } });
  if (count >= jam.capacity) {
    return NextResponse.json({ error: "Kontenjan dolu" }, { status: 400 });
  }

  const participant = await prisma.openJamParticipant.create({
    data: {
      jamId: id,
      userId,
      instrument: parsed.data.instrument ?? null,
      level: parsed.data.level ?? null,
      status: "joined",
    },
  });

  if (jam.studio.ownerEmail) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, name: true, email: true },
    });
    const userName = user?.fullName || user?.name || user?.email || "Bir kullanıcı";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyom.net";
    const studioUrl = jam.studio.slug ? `${siteUrl}/studyo/${jam.studio.slug}` : siteUrl;
    const subject = "Jaminize katılan var";
    const text = [
      `Merhaba,`,
      ``,
      `${jam.title} için yeni bir katılım var.`,
      `Katılan: ${userName}`,
      `Stüdyo: ${jam.studio.name}`,
      ``,
      `Detayları panelden görebilirsin. Müzikle kal.`,
      ``,
      `Studyom ekibi`,
    ].join("\n");
    notifyUser(jam.studio.ownerEmail, subject, text);

    if (count + 1 >= jam.capacity) {
      const fullText = [
        `Merhaba,`,
        ``,
        `Ekip tamam! Artık rezervasyonunu beraber seçtiğiniz saat için ayarlama vakti geldi.`,
        `${studioUrl} buradan rezervasyonunu yap, Jam'e başla.`,
        ``,
        `Studyom ekibi`,
      ].join("\n");
      notifyUser(jam.studio.ownerEmail, "Ekip tamam!", fullText);
    }
  }

  return NextResponse.json({ ok: true, id: participant.id });
}
