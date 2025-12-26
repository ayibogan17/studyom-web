import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type StudioRow = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  rooms: { extrasJson: unknown }[];
};

function isStudioOpenForTeachers(rooms: { extrasJson: unknown }[]) {
  return rooms.some((room) => {
    if (!room?.extrasJson || typeof room.extrasJson !== "object") return false;
    const extras = room.extrasJson as { acceptsCourses?: boolean };
    return extras.acceptsCourses === true;
  });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = (url.searchParams.get("query") || "").trim().toLowerCase();

  const studios = await prisma.studio.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, district: true, rooms: { select: { extrasJson: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });

  const filtered = studios.filter((studio) => {
    if (!isStudioOpenForTeachers(studio.rooms)) return false;
    if (!query) return true;
    return studio.name.toLowerCase().includes(query);
  });

  const result = filtered.slice(0, 25).map((studio) => ({
    id: studio.id,
    name: studio.name,
    city: studio.city,
    district: studio.district,
  }));

  return NextResponse.json({ studios: result });
}
