import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const entityType = searchParams.get("entityType") || undefined;
  const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = toParam ? new Date(toParam) : new Date();

  const events = await prisma.contactEvent.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      entityType: entityType || undefined,
    },
    select: { entityType: true, entityId: true, channel: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, events });
}
