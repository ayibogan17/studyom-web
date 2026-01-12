import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, participantId } = await params;
  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: { createdByUserId: true },
  });
  if (!jam) return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  if (jam.createdByUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await prisma.openJamParticipant.delete({ where: { id: participantId } });
  return NextResponse.json({ ok: true });
}
