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

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, name: true, email: true, image: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const application = await prisma.producerApplication.findFirst({
    where: { userId, status: { in: ["approved", "pending"] } },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });

  return NextResponse.json({
    user: dbUser,
    application: application
      ? { status: application.status as "approved" | "pending", createdAt: application.createdAt.toISOString() }
      : null,
  });
}
