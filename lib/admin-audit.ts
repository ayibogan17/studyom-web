import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAdminAction(params: {
  adminId: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        before: params.before ? (params.before as Prisma.InputJsonValue) : undefined,
        after: params.after ? (params.after as Prisma.InputJsonValue) : undefined,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    console.error("Admin audit log failed", err);
  }
}
