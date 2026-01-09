import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const adminId = searchParams.get("adminId") || "";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const toDate = toParam ? new Date(toParam) : new Date();

  const logs = await prisma.adminAuditLog.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      action: action ? { contains: action, mode: "insensitive" } : undefined,
      adminId: adminId || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, logs });
}
