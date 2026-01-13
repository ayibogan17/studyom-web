import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type ProducerApplicationData = {
  areas?: string[];
  workTypes?: string[];
  modes?: string[];
  city?: string | null;
  genres?: string[];
  statement?: string | null;
  bio?: string | null;
  links?: string[];
  galleryUrls?: string[];
  projects?: string | null;
  years?: string | null;
  price?: string | null;
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
};

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseData(value: unknown): ProducerApplicationData {
  if (value && typeof value === "object") return value as ProducerApplicationData;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ProducerApplicationData;
    } catch {
      return {};
    }
  }
  return {};
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const application = await prisma.producerApplication.findFirst({
    where: { userId, status: { in: ["approved", "pending"] } },
    orderBy: { createdAt: "desc" },
    select: { data: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }

  const data = parseData(application.data);
  const areas = normalizeArray(data.areas);
  const workTypes = normalizeArray(data.workTypes);
  const modes = normalizeArray(data.modes);
  const genres = normalizeArray(data.genres);
  const links = normalizeArray(data.links).filter(isHttpUrl);
  const galleryUrls = normalizeArray(data.galleryUrls).filter(isHttpUrl).slice(0, 5);
  const city = typeof data.city === "string" ? data.city : dbUser.city || "";
  const price = typeof data.price === "string" && data.price.trim() ? data.price : "";
  const statement = typeof data.statement === "string" && data.statement.trim() ? data.statement.trim() : "";
  const bio = typeof data.bio === "string" && data.bio.trim() ? data.bio.trim() : "";
  const years = typeof data.years === "string" && data.years.trim() ? data.years : "";
  const projects = typeof data.projects === "string" && data.projects.trim() ? data.projects : "";
  const whatsappNumber = typeof data.whatsappNumber === "string" ? data.whatsappNumber : "";
  const whatsappEnabled = Boolean(data.whatsappEnabled);

  return NextResponse.json({
    profile: {
      areas,
      workTypes,
      modes,
      city,
      genres,
      price,
      years,
      projects,
      statement,
      bio,
    },
    links,
    galleryUrls,
    whatsapp: { number: whatsappNumber, enabled: whatsappEnabled },
    user: {
      fullName: dbUser.fullName,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
    },
  });
}
