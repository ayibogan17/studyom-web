import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [messageRequests, totalRequestCount, activeThreadCount] = await Promise.all([
    prisma.producerMessageRequest.findMany({
      where: { producerUserId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        createdAt: true,
        fromUser: { select: { fullName: true, email: true } },
      },
    }),
    prisma.producerMessageRequest.count({ where: { producerUserId: userId } }),
    prisma.producerThread.count({ where: { producerUserId: userId } }),
  ]);

  return NextResponse.json({
    requests: messageRequests.map((row) => ({
      id: row.id,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      fromUser: row.fromUser || {},
    })),
    totalRequestCount,
    activeThreadCount,
  });
}
