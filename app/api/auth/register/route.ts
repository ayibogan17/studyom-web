import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";

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
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: fullName,
          fullName,
          city,
          intent,
          passwordHash,
          role: UserRole.USER,
        },
      });
    } catch (e) {
      // Eğer şema henüz deploy edilmediyse, minimum alanlarla tekrar dene
      if (e instanceof Prisma.PrismaClientValidationError && `${e.message}`.includes("Unknown argument")) {
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: fullName,
            passwordHash,
            role: UserRole.USER,
          },
        });
      } else {
        throw e;
      }
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
