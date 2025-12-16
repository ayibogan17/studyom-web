import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(60),
  city: z.string().min(2).max(80),
  intent: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    const { email, password, fullName, city, intent } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      // Cast to avoid client schema drift on build; runtime matches migrated DB
      data: {
        email: email.toLowerCase(),
        name: fullName,
        fullName,
        city,
        intent,
        passwordHash,
        role: UserRole.USER,
      } as any,
    });
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Beklenmedik hata" }, { status: 500 });
  }
}
