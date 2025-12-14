import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.LEAD_FROM || "Studyom <noreply@studyom.net>";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studyom.net";

export async function POST(req: Request) {
  let email = "";
  let name = "";
  try {
    const body = await req.json();
    email = (body?.email || "").toString().trim();
    name = (body?.name || "").toString().trim();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const verifyUrl = `${siteUrl}/verify?email=${encodeURIComponent(email)}`;

  if (!resend) {
    console.warn("RESEND_API_KEY tanımlı değil, doğrulama maili gönderilmedi.");
    return NextResponse.json({
      ok: true,
      message: "Demo: RESEND_API_KEY tanımlı değil, mail gönderilmedi.",
    });
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Studyom e-posta doğrulama",
      html: `<p>Merhaba ${name || ""},</p>
<p>Studyom hesabını tamamlamak için e-postanı doğrula.</p>
<p><a href="${verifyUrl}" target="_blank">Doğrula</a></p>
<p>Link çalışmazsa kopyala: ${verifyUrl}</p>`,
    });
    return NextResponse.json({ ok: true, message: "Doğrulama maili gönderildi" });
  } catch (e) {
    console.error("Verify email send failed", e);
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
