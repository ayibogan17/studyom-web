import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import { getTeacherIdentityBySlug } from "@/lib/teacher-db";
import { getTeacherThreadChannel } from "@/lib/realtime";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";
const teacherInboxFallback =
  process.env.TEACHER_INBOX_FALLBACK || process.env.LEAD_TO || "admin@studyom.net";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const schema = z.object({
  teacherSlug: z.string().trim().min(1).optional(),
  threadId: z.string().trim().min(1).optional(),
  body: z
    .string()
    .trim()
    .min(1, "Mesaj gerekli")
    .max(1200, "Mesaj çok uzun"),
});

const scriptLike = /<\s*script/i;

function snippet(text: string) {
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  const userId = sessionUser?.id;
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }
  const { teacherSlug, threadId } = parsed.data;
  const messageBody = parsed.data.body.trim();

  if (scriptLike.test(messageBody)) {
    return NextResponse.json({ error: "Mesajda script bulunamaz" }, { status: 400 });
  }

  const perHour = rateLimit(`teacher-msg:${userId}`, 10, 60 * 60 * 1000);
  if (!perHour.ok) {
    return NextResponse.json({ error: "Çok hızlı. Lütfen biraz bekleyin." }, { status: 429 });
  }

  let thread: Awaited<ReturnType<typeof prisma.teacherThread.findUnique>> = null;
  if (threadId) {
    thread = await prisma.teacherThread.findUnique({
      where: { id: threadId },
    });
  }

  let teacherName = "";
  let teacherEmail: string | null = null;
  let teacherSlugResolved = teacherSlug || thread?.teacherSlug || "";
  let teacherUserId = thread?.teacherUserId || "";

  if (thread) {
    if (thread.studentUserId !== userId && thread.teacherUserId !== userId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  } else {
    if (!teacherSlug) {
      return NextResponse.json({ error: "Öğretmen gerekli" }, { status: 400 });
    }
    const identity = await getTeacherIdentityBySlug(teacherSlug);
    if (!identity) {
      return NextResponse.json({ error: "Öğretmen bulunamadı" }, { status: 404 });
    }
    if (!["approved", "pending"].includes(identity.status)) {
      return NextResponse.json({ error: "Mesajlaşma aktif değil" }, { status: 400 });
    }
    teacherName = identity.displayName;
    teacherUserId = identity.userId;
    teacherEmail = identity.userEmail;
    teacherSlugResolved = identity.slug;
    thread = await prisma.teacherThread.findUnique({
      where: {
        teacherSlug_studentUserId: {
          teacherSlug: teacherSlugResolved,
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

  const senderRole = thread.teacherUserId === userId ? "teacher" : "student";

  const recent = await prisma.teacherMessage.findFirst({
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

  const message = await prisma.teacherMessage.create({
    data: {
      threadId: thread.id,
      senderRole,
      senderUserId: userId,
      body: messageBody,
    },
  });

  await prisma.teacherThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
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

  const [teacherUser, studentUser] = await prisma.user.findMany({
    where: { id: { in: [thread.teacherUserId, thread.studentUserId] } },
    select: { id: true, email: true, fullName: true, name: true },
  });
  const teacherRecord = teacherUser?.id === thread.teacherUserId ? teacherUser : studentUser;
  const studentRecord = studentUser?.id === thread.studentUserId ? studentUser : teacherUser;

  if (!teacherName) {
    const identity = await getTeacherIdentityBySlug(teacherSlugResolved);
    teacherName =
      teacherRecord?.fullName ||
      teacherRecord?.name ||
      identity?.displayName ||
      teacherRecord?.email ||
      "Öğretmen";
    teacherEmail = teacherRecord?.email || identity?.userEmail || null;
  }

  const studentEmail = studentRecord?.email ?? null;
  const studentName = studentRecord?.fullName || studentRecord?.name || studentEmail || "Öğrenci";
  const threadLink = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"}/hocalar/${teacherSlugResolved}#messages`;
  const excerpt = snippet(messageBody);

  if (resend) {
    const toTeacher = teacherEmail || teacherInboxFallback;
    const teacherText = `Studyom'da yeni mesaj aldınız.

Öğrenci: ${studentName}
Mesaj: ${excerpt}

Mesajları görüntülemek için: ${threadLink}
`;
    const studentText = `${teacherName} sana mesaj gönderdi.

Mesaj: ${excerpt}

Konuşmaya devam etmek için: ${threadLink}
`;

    try {
      if (senderRole === "student") {
        await resend.emails.send({
          from: leadFrom,
          to: [toTeacher],
          subject: "Studyom'da yeni mesaj",
          text: teacherText,
        });
      } else if (studentEmail) {
        await resend.emails.send({
          from: leadFrom,
          to: [studentEmail],
          subject: "Studyom'da yeni mesaj",
          text: studentText,
        });
      }
    } catch (err) {
      console.error("teacher message email error", err);
    }
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
