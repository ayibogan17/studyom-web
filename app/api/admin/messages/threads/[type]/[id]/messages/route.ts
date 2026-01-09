import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

function pickThreadModel(type: string) {
  if (type === "studio") return prisma.studioThread;
  if (type === "teacher") return prisma.teacherThread;
  if (type === "producer") return prisma.producerThread;
  return null;
}

async function loadMessages(type: string, threadId: string) {
  if (type === "studio") {
    return prisma.studioMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, senderUserId: true, body: true, createdAt: true },
    });
  }
  if (type === "teacher") {
    return prisma.teacherMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, senderUserId: true, body: true, createdAt: true },
    });
  }
  if (type === "producer") {
    return prisma.producerMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderRole: true, senderUserId: true, body: true, createdAt: true },
    });
  }
  return [];
}

export async function GET(req: Request, context: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await context.params;
  const admin = await requireAdmin();
  let thread: { id: string; investigationEnabled: boolean } | null = null;
  if (type === "studio") {
    thread = await prisma.studioThread.findUnique({
      where: { id },
      select: { id: true, investigationEnabled: true },
    });
  } else if (type === "teacher") {
    thread = await prisma.teacherThread.findUnique({
      where: { id },
      select: { id: true, investigationEnabled: true },
    });
  } else if (type === "producer") {
    thread = await prisma.producerThread.findUnique({
      where: { id },
      select: { id: true, investigationEnabled: true },
    });
  } else {
    return NextResponse.json({ ok: false, error: "Geçersiz tip" }, { status: 400 });
  }

  if (!thread) {
    return NextResponse.json({ ok: false, error: "Kayıt bulunamadı" }, { status: 404 });
  }
  if (!thread.investigationEnabled) {
    return NextResponse.json({ ok: false, error: "İnceleme modu kapalı" }, { status: 403 });
  }

  const messages = await loadMessages(type, id);
  await logAdminAction({
    adminId: admin.id,
    entityType: "message_thread",
    entityId: `${type}:${id}`,
    action: "messages_investigation_view",
    metadata: { path: new URL(req.url).pathname },
  });

  return NextResponse.json({ ok: true, messages });
}
