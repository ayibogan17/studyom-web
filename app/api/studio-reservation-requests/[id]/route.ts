import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { Resend } from "resend";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isBlockingBlock,
  isWithinOpeningHoursZoned,
  normalizeOpeningHours,
} from "@/lib/studio-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const schema = z.object({
  action: z.enum(["approve", "reject", "read"]),
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

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "";
  return `${Math.round(value).toLocaleString("tr-TR")} ₺`;
};

export async function PATCH(
  req: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> },
) {
  const resolved = await Promise.resolve(params);
  const requestId = resolved?.id;
  if (!requestId) {
    return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerEmail = sessionUser?.email?.toLowerCase();
  if (!ownerEmail) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const request = await prisma.studioReservationRequest.findUnique({
    where: { id: requestId },
    include: {
      studio: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerEmail: true,
          openingHours: true,
          calendarSettings: { select: { weeklyHours: true, dayCutoffHour: true, timezone: true } },
        },
      },
      room: { select: { id: true, name: true } },
      studentUser: { select: { email: true, fullName: true, name: true } },
    },
  });
  if (!request) {
    return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
  }
  if (request.studio.ownerEmail.toLowerCase() !== ownerEmail) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  if (parsed.data.action === "read") {
    if (!request.studioUnread) {
      return NextResponse.json({ ok: true, status: request.status });
    }
    await prisma.studioReservationRequest.update({
      where: { id: request.id },
      data: { studioUnread: false },
    });
    return NextResponse.json({ ok: true, status: request.status });
  }

  if (parsed.data.action === "reject") {
    if (request.status === "rejected") {
      return NextResponse.json({ ok: true, status: "rejected" });
    }
    const updated = await prisma.studioReservationRequest.update({
      where: { id: request.id },
      data: {
        status: "rejected",
        studioUnread: false,
        userUnread: true,
      },
    });

    const recipientEmail = request.requesterEmail || request.studentUser?.email || null;
    if (resend && recipientEmail) {
      const studentName =
        request.requesterName ||
        request.studentUser?.fullName ||
        request.studentUser?.name ||
        request.studentUser?.email ||
        "Kullanıcı";
      const requestDate = request.startAt.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      const roomLabel = request.room.name || "Oda";
      const studioSlug = request.studio.slug || request.studio.id;
      const text = `${request.studio.name} rezervasyon isteğini reddetti

Merhaba ${studentName},

İsteğini ilettik ancak bu sefer uygunluk sağlanamadı. Dilersen farklı bir saat için tekrar talep oluşturabilirsin.

Stüdyo: ${request.studio.name}
Oda: ${roomLabel}
Tarih: ${requestDate}
Süre: ${request.hours} saat

Yeni istek oluşturmak için: ${baseUrl}/studyo/${studioSlug}

Müzikle kal,
Studyom ekibi
`;
      Promise.resolve()
        .then(() =>
          resend.emails.send({
            from: leadFrom,
            to: [recipientEmail],
            subject: "Rezervasyon isteği reddedildi",
            text,
          }),
        )
        .catch((err) => {
          console.error("reservation reject email error", err);
        });
    }

    return NextResponse.json({ ok: true, status: updated.status });
  }

  if (request.status === "approved") {
    return NextResponse.json({ ok: true, status: "approved", calendarBlockId: request.calendarBlockId });
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "İstek zaten yanıtlandı." }, { status: 400 });
  }

  const openingHours = normalizeOpeningHours(
    (request.studio.calendarSettings?.weeklyHours as { open: boolean; openTime: string; closeTime: string }[] | null | undefined) ??
      (request.studio.openingHours as { open: boolean; openTime: string; closeTime: string }[] | null | undefined),
  );
  const cutoffHour = request.studio.calendarSettings?.dayCutoffHour ?? 4;
  const timeZone = request.studio.calendarSettings?.timezone ?? "Europe/Istanbul";
  const startAtLocal = new Date(request.startAt.toLocaleString("en-US", { timeZone }));
  const endAtLocal = new Date(request.endAt.toLocaleString("en-US", { timeZone }));
  if (!isWithinOpeningHoursZoned(startAtLocal, endAtLocal, openingHours, cutoffHour, timeZone)) {
    return NextResponse.json({ error: "Rezervasyon saatleri açık saatler dışında." }, { status: 400 });
  }

  const overlappingBlocks = await prisma.studioCalendarBlock.findMany({
    where: {
      roomId: request.roomId,
      startAt: { lt: request.endAt },
      endAt: { gt: request.startAt },
    },
    select: { type: true, status: true },
  });
  if (overlappingBlocks.some((block) => isBlockingBlock(block))) {
    return NextResponse.json({ error: "Bu saatlerde başka bir rezervasyon var." }, { status: 409 });
  }

  const noteLines = [
    `İsim: ${request.requesterName}`,
    `Telefon: ${request.requesterPhone}`,
    request.requesterEmail ? `E-posta: ${request.requesterEmail}` : null,
    request.note ? `Not: ${request.note}` : null,
    request.totalPrice ? `Ücret: ${formatPrice(request.totalPrice)}` : null,
  ].filter(Boolean);

  const block = await prisma.studioCalendarBlock.create({
    data: {
      studioId: request.studioId,
      roomId: request.roomId,
      startAt: request.startAt,
      endAt: request.endAt,
      type: "reservation",
      status: "approved",
      title: `Rezervasyon - ${request.requesterName}`,
      note: noteLines.join("\n"),
      createdByUserId: sessionUser?.id ?? null,
    },
  });

  const updated = await prisma.studioReservationRequest.update({
    where: { id: request.id },
    data: {
      status: "approved",
      calendarBlockId: block.id,
      studioUnread: false,
      userUnread: true,
    },
  });

  const recipientEmail = request.requesterEmail || request.studentUser?.email || null;
  if (resend && recipientEmail) {
    const studentName =
      request.requesterName ||
      request.studentUser?.fullName ||
      request.studentUser?.name ||
      request.studentUser?.email ||
      "Kullanıcı";
    const requestDate = request.startAt.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const roomLabel = request.room.name || "Oda";
    const priceLabel = request.totalPrice ? formatPrice(request.totalPrice) : "Fiyat bilgisi yok";
    const text = `${request.studio.name} rezervasyon isteğini onayladı 🎉

Merhaba ${studentName},

Rezervasyonun onaylandı.

Stüdyo: ${request.studio.name}
Oda: ${roomLabel}
Tarih: ${requestDate}
Süre: ${request.hours} saat
Ücret: ${priceLabel}

Detaylar için: ${baseUrl}/notifications

Müzikle kal,
Studyom ekibi
`;
    Promise.resolve()
      .then(() =>
        resend.emails.send({
          from: leadFrom,
          to: [recipientEmail],
          subject: "Rezervasyon isteği onaylandı",
          text,
        }),
      )
      .catch((err) => {
        console.error("reservation approve email error", err);
      });
  }

  return NextResponse.json({ ok: true, status: updated.status, calendarBlockId: updated.calendarBlockId });
}
