import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

const schema = z.object({
  contentKey: z.string().trim().min(2),
  title: z.string().trim().optional().nullable(),
  body: z.string().trim().optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET() {
  await requireAdmin();
  const blocks = await prisma.contentBlock.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ ok: true, blocks });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }
  try {
    const created = await prisma.contentBlock.create({
      data: {
        contentKey: parsed.data.contentKey,
        title: parsed.data.title ?? null,
        body: parsed.data.body ?? "",
        status: parsed.data.status ?? "draft",
      },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "content_block",
      entityId: created.id,
      action: "create",
      after: created,
    });
    return NextResponse.json({ ok: true, block: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
