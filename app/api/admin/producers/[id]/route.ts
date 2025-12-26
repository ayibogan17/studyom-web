import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";
import { notifyUser } from "@/lib/user-notify";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["pending", "approved", "rejected", "closed"]),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limiter = rateLimit(`admin:${admin.id}:producer:${id}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }

  const appId = Number(id);
  if (!Number.isFinite(appId)) {
    return NextResponse.json({ ok: false, error: "Geçersiz id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  try {
    const beforeRows = await prisma.$queryRaw<{ status: string; userId: string }[]>`
      SELECT status, "userId" FROM "ProducerApplication" WHERE id = ${appId} LIMIT 1
    `;
    await prisma.$executeRaw`
      UPDATE "ProducerApplication" SET status = ${parsed.data.status} WHERE id = ${appId}
    `;
    const updated = { id: appId, status: parsed.data.status };
    await logAdminAction({
      adminId: admin.id,
      entityType: "producerApplication",
      entityId: id,
      action: "update",
      before: beforeRows[0] ?? null,
      after: updated,
    });

    const before = beforeRows[0];
    if (
      before &&
      before.status !== parsed.data.status &&
      (parsed.data.status === "approved" || parsed.data.status === "rejected")
    ) {
      const user = await prisma.user.findUnique({
        where: { id: before.userId },
        select: { email: true, fullName: true, name: true },
      });
      const name = user?.fullName ?? user?.name;
      const subject =
        parsed.data.status === "approved"
          ? "Studyom – Üretici başvurun onaylandı"
          : "Studyom – Üretici başvurun reddedildi";
      const text =
        parsed.data.status === "approved"
          ? `Merhaba ${name || ""},

Üretici başvurun incelendi ve onaylandı. Profilin kısa süre içinde listelerde görünecektir.

Teşekkürler,
Studyom`
          : `Merhaba ${name || ""},

Üretici başvurun incelendi ve şu an için kabul edilemedi. Dilersen bilgilerini güncelleyip daha sonra tekrar başvurabilirsin.

Teşekkürler,
Studyom`;
      await notifyUser(user?.email, subject, text);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
