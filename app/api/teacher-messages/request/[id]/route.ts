import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherThreadChannel } from "@/lib/realtime";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["accept", "decline"]),
  reply: z.string().trim().max(1200).optional(),
  studentUserId: z.string().trim().optional(),
  teacherSlug: z.string().trim().optional(),
});

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id?: string }> | { id?: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const requestId = resolvedParams.id;
  if (!requestId) {
    return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  let request = await prisma.teacherMessageRequest.findUnique({
    where: { id: requestId },
  });
  if (!request && parsed.data.studentUserId && parsed.data.teacherSlug) {
    request = await prisma.teacherMessageRequest.findFirst({
      where: {
        teacherUserId: userId,
        studentUserId: parsed.data.studentUserId,
        teacherSlug: parsed.data.teacherSlug,
        status: "pending",
      },
    });
  }
  if (!request) {
    return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
  }
  const resolvedRequestId = request.id;
  if (request.teacherUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  if (parsed.data.action === "decline") {
    if (request.status === "declined") {
      return NextResponse.json({ ok: true, status: "declined" });
    }
    await prisma.teacherMessageRequest.update({
      where: { id: resolvedRequestId },
      data: { status: "declined" },
    });
    return NextResponse.json({ ok: true, status: "declined" });
  }

  if (request.status !== "pending") {
    return NextResponse.json({ error: "Bu istek zaten yanıtlandı." }, { status: 400 });
  }

  const reply = parsed.data.reply?.trim() || "";
  if (!reply) {
    return NextResponse.json({ error: "Yanıt gerekli" }, { status: 400 });
  }

  const thread = await prisma.teacherThread.upsert({
    where: {
      teacherSlug_studentUserId: {
        teacherSlug: request.teacherSlug,
        studentUserId: request.studentUserId,
      },
    },
    update: {},
    create: {
      teacherSlug: request.teacherSlug,
      teacherUserId: request.teacherUserId,
      studentUserId: request.studentUserId,
    },
  });

  const message = await prisma.teacherMessage.create({
    data: {
      threadId: thread.id,
      senderRole: "teacher",
      senderUserId: userId,
      body: reply,
    },
  });

  await prisma.teacherThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  await prisma.teacherMessageRequest.update({
    where: { id: resolvedRequestId },
    data: { status: "accepted" },
  });

  const channel = getTeacherThreadChannel(thread.id);
  const supabaseAdmin = getSupabaseAdminClient();
  if (supabaseAdmin) {
    const realtimeChannel = supabaseAdmin.channel(channel);
    await realtimeChannel.send({
      type: "broadcast",
      event: "teacher-message",
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

  if (resend) {
    const [teacherUser, studentUser] = await prisma.user.findMany({
      where: { id: { in: [request.teacherUserId, request.studentUserId] } },
      select: { id: true, email: true, fullName: true, name: true },
    });
    const teacherName =
      teacherUser?.id === request.teacherUserId
        ? teacherUser.fullName || teacherUser.name || teacherUser.email || "Hoca"
        : studentUser?.fullName || studentUser?.name || studentUser?.email || "Hoca";
    const studentEmail =
      teacherUser?.id === request.studentUserId
        ? teacherUser.email
        : studentUser?.email || null;
    if (studentEmail) {
      const threadLink = `${baseUrl}/hocalar/${thread.teacherSlug}#messages`;
      const text = `${teacherName} sana yanıt verdi.\n\nMesaj: ${reply}\n\nKonuşmaya devam etmek için: ${threadLink}\n`;
      try {
        await resend.emails.send({
          from: leadFrom,
          to: [studentEmail],
          subject: "Studyom'da yeni mesaj",
          text,
        });
      } catch (err) {
        console.error("teacher reply email error", err);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    status: "accepted",
    threadId: thread.id,
    channel,
    teacherSlug: thread.teacherSlug,
    student: {
      id: request.studentUserId,
    },
    message: {
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      createdAt: message.createdAt,
    },
  });
}
