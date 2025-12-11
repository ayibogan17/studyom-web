import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const leadTo = process.env.LEAD_TO;
const leadFrom = process.env.LEAD_FROM || "Studyom <noreply@studyom.net>";

const missingConfig =
  !resendApiKey || !leadTo
    ? "Missing RESEND_API_KEY or LEAD_TO environment variable."
    : null;

function asString(
  value: FormDataEntryValue | string | null | undefined,
): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: Request) {
  if (missingConfig) {
    return NextResponse.json({ error: missingConfig }, { status: 500 });
  }

  const contentType = req.headers.get("content-type") || "";
  let name = "";
  let email = "";
  let note = "";

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      name = asString(body?.name);
      email = asString(body?.email);
      note = asString(body?.message);
    } else {
      const form = await req.formData();
      name = asString(form.get("name"));
      email = asString(form.get("email"));
      note = asString(form.get("message"));
    }
  } catch (error) {
    console.error("Lead parse error:", error);
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 },
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    await resend.emails.send({
      from: leadFrom,
      to: [leadTo as string],
      replyTo: email,
      subject: "Yeni lead - Studyom",
      text: `Yeni lead alındı:

Ad: ${name || "Belirtilmedi"}
E-posta: ${email}
Not: ${note || "-"}
`,
    });

    return NextResponse.json({ ok: true, message: "Lead received." });
  } catch (error) {
    console.error("Lead send failed:", error);
    const message =
      error instanceof Error ? error.message : "Unable to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
