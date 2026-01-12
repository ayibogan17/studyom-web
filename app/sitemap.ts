import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getProducerListings } from "@/lib/producer-db";
import { getApprovedTeachers } from "@/lib/teacher-db";
import { isProductionIndexingOn } from "@/lib/seo/productionIndexing";

const baseUrl = "https://www.studyom.net";

const productionSeoRoutes = [
  "/istanbul/mixing-mastering",
  "/online/mixing-mastering",
  "/istanbul/beat-yapimi",
  "/rap-hiphop/beat-yapimi",
  "/istanbul/muzik-produksiyonu",
  "/istanbul/aranjor",
];

const staticRoutes = [
  "",
  "/studyo",
  "/istanbul/prova-studyosu",
  "/istanbul/kayit-studyosu",
  "/istanbul/vokal-kabini",
  "/ankara/prova-studyosu",
  "/ankara/kayit-studyosu",
  "/ankara/vokal-kabini",
  "/izmir/prova-studyosu",
  "/izmir/kayit-studyosu",
  "/izmir/vokal-kabini",
  "/turkiye/prova-studyolari",
  "/turkiye/kayit-studyolari",
  "/turkiye/vokal-kabinleri",
  "/bursa/prova-studyosu",
  "/bursa/kayit-studyosu",
  "/antalya/prova-studyosu",
  "/antalya/kayit-studyosu",
  "/adana/prova-studyosu",
  "/adana/kayit-studyosu",
  "/konya/prova-studyosu",
  "/konya/kayit-studyosu",
  "/kocaeli/prova-studyosu",
  "/kocaeli/kayit-studyosu",
  "/mersin/prova-studyosu",
  "/mersin/kayit-studyosu",
  "/gaziantep/prova-studyosu",
  "/gaziantep/kayit-studyosu",
  "/istanbul/kadikoy/prova-studyosu",
  "/istanbul/kadikoy/kayit-studyosu",
  "/istanbul/besiktas/prova-studyosu",
  "/istanbul/besiktas/kayit-studyosu",
  "/istanbul/sisli/prova-studyosu",
  "/istanbul/sisli/kayit-studyosu",
  "/istanbul/beyoglu/prova-studyosu",
  "/istanbul/beyoglu/kayit-studyosu",
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

  // Production SEO pages are excluded from sitemap when indexing is toggled off.
  const routes = isProductionIndexingOn()
    ? [...staticRoutes, ...productionSeoRoutes]
    : staticRoutes;

  const staticEntries = routes.map((route) => ({
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
