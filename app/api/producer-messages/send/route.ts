import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getProducerIdentityBySlug } from "@/lib/producer-db";
import { getProducerThreadChannel } from "@/lib/realtime";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const schema = z.object({
  producerSlug: z.string().trim().min(1).optional(),
  threadId: z.string().trim().min(1).optional(),
  body: z
    .string()
    .trim()
    .min(1, "Mesaj gerekli")
    .max(1200, "Mesaj çok uzun"),
});

const scriptLike = /<\s*script/i;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  const userId = sessionUser?.id;
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const messageBody = parsed.data.body.trim();
  if (scriptLike.test(messageBody)) {
    return NextResponse.json({ error: "Mesajda script bulunamaz" }, { status: 400 });
  }

  const perHour = rateLimit(`producer-msg:${userId}`, 10, 60 * 60 * 1000);
  if (!perHour.ok) {
    return NextResponse.json({ error: "Çok hızlı. Lütfen biraz bekleyin." }, { status: 429 });
  }

  let thread: Awaited<ReturnType<typeof prisma.producerThread.findUnique>> = null;
  if (parsed.data.threadId) {
    thread = await prisma.producerThread.findUnique({
      where: { id: parsed.data.threadId },
    });
  }

  let producerSlugResolved = parsed.data.producerSlug || thread?.producerSlug || "";
  let producerUserId = thread?.producerUserId || "";

  if (thread) {
    if (thread.studentUserId !== userId && thread.producerUserId !== userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  } else {
    if (!parsed.data.producerSlug) {
      return NextResponse.json({ error: "Üretici gerekli" }, { status: 400 });
    }
    const identity = await getProducerIdentityBySlug(parsed.data.producerSlug);
    if (!identity) {
      return NextResponse.json({ error: "Üretici bulunamadı" }, { status: 404 });
    }
    if (!["approved", "pending"].includes(identity.status)) {
      return NextResponse.json({ error: "Mesajlaşma aktif değil" }, { status: 400 });
    }
    producerSlugResolved = identity.slug;
    producerUserId = identity.userId;
    thread = await prisma.producerThread.findUnique({
      where: {
        producerSlug_studentUserId: {
          producerSlug: producerSlugResolved,
          studentUserId: userId,
        },
      },
    });
  }

  if (!thread) {
    return NextResponse.json({ error: "Önce ilk mesaj isteği gönderilmeli." }, { status: 400 });
  }
  if (thread.locked) {
    return NextResponse.json({ error: "Sohbet kilitli." }, { status: 423 });
  }

  const senderRole = thread.producerUserId === userId ? "producer" : "student";

  const recent = await prisma.producerMessage.findFirst({
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

  const message = await prisma.producerMessage.create({
    data: {
      threadId: thread.id,
      senderRole,
      senderUserId: userId,
      body: messageBody,
    },
  });

  await prisma.producerThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  const channel = getProducerThreadChannel(thread.id);
  const supabaseAdmin = getSupabaseAdminClient();
  if (supabaseAdmin) {
    const realtimeChannel = supabaseAdmin.channel(channel);
    await realtimeChannel.send({
      type: "broadcast",
      event: "producer-message",
      payload: {
        id: message.id,
        body: message.body,
        senderRole: message.senderRole,
        createdAt: message.createdAt.toISOString(),
        threadId: thread.id,
      },
    });
    supabaseAdmin.removeChannel(realtimeChannel);
  }

  return NextResponse.json({
    ok: true,
    threadId: thread.id,
    channel,
    message: {
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      createdAt: message.createdAt,
    },
  });
}
