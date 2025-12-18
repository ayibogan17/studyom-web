import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");
  const disabled = searchParams.get("disabled");

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role as any;
  if (disabled === "true") where.isDisabled = true;
  if (disabled === "false") where.isDisabled = false;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      city: true,
      intent: true,
      isDisabled: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, users });
}
