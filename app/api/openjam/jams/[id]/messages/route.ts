import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const messageSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const messages = await prisma.openJamMessage.findMany({
    where: { jamId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      message: true,
      createdAt: true,
      user: { select: { id: true, name: true, fullName: true, image: true } },
    },
  });
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz mesaj" }, { status: 400 });
  }

  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!jam || jam.status !== "active") {
    return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  }

  const created = await prisma.openJamMessage.create({
    data: {
      jamId: id,
      userId,
      message: parsed.data.message,
    },
    select: {
      id: true,
      message: true,
      createdAt: true,
      user: { select: { id: true, name: true, fullName: true, image: true } },
    },
  });

  return NextResponse.json({ message: created });
}
