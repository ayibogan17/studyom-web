import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProducerIdentityBySlug } from "@/lib/producer-db";
import { getProducerThreadChannel } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const url = new URL(req.url);
  const producerSlug = url.searchParams.get("producerSlug") || "";
  if (!producerSlug) {
    return NextResponse.json({ error: "Üretici gerekli" }, { status: 400 });
  }

  const identity = await getProducerIdentityBySlug(producerSlug);
  if (!identity) {
    return NextResponse.json({ error: "Üretici bulunamadı" }, { status: 404 });
  }

  const thread = await prisma.producerThread.findUnique({
    where: {
      producerSlug_studentUserId: {
        producerSlug,
        studentUserId: userId,
      },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (thread?.id) {
    await prisma.producerMessage.updateMany({
      where: {
        threadId: thread.id,
        senderRole: "producer",
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const latestRequest = await prisma.producerMessageRequest.findFirst({
    where: {
      fromUserId: userId,
      producerUserId: identity.userId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true },
  });

  const hasProducerReply = thread?.messages.some((msg) => msg.senderRole === "producer") ?? false;

  return NextResponse.json({
    ok: true,
    threadId: thread?.id ?? null,
    channel: thread?.id ? getProducerThreadChannel(thread.id) : null,
    producer: {
      slug: producerSlug,
      name: identity.displayName,
      userId: identity.userId,
    },
    request: latestRequest ?? null,
    whatsapp: {
      enabled: identity.whatsappEnabled,
      number: hasProducerReply ? identity.whatsappNumber : null,
    },
    messages:
      thread?.messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderRole: m.senderRole,
        createdAt: m.createdAt,
      })) ?? [],
  });
}
