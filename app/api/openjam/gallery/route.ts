import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const images = await prisma.openJamGalleryImage.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, photoUrl: true },
  });

  return NextResponse.json({ images });
}
