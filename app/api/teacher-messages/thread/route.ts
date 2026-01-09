import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherIdentityBySlug } from "@/lib/teacher-db";
import { getTeacherThreadChannel } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const url = new URL(req.url);
  const teacherSlug = url.searchParams.get("teacherSlug") || "";
  if (!teacherSlug) {
    return NextResponse.json({ error: "Öğretmen gerekli" }, { status: 400 });
  }

  const identity = await getTeacherIdentityBySlug(teacherSlug);
  if (!identity) {
    return NextResponse.json({ error: "Öğretmen bulunamadı" }, { status: 404 });
  }

  const thread = await prisma.teacherThread.findUnique({
    where: {
      teacherSlug_studentUserId: {
        teacherSlug,
        studentUserId: userId,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (thread?.id) {
    await prisma.teacherMessage.updateMany({
      where: {
        threadId: thread.id,
        senderRole: "teacher",
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const latestRequest = await prisma.teacherMessageRequest.findFirst({
    where: {
      studentUserId: userId,
      teacherUserId: identity.userId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true },
  });

  const hasTeacherReply = thread?.messages.some((msg) => msg.senderRole === "teacher") ?? false;

  return NextResponse.json({
    ok: true,
    threadId: thread?.id ?? null,
    locked: thread?.locked ?? false,
    channel: thread?.id ? getTeacherThreadChannel(thread.id) : null,
    teacher: {
      slug: teacherSlug,
      name: identity.displayName,
    },
    request: latestRequest ?? null,
    whatsapp: {
      enabled: identity.whatsappEnabled,
      number: hasTeacherReply ? identity.whatsappNumber : null,
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
