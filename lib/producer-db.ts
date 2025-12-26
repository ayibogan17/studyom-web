import "server-only";

import { prisma } from "@/lib/prisma";
import type { ProducerProfile, ProducerStatus } from "@/lib/producers";

type AppData = {
  areas?: string[];
  workTypes?: string[];
  modes?: string[];
  city?: string | null;
  genres?: string[];
  statement?: string | null;
  links?: string[];
};

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseAppData(value: unknown): AppData {
  if (value && typeof value === "object") return value as AppData;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as AppData;
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

export async function getProducerListings(): Promise<ProducerProfile[]> {
  const applications = await prisma.producerApplication.findMany({
    where: { status: { in: ["approved", "pending"] } },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const latest = applications.filter((app) => {
    if (seen.has(app.userId)) return false;
    seen.add(app.userId);
    return true;
  });

  const userIds = latest.map((app) => app.userId);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const ordered = [
    ...latest.filter((app) => app.status === "approved"),
    ...latest.filter((app) => app.status !== "approved"),
  ];

  return ordered.map((app) => {
    const data = parseAppData(app.data);
    const areas = normalizeArray(data.areas);
    const workTypes = normalizeArray(data.workTypes);
    const modes = normalizeArray(data.modes);
    const genres = normalizeArray(data.genres);
    const links = normalizeArray(data.links).filter(isHttpUrl).slice(0, 5);
    const user = userMap.get(app.userId);
    const displayName = user?.fullName || user?.email || "Üretici";
    const city = data.city || user?.city || null;
    const statement =
      typeof data.statement === "string" && data.statement.trim().length > 0
        ? data.statement.trim()
        : "Açıklama eklenmedi.";
    const status = (app.status === "approved" ? "approved" : "pending") as ProducerStatus;
    return {
      id: `producer-${app.id}`,
      userId: app.userId,
      displayName,
      city,
      areas,
      workTypes,
      modes,
      genres,
      statement,
      links,
      status,
    };
  });
}
