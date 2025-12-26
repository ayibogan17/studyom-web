import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/user-notify";

const schema = z.object({
  studioId: z.string().min(1),
});

function isStudioOpenForTeachers(rooms: { extrasJson: unknown }[]) {
  return rooms.some((room) => {
    if (!room?.extrasJson || typeof room.extrasJson !== "object") return false;
    const extras = room.extrasJson as { acceptsCourses?: boolean };
    return extras.acceptsCourses === true;
  });
}

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

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const application = await prisma.teacherApplication.findFirst({
    where: { userId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  if (!application) {
    return NextResponse.json({ error: "Onaylı başvuru bulunamadı" }, { status: 403 });
  }

  const studio = await prisma.studio.findUnique({
    where: { id: parsed.data.studioId },
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      ownerEmail: true,
      rooms: { select: { extrasJson: true } },
    },
  });
  if (!studio) {
    return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
  }
  if (!isStudioOpenForTeachers(studio.rooms)) {
    return NextResponse.json({ error: "Bu stüdyo hocalara açık değil." }, { status: 400 });
  }

  const link = await prisma.teacherStudioLink.upsert({
    where: { teacherUserId_studioId: { teacherUserId: userId, studioId: studio.id } },
    create: { teacherUserId: userId, studioId: studio.id, status: "pending" },
    update: { status: "pending" },
    include: { studio: { select: { id: true, name: true, city: true, district: true } } },
  });

  const teacherName = dbUser.fullName || dbUser.name || dbUser.email || "Bir hoca";
  const linkUrl = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"}/notifications`;
  const emailText = `Merhaba,\n\n${teacherName} stüdyonuzda ders vermek istediğini bildirdi.\nUygun görürseniz onaylayabilir veya reddedebilirsiniz.\n\nTalebi yönetmek için: ${linkUrl}\n`;
  await notifyUser(studio.ownerEmail, "Yeni hoca stüdyo talebi", emailText);

  return NextResponse.json({ link });
}
