import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  id: z.string().min(1),
  kind: z.enum(["reservation", "lead", "teacher-lead"]),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { email?: string | null } | undefined;
  const userEmail = sessionUser?.email?.toLowerCase();
  if (!userEmail) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { id, kind } = parsed.data;

  try {
    if (kind === "reservation") {
      const updated = await prisma.notification.updateMany({
        where: { id, studio: { ownerEmail: userEmail } },
        data: { isRead: true },
      });
      if (updated.count === 0) {
        return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
      }
    }

    if (kind === "lead") {
      const updated = await prisma.lead.updateMany({
        where: { id, email: userEmail },
        data: { isRead: true },
      });
      if (updated.count === 0) {
        return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
      }
    }

    if (kind === "teacher-lead") {
      const updated = await prisma.teacherLead.updateMany({
        where: { id, studentEmail: userEmail },
        data: { isRead: true },
      });
      if (updated.count === 0) {
        return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notification mark read failed", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
