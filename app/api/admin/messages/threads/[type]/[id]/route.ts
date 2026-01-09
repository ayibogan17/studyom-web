import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  locked: z.boolean().optional(),
  resolved: z.boolean().optional(),
  investigationEnabled: z.boolean().optional(),
  internalNote: z.string().trim().optional().nullable(),
  complaintsCount: z.number().int().min(0).optional(),
});

function pickThreadModel(type: string) {
  if (type === "studio") return prisma.studioThread;
  if (type === "teacher") return prisma.teacherThread;
  if (type === "producer") return prisma.producerThread;
  return null;
}

export async function PATCH(req: Request, context: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await context.params;
  const admin = await requireAdmin();
  const model = pickThreadModel(type);
  if (!model) {
    return NextResponse.json({ ok: false, error: "Geçersiz tip" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof parsed.data.locked === "boolean") updateData.locked = parsed.data.locked;
  if (typeof parsed.data.resolved === "boolean") updateData.resolved = parsed.data.resolved;
  if (typeof parsed.data.investigationEnabled === "boolean") {
    updateData.investigationEnabled = parsed.data.investigationEnabled;
  }
  if (typeof parsed.data.internalNote !== "undefined") updateData.internalNote = parsed.data.internalNote || null;
  if (typeof parsed.data.complaintsCount === "number") updateData.complaintsCount = parsed.data.complaintsCount;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await model.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Kayıt bulunamadı" }, { status: 404 });
    }
    const updated = await model.update({ where: { id }, data: updateData });
    await logAdminAction({
      adminId: admin.id,
      entityType: "message_thread",
      entityId: `${type}:${id}`,
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
