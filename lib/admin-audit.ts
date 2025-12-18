import { prisma } from "@/lib/prisma";

export async function logAdminAction(params: {
  adminId: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        before: params.before ? (params.before as any) : null,
        after: params.after ? (params.after as any) : null,
      },
    });
  } catch (err) {
    console.error("Admin audit log failed", err);
  }
}
