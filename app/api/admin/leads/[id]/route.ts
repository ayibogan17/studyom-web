import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  kind: z.enum(["teacher", "lead"]),
  status: z.enum(["new", "contacted", "closed"]),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limiter = rateLimit(`admin:${admin.id}:lead:${id}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  const { kind, status } = parsed.data;

  try {
    if (kind === "teacher") {
      const before = await prisma.teacherLead.findUnique({
        where: { id },
        select: { status: true },
      });
      const updated = await prisma.teacherLead.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      });
      await logAdminAction({
        adminId: admin.id,
        entityType: "teacherLead",
        entityId: id,
        action: "update",
        before,
        after: updated,
      });
    } else {
      const before = await prisma.lead.findUnique({
        where: { id },
        select: { status: true },
      });
      const updated = await prisma.lead.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      });
      await logAdminAction({
        adminId: admin.id,
        entityType: "lead",
        entityId: id,
        action: "update",
        before,
        after: updated,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
