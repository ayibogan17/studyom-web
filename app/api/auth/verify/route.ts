import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email")?.toLowerCase();
    if (!token || !email) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.identifier.toLowerCase() !== email) {
      return NextResponse.json({ error: "Geçersiz veya kullanılmış bağlantı" }, { status: 400 });
    }
    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return NextResponse.json({ error: "Bağlantının süresi doldu" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: "Beklenmedik hata" }, { status: 500 });
  }
}
