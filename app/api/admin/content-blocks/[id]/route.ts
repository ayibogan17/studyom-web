import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().optional().nullable(),
  body: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }
  try {
    const before = await prisma.contentBlock.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Kayıt bulunamadı" }, { status: 404 });
    }
    const updated = await prisma.contentBlock.update({
      where: { id },
      data: {
        title: parsed.data.title === null ? undefined : parsed.data.title,
        body: parsed.data.body === null ? undefined : parsed.data.body,
        status: parsed.data.status,
      },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "content_block",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });
    return NextResponse.json({ ok: true, block: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  try {
    const before = await prisma.contentBlock.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Kayıt bulunamadı" }, { status: 404 });
    }
    await prisma.contentBlock.delete({ where: { id } });
    await logAdminAction({
      adminId: admin.id,
      entityType: "content_block",
      entityId: id,
      action: "delete",
      before,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
