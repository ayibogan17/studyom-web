import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [newUsers, studioApps, teacherApps, producerApps, contactEvents] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.studio.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.teacherApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.producerApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contactEvent.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      newUsers,
      studioApps,
      teacherApps,
      producerApps,
      contactEvents,
    },
  });
}
