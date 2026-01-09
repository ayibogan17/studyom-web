import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const token = parsed.data.token;
    const password = parsed.data.password;

    const tokens = await prisma.passwordResetToken.findMany({
      where: { identifier: email, expires: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    let valid = false;
    for (const record of tokens) {
      if (await bcrypt.compare(token, record.token)) {
        valid = true;
        break;
      }
    }
    if (!valid) {
      return NextResponse.json({ error: "Bağlantı geçersiz veya süresi dolmuş." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.deleteMany({ where: { identifier: email } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset confirm error", err);
    return NextResponse.json({ error: "Şifre güncellenemedi." }, { status: 500 });
  }
}
