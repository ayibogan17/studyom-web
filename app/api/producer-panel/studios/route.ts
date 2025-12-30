import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type StudioRow = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = (url.searchParams.get("query") || "").trim().toLowerCase();

  const studios = await prisma.studio.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, district: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  const filtered = studios.filter((studio) => {
    if (!query) return true;
    return studio.name.toLowerCase().includes(query);
  });

  const result: StudioRow[] = filtered.slice(0, 25).map((studio) => ({
    id: studio.id,
    name: studio.name,
    city: studio.city,
    district: studio.district,
  }));

  return NextResponse.json({ studios: result });
}
