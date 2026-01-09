import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/admin-notify";

export const runtime = "nodejs";

const schema = z.object({
  threadType: z.enum(["studio", "teacher", "producer"]),
  threadId: z.string().trim().min(1),
  reason: z.string().trim().min(5).max(400),
});

const scriptLike = /<\s*script/i;

const baseUrl =
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  (process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

function formatReporter({
  name,
  email,
  userId,
}: {
  name: string;
  email: string | null;
  userId: string | null;
}) {
  const label = email && email !== name ? `${name} (${email})` : name;
  return userId ? `${label} · ${userId}` : label;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  const sessionEmail = sessionUser?.email?.toLowerCase() ?? null;

  if (!sessionUser?.id && !sessionEmail) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const reason = parsed.data.reason.trim();
  if (scriptLike.test(reason)) {
    return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });
  }

  const limiterKey = sessionUser?.id || sessionEmail || "user";
  const limit = rateLimit(`complaint:${limiterKey}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Çok hızlı. Lütfen biraz bekleyin." }, { status: 429 });
  }

  const user =
    sessionUser?.id
      ? await prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: { id: true, fullName: true, name: true, email: true },
        })
      : sessionEmail
        ? await prisma.user.findUnique({
            where: { email: sessionEmail },
            select: { id: true, fullName: true, name: true, email: true },
          })
        : null;

  const reporterName = user?.fullName || user?.name || sessionUser?.name || sessionEmail || "Bilinmeyen";
  const reporterEmail = user?.email ?? sessionEmail;
  const reporter = formatReporter({
    name: reporterName,
    email: reporterEmail,
    userId: user?.id ?? null,
  });

  const nowLabel = new Date().toLocaleString("tr-TR");
  const noteEntry = `[Şikayet] ${nowLabel}\n${reason}\nGönderen: ${reporter}`;

  if (parsed.data.threadType === "studio") {
    const thread = await prisma.studioThread.findUnique({
      where: { id: parsed.data.threadId },
      include: {
        studio: { select: { id: true, name: true, ownerEmail: true, slug: true } },
        studentUser: { select: { id: true, fullName: true, name: true, email: true } },
      },
    });
    if (!thread) {
      return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
    }
    const isStudent =
      (user?.id ? thread.studentUserId === user.id : false) ||
      (sessionEmail && thread.studentUser.email?.toLowerCase() === sessionEmail);
    const isOwner =
      Boolean(sessionEmail) && thread.studio.ownerEmail?.toLowerCase() === sessionEmail;
    if (!isStudent && !isOwner) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await prisma.studioThread.update({
      where: { id: thread.id },
      data: {
        complaintsCount: { increment: 1 },
        internalNote: thread.internalNote ? `${thread.internalNote}\n\n${noteEntry}` : noteEntry,
      },
    });

    const studentName =
      thread.studentUser.fullName || thread.studentUser.name || thread.studentUser.email || "Öğrenci";
    const studentEmail = thread.studentUser.email ?? "";
    const threadLink = `${baseUrl}/dashboard/messages/${thread.id}`;
    const adminLink = `${baseUrl}/admin/messages`;

    await notifyAdmin(
      "Şikayet: Stüdyo mesajlaşması",
      `Tür: Stüdyo
Thread: ${thread.id}
Stüdyo: ${thread.studio.name} (${thread.studio.id})
Stüdyo sahip mail: ${thread.studio.ownerEmail || "-"}
Öğrenci: ${studentName}${studentEmail ? ` (${studentEmail})` : ""}

Gönderen: ${reporter}
Sebep: ${reason}

Admin: ${adminLink}
Thread: ${threadLink}
`,
    );

    return NextResponse.json({ ok: true });
  }

  if (parsed.data.threadType === "teacher") {
    const thread = await prisma.teacherThread.findUnique({
      where: { id: parsed.data.threadId },
      include: {
        teacherUser: { select: { id: true, fullName: true, name: true, email: true } },
        studentUser: { select: { id: true, fullName: true, name: true, email: true } },
      },
    });
    if (!thread) {
      return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
    }
    const allowed =
      (user?.id && (thread.studentUserId === user.id || thread.teacherUserId === user.id)) ||
      (sessionEmail &&
        (thread.studentUser.email?.toLowerCase() === sessionEmail ||
          thread.teacherUser.email?.toLowerCase() === sessionEmail));
    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    await prisma.teacherThread.update({
      where: { id: thread.id },
      data: {
        complaintsCount: { increment: 1 },
        internalNote: thread.internalNote ? `${thread.internalNote}\n\n${noteEntry}` : noteEntry,
      },
    });

    const teacherName =
      thread.teacherUser.fullName || thread.teacherUser.name || thread.teacherUser.email || "Hoca";
    const studentName =
      thread.studentUser.fullName || thread.studentUser.name || thread.studentUser.email || "Öğrenci";
    const teacherEmail = thread.teacherUser.email ?? "";
    const studentEmail = thread.studentUser.email ?? "";
    const listingLink = `${baseUrl}/hocalar/${thread.teacherSlug}#messages`;
    const adminLink = `${baseUrl}/admin/messages`;

    await notifyAdmin(
      "Şikayet: Hoca mesajlaşması",
      `Tür: Hoca
Thread: ${thread.id}
Hoca: ${teacherName}${teacherEmail ? ` (${teacherEmail})` : ""}
Öğrenci: ${studentName}${studentEmail ? ` (${studentEmail})` : ""}
Slug: ${thread.teacherSlug}

Gönderen: ${reporter}
Sebep: ${reason}

Admin: ${adminLink}
Listing: ${listingLink}
`,
    );

    return NextResponse.json({ ok: true });
  }

  const thread = await prisma.producerThread.findUnique({
    where: { id: parsed.data.threadId },
    include: {
      producerUser: { select: { id: true, fullName: true, name: true, email: true } },
      studentUser: { select: { id: true, fullName: true, name: true, email: true } },
    },
  });
  if (!thread) {
    return NextResponse.json({ error: "Mesajlaşma bulunamadı" }, { status: 404 });
  }
  const allowed =
    (user?.id && (thread.studentUserId === user.id || thread.producerUserId === user.id)) ||
    (sessionEmail &&
      (thread.studentUser.email?.toLowerCase() === sessionEmail ||
        thread.producerUser.email?.toLowerCase() === sessionEmail));
  if (!allowed) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.producerThread.update({
    where: { id: thread.id },
    data: {
      complaintsCount: { increment: 1 },
      internalNote: thread.internalNote ? `${thread.internalNote}\n\n${noteEntry}` : noteEntry,
    },
  });

  const producerName =
    thread.producerUser.fullName || thread.producerUser.name || thread.producerUser.email || "Üretici";
  const studentName =
    thread.studentUser.fullName || thread.studentUser.name || thread.studentUser.email || "Öğrenci";
  const producerEmail = thread.producerUser.email ?? "";
  const studentEmail = thread.studentUser.email ?? "";
  const listingLink = `${baseUrl}/uretim/${thread.producerSlug}#messages`;
  const adminLink = `${baseUrl}/admin/messages`;

  await notifyAdmin(
    "Şikayet: Üretici mesajlaşması",
    `Tür: Üretici
Thread: ${thread.id}
Üretici: ${producerName}${producerEmail ? ` (${producerEmail})` : ""}
Öğrenci: ${studentName}${studentEmail ? ` (${studentEmail})` : ""}
Slug: ${thread.producerSlug}

Gönderen: ${reporter}
Sebep: ${reason}

Admin: ${adminLink}
Listing: ${listingLink}
`,
  );

  return NextResponse.json({ ok: true });
}
