import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.LEAD_FROM || "Studyom <noreply@studyom.net>";
const adminTo = process.env.SIGNUP_ADMIN_TO || "admin@studyom.net";

type Body = {
  signupMethod?: "email" | "google";
  ownerName?: string;
  studioName?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  googleMapsUrl?: string;
  email?: string;
  website?: string;
  verificationNote?: string;
  coords?: { lat: number; lng: number };
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const {
    signupMethod,
    ownerName,
    studioName,
    city,
    district,
    neighborhood,
    address,
    googleMapsUrl,
    email,
    website,
    verificationNote,
    coords,
  } = body;

  if (!ownerName || !studioName || !city || !district || !address || !googleMapsUrl) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
  }

  if (!resend) {
    console.error("RESEND_API_KEY tanımlı değil, signup maili gönderilemedi.");
    return NextResponse.json({ error: "Mail servisi yapılandırılmamış" }, { status: 500 });
  }

  const lines = [
    `Yöntem: ${signupMethod === "google" ? "Google" : "E-posta"}`,
    `Ad Soyad: ${ownerName}`,
    `Stüdyo Adı: ${studioName}`,
    `Şehir: ${city}`,
    `İlçe: ${district}`,
    neighborhood ? `Mahalle/Köy: ${neighborhood}` : null,
    `Adres: ${address}`,
    `Google Maps: ${googleMapsUrl}`,
    coords ? `Koordinat: ${coords.lat}, ${coords.lng}` : null,
    email ? `E-posta (kullanıcı adı): ${email}` : null,
    website ? `Web sitesi: ${website}` : null,
    verificationNote ? `Ek bilgi: ${verificationNote}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminTo,
      subject: "Yeni Stüdyo!",
      text: lines,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Signup mail send failed", e);
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
