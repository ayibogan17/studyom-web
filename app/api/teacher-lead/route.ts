import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getTeacherBySlug } from "@/lib/teachers";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY;
const leadTo = process.env.LEAD_TO || "admin@studyom.net";
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const schema = z.object({
  teacherSlug: z.string().min(1),
  studentName: z.string().min(2),
  studentEmail: z.string().email(),
  city: z.string().min(2),
  preferredLessonType: z.enum(["online", "in-person", "both"]).optional(),
  message: z.string().min(10).max(800),
});

// simple in-memory cooldown per email + teacher
const cooldownMs = 1000 * 60 * 60; // 1 hour
const cooldownMap = new Map<string, number>();

function keyFor(email: string, teacherSlug: string) {
  return `${teacherSlug}::${email.toLowerCase().trim()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
    }
    const { teacherSlug, studentEmail, studentName, city, preferredLessonType, message } = parsed.data;
    const teacher = getTeacherBySlug(teacherSlug);
    if (!teacher) {
      return NextResponse.json({ ok: false, error: "Öğretmen bulunamadı" }, { status: 404 });
    }

    const cooldownKey = keyFor(studentEmail, teacherSlug);
    const last = cooldownMap.get(cooldownKey);
    if (last && Date.now() - last < cooldownMs) {
      return NextResponse.json({ ok: false, error: "Lütfen 1 saat sonra tekrar deneyin." }, { status: 429 });
    }

    if (resend) {
      const lessonTypeText = preferredLessonType ? `Tercih: ${preferredLessonType}` : "Tercih belirtilmedi";
      const emailText = `Yeni öğretmen talebi
Öğretmen: ${teacher.displayName} (${teacher.slug})
Öğrenci: ${studentName}
E-posta: ${studentEmail}
Şehir: ${city}
${lessonTypeText}
Mesaj:
${message}

Not: Ders ve stüdyo ayarlamaları öğretmenle doğrudan yapılır. Studyom araya girmez.
`;

      const sendOwner = resend.emails.send({
        from: leadFrom,
        to: [leadTo],
        replyTo: studentEmail,
        subject: `Yeni öğretmen talebi - ${teacher.displayName}`,
        text: emailText,
      });

      await sendOwner;
    }

    cooldownMap.set(cooldownKey, Date.now());

    // Kaydı veri tabanına işle (admin görünümü için)
    try {
      await prisma.teacherLead.create({
        data: {
          teacherSlug,
          teacherName: teacher.displayName,
          studentName,
          studentEmail,
          city,
          preferredLessonType: preferredLessonType ?? null,
          message,
        },
      });
    } catch (err) {
      console.error("teacher lead save failed", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Beklenmeyen hata" }, { status: 500 });
  }
}
