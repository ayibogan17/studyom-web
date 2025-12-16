import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(60),
  city: z.string().min(2).max(80),
  intent: z.array(z.string()).min(1),
});

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <onboarding@resend.dev>";
const baseUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : `https://${process.env.VERCEL_URL}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    const { email, password, fullName, city, intent } = parsed.data;
    const emailNormalized = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });
    if (existing) {
      // Eğer eski kayıtta passwordHash yoksa (örn. Google ile gelen veya hatalı kayıt), şifreyi güncelle
      if (!existing.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 10);
        const updated = await prisma.user.update({
          where: { email: emailNormalized },
          data: {
            passwordHash,
            name: existing.name || fullName,
            fullName: existing.fullName || fullName,
            city: existing.city || city,
            intent: existing.intent?.length ? existing.intent : intent,
          },
        });
        return NextResponse.json({ ok: true, userId: updated.id, updated: true });
      }
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    user = await prisma.user
      .create({
        data: {
          email: emailNormalized,
          name: fullName,
          fullName,
          city,
          intent,
          passwordHash,
          role: UserRole.USER,
          emailVerified: null,
        },
      })
      .catch(async (e) => {
        const msg = `${(e as Error).message}`;
        // Eğer şema henüz deploy edilmediyse, minimum alanlarla tekrar dene
        if (msg.includes("Unknown argument `fullName`")) {
          return prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: fullName,
              passwordHash,
              role: UserRole.USER,
              emailVerified: null,
            },
          });
        }
        throw e;
      });

    // Doğrulama tokenı oluştur ve mail gönder
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
      await prisma.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token,
          expires,
        },
      });
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const verifyLink = `${baseUrl || "http://localhost:3000"}/verify?token=${token}&email=${encodeURIComponent(
          email.toLowerCase(),
        )}`;
        await resend.emails.send({
          from: leadFrom,
          to: [email.toLowerCase()],
          subject: "Studyom | E-posta doğrulaması",
          html: `<p>Merhaba ${fullName},</p>
<p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="${verifyLink}">${verifyLink}</a></p>
<p>Bu bağlantı 24 saat geçerlidir.</p>
<p>Studyom Ekibi</p>`,
        });
      }
    } catch (err) {
      console.error("Verification email error:", err);
      // dev ortamında mail hatasını bloklamayalım
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("Register error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `DB hatası: ${err.code}` }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Beklenmedik hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
