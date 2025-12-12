// app/api/lead/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const leadTo = process.env.LEAD_TO || "info@studyom.net"; // sana düşecek adres
const leadFrom =
  process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>"; // domain doğrulanmadıysa da çalışır

if (!resendApiKey) {
  console.error("Missing RESEND_API_KEY env.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// küçük yardımcı
function asStr(v: FormDataEntryValue | string | null | undefined): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function POST(req: Request) {
  if (!resend) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }
  try {
    // JSON veya form-data ikisini de destekle
    const ct = (req.headers.get("content-type") || "").toLowerCase();

    let name = "";
    let email = "";
    let note = "";

    if (ct.includes("application/json")) {
      const body = await req.json();
      name = asStr(body?.name);
      email = asStr(body?.email);
      note = asStr(body?.message || body?.note);
    } else {
      const form = await req.formData();
      name = asStr(form.get("name"));
      email = asStr(form.get("email"));
      note = asStr(form.get("message") || form.get("note"));
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // 1) Sana bildirim
    const sendOwner = resend.emails.send({
      from: leadFrom,
      to: [leadTo],
      replyTo: email, // Mail'e "Cevapla" dersen kullanıcıya gider
      subject: "Yeni lead - Studyom",
      text: `Yeni lead alındı!
Ad: ${name || "-"}
E-posta: ${email}
Not: ${note || "-"}
`,
    });

    // 2) Kullanıcıya otomatik cevap
    const sendUser = resend.emails.send({
      from: leadFrom,
      to: [email],
      subject: "Studyom – Talebinizi aldık",
      text: `Merhaba ${name || ""},

Talebinizi başarıyla aldık. Çok kısa sürede size dönüş yapacağız.

Studyom Ekibi
https://studyom.net`,
    });

    const [ownerResult, userResult] = await Promise.all([
      sendOwner,
      sendUser,
    ]);

    if (ownerResult.error || userResult.error) {
      const message =
        ownerResult.error?.message ||
        userResult.error?.message ||
        "Resend send failed.";
      throw new Error(message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("Lead route error:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
