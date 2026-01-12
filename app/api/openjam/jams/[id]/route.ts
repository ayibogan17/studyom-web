import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      note: true,
      startAt: true,
      durationMinutes: true,
      neededInstruments: true,
      capacity: true,
      status: true,
      studio: {
        select: { id: true, name: true, city: true, district: true, address: true },
      },
      participants: {
        select: {
          id: true,
          instrument: true,
          level: true,
          status: true,
          user: { select: { id: true, name: true, fullName: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      createdByUser: { select: { id: true } },
    },
  });
  if (!jam) return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  return NextResponse.json({ jam });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: { createdByUserId: true },
  });
  if (!jam) return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  if (jam.createdByUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.openJam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
