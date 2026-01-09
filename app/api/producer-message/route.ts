"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/user-notify";

const schema = z.object({
  producerUserId: z.string().min(1),
  message: z
    .string()
    .trim()
    .min(5, "Mesaj çok kısa")
    .max(300, "Mesaj 300 karakteri geçemez")
    .refine((value) => !containsUrl(value), "Mesajda link paylaşmayın"),
});

function containsUrl(value: string) {
  return /(https?:\/\/|www\.)/i.test(value);
}

async function getUserIdFromSession() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (sessionUser?.id) return sessionUser.id;
  if (sessionUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true },
    });
    return dbUser?.id ?? null;
  }
  return null;
}

async function getProducerStatus(userId: string) {
  const rows = await prisma.$queryRaw<{ status: string }[]>`
    SELECT status FROM "ProducerApplication"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0]?.status ?? null;
}

export async function POST(req: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  }

  const limiter = rateLimit(`producer-message:${userId}`, 10, 24 * 60 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Günlük mesaj limitine ulaştın." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { producerUserId, message } = parsed.data;
  if (producerUserId === userId) {
    return NextResponse.json({ error: "Kendine mesaj gönderemezsin." }, { status: 400 });
  }

  const producerStatus = await getProducerStatus(producerUserId);
  if (!producerStatus || (producerStatus !== "approved" && producerStatus !== "pending")) {
    return NextResponse.json({ error: "Üretici bulunamadı." }, { status: 404 });
  }

  const existing = await prisma.producerMessageRequest.findFirst({
    where: { fromUserId: userId, producerUserId, status: "pending" },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu üreticiye bekleyen bir mesajın var." }, { status: 409 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dayCount = await prisma.producerMessageRequest.count({
    where: { fromUserId: userId, createdAt: { gte: since } },
  });
  if (dayCount >= 10) {
    return NextResponse.json({ error: "Günlük mesaj limitine ulaştın." }, { status: 429 });
  }

  try {
    const created = await prisma.producerMessageRequest.create({
      data: {
        fromUserId: userId,
        producerUserId,
        message,
        status: "pending",
      },
    });
    const [producerUser, studentUser] = await prisma.user.findMany({
      where: { id: { in: [producerUserId, userId] } },
      select: { id: true, email: true, fullName: true, name: true },
    });
    const producerEmail = producerUser?.id === producerUserId ? producerUser?.email : studentUser?.email;
    const studentRecord = studentUser?.id === userId ? studentUser : producerUser;
    const studentName = studentRecord?.fullName || studentRecord?.name || studentRecord?.email || "Öğrenci";
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const producerPanelLink = `${baseUrl.replace(/\/$/, "")}/producer-panel/messages`;
    const emailText = `Studyom'da yeni mesaj isteğin var.

Gönderen: ${studentName}${studentRecord?.email ? ` (${studentRecord.email})` : ""}
Mesaj: ${message}

İsteği görüntülemek için: ${producerPanelLink}
`;
    await notifyUser(producerEmail, "Studyom'da yeni mesaj isteği", emailText);
    return NextResponse.json({
      ok: true,
      request: { id: created.id, status: created.status },
    });
  } catch (err) {
    console.error("producer message create failed", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
