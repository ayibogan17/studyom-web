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
  galleryUrls?: string[];
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

function mapApplicationToTeacher(
  app: { id: number; userId: string; data: unknown; createdAt: Date },
  user?: { fullName: string | null; email: string | null; city: string | null; image: string | null },
  studiosUsed: string[] = [],
): Teacher {
  const data = (app.data || {}) as AppData;
  const displayName = user?.fullName || user?.email || "Bilinmeyen Hoca";
  const slugBase = slugify(displayName);
  const slug = `${slugBase}-${app.id}`;
  const lessonTypes = mapLessonTypes(data.formats || []);
  const galleryUrls = Array.isArray(data.galleryUrls)
    ? data.galleryUrls.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  return {
    id: `app-${app.id}`,
    slug,
    displayName,
    imageUrl: user?.image ?? undefined,
    galleryUrls,
    city: data.city || user?.city || "İstanbul",
    district: undefined,
    instruments: Array.isArray(data.instruments) ? data.instruments : [],
    genres: [],
    level: Array.isArray(data.levels) ? data.levels.join(" / ") : "Belirtilmedi",
    lessonTypes: lessonTypes.length ? lessonTypes : ["online"],
    hourlyRateMin: parsePriceToMin(data.price),
    bio: data.statement || "Açıklama yok.",
    portfolioUrls: Array.isArray(data.links) ? data.links.filter(Boolean) : [],
    studiosUsed,
    isActive: true,
    updatedAt: app.createdAt.toISOString().slice(0, 10),
  };
}

export function parseTeacherApplicationIdFromSlug(slug?: string | null): number | null {
  if (!slug) return null;
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export async function getTeacherIdentityBySlug(slug: string): Promise<{
  slug: string;
  displayName: string;
  status: string;
  userId: string;
  userEmail: string | null;
} | null> {
  const appId = parseTeacherApplicationIdFromSlug(slug);
  if (!appId) return null;
  const application = await prisma.teacherApplication.findUnique({
    where: { id: appId },
  });
  if (!application) return null;
  const user = await prisma.user.findUnique({
    where: { id: application.userId },
    select: { id: true, email: true, fullName: true, name: true },
  });
  if (!user) return null;
  return {
    slug,
    displayName: user.fullName || user.name || user.email || "Bilinmeyen Hoca",
    status: application.status,
    userId: user.id,
    userEmail: user.email ?? null,
  };
}

export async function getApprovedTeachers(): Promise<Teacher[]> {
  const apps = await prisma.teacherApplication.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const studioLinks = userIds.length
    ? await prisma.teacherStudioLink.findMany({
        where: { teacherUserId: { in: userIds }, status: "approved" },
        include: { studio: { select: { name: true } } },
      })
    : [];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true, image: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const studiosMap = new Map<string, string[]>();
  for (const link of studioLinks) {
    if (!link.studio?.name) continue;
    const existing = studiosMap.get(link.teacherUserId) ?? [];
    studiosMap.set(link.teacherUserId, [...existing, link.studio.name]);
  }

  return apps.map((app) =>
    mapApplicationToTeacher(app, userMap.get(app.userId), studiosMap.get(app.userId) ?? []),
  );
}

export async function getApprovedTeacherBySlug(slug?: string | null): Promise<Teacher | null> {
  if (!slug) return null;
  const appId = parseTeacherApplicationIdFromSlug(slug);
  if (appId) {
    const app = await prisma.teacherApplication.findUnique({
      where: { id: appId },
    });
    if (app && app.status === "approved") {
      const studioLinks = await prisma.teacherStudioLink.findMany({
        where: { teacherUserId: app.userId, status: "approved" },
        include: { studio: { select: { name: true } } },
      });
      const user = await prisma.user.findUnique({
        where: { id: app.userId },
        select: { fullName: true, email: true, city: true, image: true },
      });
      const studiosUsed = studioLinks
        .map((link) => link.studio?.name)
        .filter((name): name is string => Boolean(name));
      return mapApplicationToTeacher(app, user ?? undefined, studiosUsed);
    }
  }
  const teachers = await getApprovedTeachers();
  return teachers.find((t) => t.slug === slug) ?? null;
}
