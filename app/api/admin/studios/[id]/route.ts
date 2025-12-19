import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  isActive: z.boolean().optional(),
  decision: z.enum(["approved", "rejected"]).optional(),
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

  const nextIsActive =
    typeof parsed.data.isActive === "boolean"
      ? parsed.data.isActive
      : parsed.data.decision
        ? parsed.data.decision === "approved"
        : undefined;

  if (typeof nextIsActive !== "boolean" && !parsed.data.decision) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await prisma.studio.findUnique({
      where: { id },
      select: { isActive: true, name: true },
    });
    const updateData: {
      isActive?: boolean;
      notifications?: { create: { message: string } };
    } = {};
    if (typeof nextIsActive === "boolean") {
      updateData.isActive = nextIsActive;
    }
    if (parsed.data.decision) {
      updateData.notifications = {
        create: { message: `Başvuru durumu: ${parsed.data.decision}` },
      };
    }

    const updated = await prisma.studio.update({
      where: { id },
      data: updateData,
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
