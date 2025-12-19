import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import type { LessonType, Teacher } from "@/data/teachers";

type AppData = {
  instruments?: string[];
  levels?: string[];
  formats?: string[];
  city?: string | null;
  languages?: string[];
  price?: string | null;
  statement?: string | null;
  links?: string[];
  years?: string | null;
  students?: string | null;
};

function mapLessonTypes(formats: string[] = []): LessonType[] {
  const hasOnline = formats.includes("Online");
  const hasInPerson = formats.includes("Yüz yüze");
  if (hasOnline && hasInPerson) return ["both"];
  if (hasOnline) return ["online"];
  if (hasInPerson) return ["in-person"];
  return [];
}

function parsePriceToMin(price?: string | null): number | null {
  if (!price) return null;
  const match = price.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export async function getApprovedTeachers(): Promise<Teacher[]> {
  const apps = await prisma.teacherApplication.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return apps.map((app) => {
    const data = (app.data || {}) as AppData;
    const user = userMap.get(app.userId);
    const displayName = user?.fullName || user?.email || "Bilinmeyen Hoca";
    const slugBase = slugify(displayName);
    const slug = `${slugBase}-${app.id}`;
    const lessonTypes = mapLessonTypes(data.formats || []);

    return {
      id: `app-${app.id}`,
      slug,
      displayName,
      city: data.city || user?.city || "İstanbul",
      district: undefined,
      instruments: Array.isArray(data.instruments) ? data.instruments : [],
      genres: [],
      level: Array.isArray(data.levels) ? data.levels.join(" / ") : "Belirtilmedi",
      lessonTypes: lessonTypes.length ? lessonTypes : ["online"],
      hourlyRateMin: parsePriceToMin(data.price),
      bio: data.statement || "Açıklama yok.",
      portfolioUrls: Array.isArray(data.links) ? data.links.filter(Boolean) : [],
      studiosUsed: [],
      isActive: true,
      updatedAt: app.createdAt.toISOString().slice(0, 10),
    };
  });
}

export async function getApprovedTeacherBySlug(slug: string): Promise<Teacher | undefined> {
  const teachers = await getApprovedTeachers();
  return teachers.find((t) => t.slug === slug);
}
