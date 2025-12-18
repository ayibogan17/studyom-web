import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["USER", "STUDIO", "ADMIN"]).optional(),
  isDisabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limit = rateLimit(`admin:${admin.id}:users:${id}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  const data: any = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (typeof parsed.data.isDisabled === "boolean") data.isDisabled = parsed.data.isDisabled;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await prisma.user.findUnique({
      where: { id },
      select: { role: true, isDisabled: true },
    });
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, role: true, isDisabled: true },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "user",
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
