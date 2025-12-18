import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const active = searchParams.get("active");

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
    ];
  }
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const studios = await prisma.studio.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      address: true,
      ownerEmail: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, studios });
}
