import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getProducerListings } from "@/lib/producer-db";
import { getApprovedTeachers } from "@/lib/teacher-db";

const baseUrl = "https://www.studyom.net";

const staticRoutes = [
  "",
  "/studyo",
  "/hocalar",
  "/uretim",
  "/openjam",
  "/iletisim",
  "/hakkinda",
  "/gizlilik",
  "/kvkk",
  "/hoca-sartlari",
  "/studyo-sahibi-sartlari",
  "/uretici-sartlari",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [studios, producers, teachers] = await Promise.all([
    prisma.studio.findMany({
      where: { isActive: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    getProducerListings(),
    getApprovedTeachers(),
  ]);

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  const studioEntries = studios.map((studio) => ({
    url: `${baseUrl}/studyo/${studio.slug}`,
    lastModified: studio.updatedAt ?? new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const producerEntries = producers
    .filter((producer) => producer.slug)
    .map((producer) => ({
      url: `${baseUrl}/uretim/${producer.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const teacherEntries = teachers
    .filter((teacher) => teacher.slug)
    .map((teacher) => ({
      url: `${baseUrl}/hocalar/${teacher.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticEntries, ...studioEntries, ...producerEntries, ...teacherEntries];
}
