import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  studioId: z.string().trim().optional(),
  threadId: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  let userId = sessionUser?.id ?? null;
  let dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    : null;
  if (!dbUser && sessionUser?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true },
    });
  }
  if (!dbUser && process.env.NODE_ENV !== "production" && sessionUser?.email) {
    dbUser = await prisma.user.create({
      data: {
        email: sessionUser.email.toLowerCase(),
        name: sessionUser.name ?? null,
      },
      select: { id: true },
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

  const { studioId, threadId } = parsed.data;
  if (!studioId && !threadId) {
    return NextResponse.json({ error: "Stüdyo veya mesajlaşma gerekli" }, { status: 400 });
  }

  const includeData = {
    studio: { select: { id: true, name: true, slug: true } },
    messages: { orderBy: { createdAt: "asc" as const } },
  };

  type StudioThreadWithRelations = Prisma.StudioThreadGetPayload<{
    include: { studio: { select: { id: true; name: true; slug: true } }; messages: true };
  }>;
  let thread: StudioThreadWithRelations | null = null;

  if (threadId) {
    thread = await prisma.studioThread.findUnique({
      where: { id: threadId },
      include: includeData,
    });
    if (!thread) {
      return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
    }
    if (thread.studentUserId !== userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  } else if (studioId) {
    thread = await prisma.studioThread.findUnique({
      where: {
        studioId_studentUserId: {
          studioId,
          studentUserId: userId,
        },
      },
      include: includeData,
    });

    if (!thread) {
      const studio = await prisma.studio.findUnique({
        where: { id: studioId },
        select: { id: true, name: true, slug: true },
      });
      if (!studio) {
        return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
      }
      thread = await prisma.studioThread.create({
        data: {
          studioId: studio.id,
          studentUserId: userId,
        },
        include: includeData,
      });
    }
  }

  if (!thread) {
    return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
  }

  await prisma.studioMessage.updateMany({
    where: {
      threadId: thread.id,
      senderRole: "studio",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    threadId: thread.id,
    locked: thread.locked,
    studio: thread.studio,
    messages: thread.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      createdAt: message.createdAt,
    })),
  });
}
