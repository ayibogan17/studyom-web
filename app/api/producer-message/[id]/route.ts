"use server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/geo";
import { getProducerThreadChannel } from "@/lib/realtime";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  status: z.enum(["accepted", "declined"]),
});

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

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  }

  const limiter = rateLimit(`producer-message:${userId}:${id}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Çok sık işlem yaptın." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const request = await prisma.producerMessageRequest.findUnique({
    where: { id },
    select: { id: true, producerUserId: true, status: true, fromUserId: true, message: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }
  if (request.producerUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  if (request.status === parsed.data.status) {
    return NextResponse.json({ ok: true, status: request.status });
  }

  if (parsed.data.status === "declined") {
    try {
      const updated = await prisma.producerMessageRequest.update({
        where: { id: request.id },
        data: { status: "declined" },
        select: { id: true, status: true },
      });
      return NextResponse.json({ ok: true, status: updated.status });
    } catch (err) {
      console.error("producer message update failed", err);
      return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
    }
  }

  if (request.status !== "pending") {
    return NextResponse.json({ ok: true, status: request.status });
  }

  try {
    const application = await prisma.producerApplication.findFirst({
      where: { userId: request.producerUserId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Üretici bulunamadı." }, { status: 404 });
    }
    const producerUser = await prisma.user.findUnique({
      where: { id: request.producerUserId },
      select: { fullName: true, name: true, email: true },
    });
    const displayName = producerUser?.fullName || producerUser?.name || producerUser?.email || "Üretici";
    const producerSlug = `${slugify(displayName)}-${application.id}`;

    const thread = await prisma.producerThread.upsert({
      where: {
        producerSlug_studentUserId: {
          producerSlug,
          studentUserId: request.fromUserId,
        },
      },
      update: {},
      create: {
        producerSlug,
        producerUserId: request.producerUserId,
        studentUserId: request.fromUserId,
      },
    });

    let message = await prisma.producerMessage.findFirst({
      where: {
        threadId: thread.id,
        senderRole: "student",
        senderUserId: request.fromUserId,
        body: request.message,
      },
    });

    if (!message) {
      message = await prisma.producerMessage.create({
        data: {
          threadId: thread.id,
          senderRole: "student",
          senderUserId: request.fromUserId,
          body: request.message,
        },
      });
    }

    await prisma.producerThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    await prisma.producerMessageRequest.update({
      where: { id: request.id },
      data: { status: "accepted" },
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
      status: "accepted",
      threadId: thread.id,
      channel,
      producerSlug,
      message: {
        id: message.id,
        body: message.body,
        senderRole: message.senderRole,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error("producer message update failed", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
