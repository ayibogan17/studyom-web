import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { Resend } from "resend";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  isBlockingBlock,
  isWithinOpeningHoursZoned,
  normalizeOpeningHours,
} from "@/lib/studio-availability";

export const runtime = "nodejs";

const schema = z.object({
  studioId: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  startAt: z.string().datetime(),
  hours: z.number().int().min(1).max(24),
  requesterName: z.string().trim().min(2).max(120),
  requesterPhone: z.string().trim().min(6).max(40),
  requesterEmail: z.string().trim().email().optional(),
  note: z.string().trim().max(500).optional(),
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

const parsePriceValue = (value?: string | null) => {
  if (!value) return null;
  const raw = value.toString().trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  } else if (hasDot) {
    const parts = cleaned.split(".");
    const tail = parts[parts.length - 1] ?? "";
    normalized = parts.length > 1 && tail.length === 3 ? parts.join("") : cleaned;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatPrice = (value?: number | null) => {
  if (!value && value !== 0) return "";
  return `${Math.round(value).toLocaleString("tr-TR")} ₺`;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
    let userId = sessionUser?.id ?? null;
    let dbUser = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, fullName: true, name: true, phone: true },
        })
      : null;
    if (!dbUser && sessionUser?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: sessionUser.email.toLowerCase() },
        select: { id: true, email: true, fullName: true, name: true, phone: true },
      });
    }
    if (!dbUser && process.env.NODE_ENV !== "production" && sessionUser?.email) {
      dbUser = await prisma.user.create({
        data: {
          email: sessionUser.email.toLowerCase(),
          name: sessionUser.name ?? null,
        },
        select: { id: true, email: true, fullName: true, name: true, phone: true },
      });
    }
    userId = dbUser?.id ?? null;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    if (!userId && !parsed.data.requesterEmail) {
      return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
    }
    if (userId && !dbUser?.phone) {
      return NextResponse.json({ error: "Profilinde telefon yok. Lütfen profilden ekle." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const rateKey = userId ? `reservation-request:${userId}` : `reservation-request-ip:${ip}`;
    const perHour = rateLimit(rateKey, 6, 60 * 60 * 1000);
    if (!perHour.ok) {
      return NextResponse.json({ error: "Çok hızlı. Lütfen biraz bekleyin." }, { status: 429 });
    }

    const startAt = new Date(parsed.data.startAt);
    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Başlangıç zamanı geçersiz." }, { status: 400 });
    }
    const endAt = new Date(startAt.getTime() + parsed.data.hours * 60 * 60 * 1000);
    if (endAt <= startAt) {
      return NextResponse.json({ error: "Zaman aralığı geçersiz." }, { status: 400 });
    }

    const studio = await prisma.studio.findUnique({
      where: { id: parsed.data.studioId },
      select: {
        id: true,
        name: true,
        ownerEmail: true,
        openingHours: true,
        calendarSettings: {
          select: {
            weeklyHours: true,
            dayCutoffHour: true,
            timezone: true,
            bookingApprovalMode: true,
            bookingCutoffUnit: true,
            bookingCutoffValue: true,
          },
        },
      },
    });
    if (!studio) {
      return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });
    }

    const room = await prisma.room.findFirst({
      where: { id: parsed.data.roomId, studioId: studio.id },
      select: {
        id: true,
        name: true,
        hourlyRate: true,
        minRate: true,
        flatRate: true,
        happyHourRate: true,
      },
    });
    if (!room) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    const timeZone = studio.calendarSettings?.timezone ?? "Europe/Istanbul";
    const startAtLocal = startAt;
    const endAtLocal = endAt;
    if (startAtLocal.getMinutes() % 60 !== 0 || startAtLocal.getSeconds() !== 0) {
      return NextResponse.json({ error: "Saat başlangıcı tam olmalı." }, { status: 400 });
    }

    const openingHours = normalizeOpeningHours(
      (studio.calendarSettings?.weeklyHours as { open: boolean; openTime: string; closeTime: string }[] | null | undefined) ??
        (studio.openingHours as { open: boolean; openTime: string; closeTime: string }[] | null | undefined),
    );
    const cutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;
    if (!isWithinOpeningHoursZoned(startAtLocal, endAtLocal, openingHours, cutoffHour, timeZone)) {
      return NextResponse.json({ error: "Seçilen saatler açık saatler dışında." }, { status: 400 });
    }

    const overlappingBlocks = await prisma.studioCalendarBlock.findMany({
      where: {
        roomId: room.id,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { type: true, status: true },
    });
    if (overlappingBlocks.some((block) => isBlockingBlock(block))) {
      return NextResponse.json({ error: "Bu saatlerde başka bir rezervasyon var." }, { status: 409 });
    }

    const overlappingRequest = await prisma.studioReservationRequest.findFirst({
      where: {
        roomId: room.id,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        status: { in: ["pending", "approved"] },
      },
      select: { id: true },
    });
    if (overlappingRequest) {
      return NextResponse.json({ error: "Bu saatler için mevcut bir istek var." }, { status: 409 });
    }

    const approvalMode = studio.calendarSettings?.bookingApprovalMode ?? "manual";
    if (approvalMode === "auto" && !userId) {
      return NextResponse.json(
        { error: "Otomatik onaylı rezervasyonlar sadece giriş yapan kullanıcılar için kullanılabilir." },
        { status: 401 },
      );
    }

    if (approvalMode === "auto") {
      const cutoffValue = studio.calendarSettings?.bookingCutoffValue ?? null;
      const cutoffUnit = studio.calendarSettings?.bookingCutoffUnit ?? "hours";
      if (cutoffValue && cutoffValue > 0) {
        const cutoffMs =
          cutoffUnit === "days" ? cutoffValue * 24 * 60 * 60 * 1000 : cutoffValue * 60 * 60 * 1000;
        const cutoffAt = Date.now() + cutoffMs;
        if (startAt.getTime() < cutoffAt) {
          return NextResponse.json(
            { error: "Bu saatler otomatik rezervasyon için çok yakın. Daha ileri bir saat seçin." },
            { status: 400 },
          );
        }
      }
    }

    const happyHours = await prisma.studioHappyHourSlot.findMany({
      where: {
        roomId: room.id,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { startAt: true, endAt: true },
    });

    const baseRate =
      parsePriceValue(room.hourlyRate) ?? parsePriceValue(room.minRate) ?? parsePriceValue(room.flatRate);
    const happyRate = parsePriceValue(room.happyHourRate) ?? baseRate;

    let totalPrice: number | null = 0;
    let missingRate = false;
    for (let i = 0; i < parsed.data.hours; i += 1) {
      const slotStart = new Date(startAt.getTime() + i * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const isHappy = happyHours.some((slot) => slot.startAt < slotEnd && slot.endAt > slotStart);
      const rate = isHappy ? happyRate : baseRate;
      if (rate === null || rate === undefined) {
        missingRate = true;
        totalPrice = null;
        break;
      }
      totalPrice = (totalPrice ?? 0) + rate;
    }
    if (missingRate) {
      totalPrice = null;
    }

    const requesterEmail = parsed.data.requesterEmail?.trim() || dbUser?.email || sessionUser?.email || null;
    const requesterPhone = dbUser?.phone?.trim() || parsed.data.requesterPhone.trim();
    const requesterName = parsed.data.requesterName.trim();
    const requestStatus = approvalMode === "auto" ? "approved" : "pending";

    const request = await prisma.$transaction(async (tx) => {
      if (requestStatus === "approved") {
        const noteLines = [
          `İsim: ${requesterName}`,
          `Telefon: ${requesterPhone}`,
          requesterEmail ? `E-posta: ${requesterEmail}` : null,
          parsed.data.note?.trim() ? `Not: ${parsed.data.note.trim()}` : null,
          totalPrice ? `Ücret: ${formatPrice(totalPrice)}` : null,
        ].filter(Boolean);

        const block = await tx.studioCalendarBlock.create({
          data: {
            studioId: studio.id,
            roomId: room.id,
            startAt,
            endAt,
            type: "reservation",
            status: "approved",
            title: `Rezervasyon - ${requesterName}`,
            note: noteLines.join("\n"),
            createdByUserId: userId,
          },
        });

        return tx.studioReservationRequest.create({
          data: {
            studioId: studio.id,
            roomId: room.id,
            studentUserId: userId,
            requesterName,
            requesterPhone,
            requesterEmail,
            note: parsed.data.note?.trim() || null,
            startAt,
            endAt,
            hours: parsed.data.hours,
            totalPrice,
            currency: "TRY",
            status: "approved",
            calendarBlockId: block.id,
            userUnread: true,
            studioUnread: true,
          },
        });
      }

      return tx.studioReservationRequest.create({
        data: {
          studioId: studio.id,
          roomId: room.id,
          studentUserId: userId,
          requesterName,
          requesterPhone,
          requesterEmail,
          note: parsed.data.note?.trim() || null,
          startAt,
          endAt,
          hours: parsed.data.hours,
          totalPrice,
          currency: "TRY",
          status: "pending",
          userUnread: true,
          studioUnread: true,
        },
      });
    });

    const requestDate = startAt.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const roomLabel = room.name || "Oda";
    const priceLabel = totalPrice !== null ? formatPrice(totalPrice) : "Fiyat bilgisi yok";

    try {
      await prisma.notification.create({
        data: {
          studioId: studio.id,
          message:
            requestStatus === "approved"
              ? `Onaylı rezervasyon: ${roomLabel} · ${requestDate} · ${parsed.data.hours} saat · ${priceLabel}`
              : `Rezervasyon isteği: ${roomLabel} · ${requestDate} · ${parsed.data.hours} saat · ${priceLabel}`,
        },
      });
    } catch (err) {
      console.error("reservation request notification failed", err);
    }

    if (resend && studio.ownerEmail) {
      const text =
        requestStatus === "approved"
          ? `Studyom'da onaylı bir rezervasyon geldi.

Stüdyo: ${studio.name}
Oda: ${roomLabel}
Tarih: ${requestDate}
Süre: ${parsed.data.hours} saat
Ücret: ${priceLabel}

İsim: ${requesterName}
Telefon: ${requesterPhone}
Not: ${parsed.data.note?.trim() || "-"}

Detaylar için: ${baseUrl}/dashboard?as=studio
`
          : `Studyom'da yeni bir rezervasyon isteği aldınız.

Stüdyo: ${studio.name}
Oda: ${roomLabel}
Tarih: ${requestDate}
Süre: ${parsed.data.hours} saat
Ücret: ${priceLabel}

İsim: ${requesterName}
Telefon: ${requesterPhone}
Not: ${parsed.data.note?.trim() || "-"}

İsteği yönetmek için: ${baseUrl}/dashboard?as=studio
`;
      try {
        await resend.emails.send({
          from: leadFrom,
          to: [studio.ownerEmail],
          replyTo: requesterEmail || undefined,
          subject:
            requestStatus === "approved"
              ? "Studyom'da onaylı rezervasyon geldi"
              : "Studyom'da yeni rezervasyon isteği",
          text,
        });
      } catch (err) {
        console.error("reservation request email error", err);
      }
    }

    return NextResponse.json({
      ok: true,
      requestId: request.id,
      status: requestStatus,
    });
  } catch (err) {
    console.error("reservation request error", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        { error: "Veritabanı güncel değil. Lütfen migration'ı çalıştırın." },
        { status: 500 },
      );
    }
    if (process.env.NODE_ENV !== "production" && err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Rezervasyon isteği gönderilemedi." }, { status: 500 });
  }
}
