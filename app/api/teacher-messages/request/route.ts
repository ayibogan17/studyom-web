import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getTeacherIdentityBySlug } from "@/lib/teacher-db";
import { notifyUser } from "@/lib/user-notify";

export const runtime = "nodejs";

const schema = z.object({
  teacherSlug: z.string().trim().min(1),
  message: z.string().trim().min(1).max(400),
});

const urlLike = /(https?:\/\/|www\.)/i;
const scriptLike = /<\s*script/i;
const declineCooldownMs = 1000 * 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { teacherSlug } = parsed.data;
  const messageText = parsed.data.message.trim();

  if (urlLike.test(messageText) || scriptLike.test(messageText)) {
    return NextResponse.json({ error: "İlk mesajda link kullanılamaz" }, { status: 400 });
  }

  const perDay = rateLimit(`teacher-request:${userId}`, 10, 1000 * 60 * 60 * 24);
  if (!perDay.ok) {
    return NextResponse.json({ error: "Günlük mesaj limitine ulaştın." }, { status: 429 });
  }

  const identity = await getTeacherIdentityBySlug(teacherSlug);
  if (!identity || identity.status !== "approved") {
    return NextResponse.json({ error: "Hoca bulunamadı" }, { status: 404 });
  }
  if (identity.userId === userId) {
    return NextResponse.json({ error: "Kendi profilin için mesaj gönderemezsin." }, { status: 400 });
  }

  const existingPending = await prisma.teacherMessageRequest.findFirst({
    where: {
      studentUserId: userId,
      teacherUserId: identity.userId,
      status: "pending",
    },
  });
  if (existingPending) {
    return NextResponse.json({ error: "Bekleyen bir mesaj isteğin var." }, { status: 409 });
  }

  const existingThread = await prisma.teacherThread.findUnique({
    where: {
      teacherSlug_studentUserId: {
        teacherSlug,
        studentUserId: userId,
      },
    },
    select: { id: true },
  });
  if (existingThread) {
    return NextResponse.json({ error: "Bu hoca ile sohbet zaten açık." }, { status: 409 });
  }

  const lastDeclined = await prisma.teacherMessageRequest.findFirst({
    where: {
      studentUserId: userId,
      teacherUserId: identity.userId,
      status: "declined",
    },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  if (lastDeclined && Date.now() - lastDeclined.updatedAt.getTime() < declineCooldownMs) {
    return NextResponse.json({ error: "Bu hoca için yeni istek göndermek için biraz beklemelisin." }, { status: 429 });
  }

  const request = await prisma.teacherMessageRequest.create({
    data: {
      studentUserId: userId,
      teacherUserId: identity.userId,
      teacherSlug,
      messageText,
      status: "pending",
    },
  });

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true, name: true },
  });
  const studentName = student?.fullName || student?.name || student?.email || "Öğrenci";
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const teacherPanelLink = `${baseUrl.replace(/\/$/, "")}/teacher-panel/messages`;
  const emailText = `Studyom'da yeni mesaj isteğin var.

Öğrenci: ${studentName}${student?.email ? ` (${student.email})` : ""}
Mesaj: ${messageText}

İsteği görüntülemek için: ${teacherPanelLink}
`;
  await notifyUser(identity.userEmail, "Studyom'da yeni mesaj isteği", emailText);

  return NextResponse.json({
    ok: true,
    request: {
      id: request.id,
      status: request.status,
    },
  });
}
