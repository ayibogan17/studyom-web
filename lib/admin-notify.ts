import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";
const adminToRaw = process.env.SIGNUP_ADMIN_TO || process.env.LEAD_TO || "admin@studyom.net";
const adminTo = adminToRaw
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function notifyAdmin(subject: string, text: string) {
  if (!resend) {
    console.error("Missing RESEND_API_KEY, admin mail not sent.");
    return { ok: false };
  }
  if (adminTo.length === 0) {
    console.error("No admin recipients configured, admin mail not sent.");
    return { ok: false };
  }

  try {
    const result = await resend.emails.send({
      from: leadFrom,
      to: adminTo,
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
