import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body?.email?.toString().trim();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const emailNormalized = email.toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://studyom.net";
  const resetLinkBase = `${baseUrl.replace(/\/$/, "")}/reset`;

  if (!resend) {
    console.warn("RESEND_API_KEY tanımlı değil, reset maili gönderilmedi.");
    return NextResponse.json({ ok: true, message: "İşlem alındı" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true },
    });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 30);
      const hashedToken = await bcrypt.hash(token, 10);
      await prisma.passwordResetToken.create({
        data: {
          identifier: emailNormalized,
          token: hashedToken,
          expires,
        },
      });
      const resetLink = `${resetLinkBase}?token=${token}&email=${encodeURIComponent(emailNormalized)}`;
      await resend.emails.send({
        from: process.env.LEAD_FROM || "Studyom <noreply@studyom.net>",
        to: emailNormalized,
        subject: "Studyom şifre sıfırlama",
        html: `<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın.</p><p><a href="${resetLink}">${resetLink}</a></p><p>Bu bağlantı 30 dakika geçerlidir.</p>`,
      });
    } else {
      await resend.emails.send({
        from: process.env.LEAD_FROM || "Studyom <noreply@studyom.net>",
        to: emailNormalized,
        subject: "Studyom şifre sıfırlama",
        html: `<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın.</p><p><a href="${resetLinkBase}">${resetLinkBase}</a></p>`,
      });
    }
    return NextResponse.json({ ok: true, message: "E-posta gönderildi" });
  } catch (e) {
    console.error("Reset maili gönderilemedi", e);
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
