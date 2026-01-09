import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";
import { mergeRoles, normalizeRoles, ROLE_KEYS, type RoleKey } from "@/lib/roles";

export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["USER", "STUDIO", "ADMIN"]).optional(),
  roles: z.array(z.enum(ROLE_KEYS)).optional(),
  isDisabled: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().trim().optional().nullable(),
  adminNote: z.string().trim().optional().nullable(),
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

  const data: Record<string, unknown> = {};
  const wantsLegacyRole = typeof parsed.data.role === "string";
  const wantsRoles = Array.isArray(parsed.data.roles);
  if (wantsLegacyRole) data.role = parsed.data.role;
  if (typeof parsed.data.isDisabled === "boolean") data.isDisabled = parsed.data.isDisabled;
  if (typeof parsed.data.isSuspended === "boolean") data.isSuspended = parsed.data.isSuspended;
  if (typeof parsed.data.isBanned === "boolean") data.isBanned = parsed.data.isBanned;
  if (typeof parsed.data.banReason !== "undefined") data.banReason = parsed.data.banReason || null;
  if (typeof parsed.data.adminNote !== "undefined") data.adminNote = parsed.data.adminNote || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        roles: true,
        isTeacher: true,
        isProducer: true,
        isStudioOwner: true,
        isDisabled: true,
        isSuspended: true,
        isBanned: true,
        banReason: true,
        adminNote: true,
      },
    });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    let nextRoles: RoleKey[] | null = null;
    if (wantsRoles) {
      nextRoles = mergeRoles([], parsed.data.roles ?? []);
    } else if (wantsLegacyRole) {
      const baseRoles = normalizeRoles(before);
      if (parsed.data.role === "ADMIN") nextRoles = mergeRoles(baseRoles, ["admin"]);
      if (parsed.data.role === "STUDIO") nextRoles = mergeRoles(baseRoles, ["studio_owner"]);
      if (parsed.data.role === "USER") nextRoles = mergeRoles(baseRoles, ["musician"]);
    }

    if (nextRoles) {
      data.roles = { set: nextRoles };
      data.isTeacher = nextRoles.includes("teacher");
      data.isProducer = nextRoles.includes("producer");
      data.isStudioOwner = nextRoles.includes("studio_owner");
      data.role = nextRoles.includes("admin")
        ? "ADMIN"
        : nextRoles.includes("studio_owner")
          ? "STUDIO"
          : "USER";
    }

    const nextIsSuspended =
      typeof parsed.data.isSuspended === "boolean" ? parsed.data.isSuspended : before.isSuspended;
    const nextIsBanned =
      typeof parsed.data.isBanned === "boolean" ? parsed.data.isBanned : before.isBanned;
    if (typeof parsed.data.isSuspended === "boolean" || typeof parsed.data.isBanned === "boolean") {
      data.isDisabled = Boolean(nextIsSuspended || nextIsBanned);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        role: true,
        roles: true,
        isTeacher: true,
        isProducer: true,
        isStudioOwner: true,
        isDisabled: true,
        isSuspended: true,
        isBanned: true,
        banReason: true,
        adminNote: true,
      },
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
