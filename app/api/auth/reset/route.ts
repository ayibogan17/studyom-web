import { NextResponse } from "next/server";
import { Resend } from "resend";

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

  // Basit bir demo: gerçek reset linki yerine yönlendirme bilgisi
  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://studyom.net"}/reset?email=${encodeURIComponent(email)}`;

  if (!resend) {
    console.warn("RESEND_API_KEY tanımlı değil, reset maili gönderilmedi.");
    return NextResponse.json({ ok: true, message: "Demo: env eksik, loga yazıldı" });
  }

  try {
    await resend.emails.send({
      from: process.env.LEAD_FROM || "Studyom <noreply@studyom.net>",
      to: email,
      subject: "Studyom şifre sıfırlama",
      html: `<p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın.</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
    return NextResponse.json({ ok: true, message: "E-posta gönderildi" });
  } catch (e) {
    console.error("Reset maili gönderilemedi", e);
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
