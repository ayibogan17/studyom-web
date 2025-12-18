import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limiter = rateLimit(`admin:${admin.id}:studio:${id}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  if (typeof parsed.data.isActive !== "boolean") {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await prisma.studio.findUnique({
      where: { id },
      select: { isActive: true, name: true },
    });
    const updated = await prisma.studio.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "studio",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
