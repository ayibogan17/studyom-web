import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

export const runtime = "nodejs";

const schema = z.object({
  threadId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Mesaj gerekli")
    .max(1200, "Mesaj çok uzun"),
  roomId: z.string().trim().optional(),
});

const scriptLike = /<\s*script/i;

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const baseUrl =
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  (process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

function snippet(text: string) {
  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  let userId = sessionUser?.id ?? null;
  let dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, name: true },
      })
    : null;
  if (!dbUser && sessionUser?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true, email: true, fullName: true, name: true },
    });
  }
  if (!dbUser && process.env.NODE_ENV !== "production" && sessionUser?.email) {
    dbUser = await prisma.user.create({
      data: {
        email: sessionUser.email.toLowerCase(),
        name: sessionUser.name ?? null,
      },
      select: { id: true, email: true, fullName: true, name: true },
    });
  }
  if (!dbUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  userId = dbUser.id;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const messageBody = parsed.data.body.trim();
  if (scriptLike.test(messageBody)) {
    return NextResponse.json({ error: "Mesajda script bulunamaz" }, { status: 400 });
  }

  const perHour = rateLimit(`studio-msg:${userId}`, 10, 60 * 60 * 1000);
  if (!perHour.ok) {
    return NextResponse.json({ error: "Çok hızlı. Lütfen biraz bekleyin." }, { status: 429 });
  }

  const thread = await prisma.studioThread.findUnique({
    where: { id: parsed.data.threadId },
    include: {
      studio: { select: { id: true, name: true, ownerEmail: true } },
      studentUser: { select: { fullName: true, name: true, email: true } },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
  }

  if (thread.studentUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (thread.locked) {
    return NextResponse.json({ error: "Sohbet kilitli." }, { status: 423 });
  }

  const recent = await prisma.studioMessage.findFirst({
    where: {
      threadId: thread.id,
      senderUserId: userId,
      createdAt: { gt: new Date(Date.now() - 20 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ error: "Lütfen biraz bekleyin." }, { status: 429 });
  }

  const message = await prisma.studioMessage.create({
    data: {
      threadId: thread.id,
      senderRole: "student",
      senderUserId: userId,
      body: messageBody,
    },
  });

  await prisma.studioThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  try {
    await prisma.contactEvent.create({
      data: {
        entityType: "studio",
        entityId: thread.studioId,
        userId,
        roomId: parsed.data.roomId || null,
        channel: "in_app",
      },
    });
    await prisma.studioContactEvent.create({
      data: {
        studioId: thread.studioId,
        userId,
        roomId: parsed.data.roomId || null,
        channel: "in_app",
      },
    });
  } catch (err) {
    console.error("studio contact event failed", err);
  }

  const ownerEmail = thread.studio.ownerEmail?.toLowerCase() || "";
  if (resend && ownerEmail) {
    const studentName =
      thread.studentUser.fullName ||
      thread.studentUser.name ||
      thread.studentUser.email ||
      dbUser.fullName ||
      dbUser.name ||
      dbUser.email ||
      "Kullanıcı";
    const studentEmail = thread.studentUser.email || dbUser.email || null;
    const threadLink = `${baseUrl}/dashboard/messages/${thread.id}`;
    const text = `Studyom'da yeni bir mesaj aldınız.\n\nGönderen: ${studentName}${studentEmail ? ` (${studentEmail})` : ""}\nMesaj: ${snippet(messageBody)}\n\nMesajı görüntülemek için: ${threadLink}\n`;
    try {
      await resend.emails.send({
        from: leadFrom,
        to: [ownerEmail],
        replyTo: studentEmail || undefined,
        subject: "Studyom'da yeni mesaj",
        text,
      });
    } catch (err) {
      console.error("studio message email error", err);
    }
  }

  return NextResponse.json({
    ok: true,
    threadId: thread.id,
    message: {
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      createdAt: message.createdAt,
    },
  });
}
