import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function notifyUser(to: string | null | undefined, subject: string, text: string) {
  if (!to || typeof to !== "string") {
    return { ok: false };
  }
  if (!resend) {
    console.error("Missing RESEND_API_KEY, user mail not sent.");
    return { ok: false };
  }
  try {
    const result = await resend.emails.send({
      from: leadFrom,
      to: [to],
      subject,
      text,
    });
    if (result.error) {
      console.error("Resend error:", result.error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend error:", err);
    return { ok: false };
  }
}
