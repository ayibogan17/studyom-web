import "server-only";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import type { ProducerProfile, ProducerStatus } from "@/lib/producers";

type AppData = {
  areas?: string[];
  workTypes?: string[];
  modes?: string[];
  city?: string | null;
  genres?: string[];
  statement?: string | null;
  links?: string[];
  galleryUrls?: string[];
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
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

function buildProducerSlug(name: string, id: string | number) {
  return `${slugify(name)}-${id}`;
}

export function parseProducerApplicationIdFromSlug(slug?: string | null): number | null {
  if (!slug) return null;
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export async function getProducerIdentityBySlug(slug: string): Promise<{
  slug: string;
  displayName: string;
  status: string;
  userId: string;
  userEmail: string | null;
  whatsappNumber: string | null;
  whatsappEnabled: boolean;
} | null> {
  const appId = parseProducerApplicationIdFromSlug(slug);
  let application: ProducerApp | null = null;
  let user: ProducerUser | null = null;

  if (appId) {
    application = await prisma.producerApplication.findUnique({
      where: { id: appId },
    });
    if (!application) return null;
    user = await prisma.user.findUnique({
      where: { id: application.userId },
      select: { id: true, email: true, fullName: true, name: true, city: true, image: true },
    });
  } else {
    const baseSlug = slug.replace(/-\d+$/, "");
    const apps = await prisma.producerApplication.findMany({
      where: { status: { in: ["approved", "pending"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const userIds = Array.from(new Set(apps.map((row) => row.userId)));
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, fullName: true, name: true, city: true, image: true },
        })
      : [];
    const userMap = new Map(users.map((item) => [item.id, item]));
    const matched = apps.find((row) => {
      const displayName =
        userMap.get(row.userId)?.fullName ||
        userMap.get(row.userId)?.name ||
        userMap.get(row.userId)?.email ||
        "Üretici";
      return slugify(displayName) === baseSlug;
    });
    if (!matched) return null;
    application = matched;
    user = userMap.get(matched.userId) ?? null;
  }

  if (!application || !user) return null;
  const displayName = user.fullName || user.name || user.email || "Üretici";
  const data = (application.data || {}) as AppData;
  return {
    slug,
    displayName,
    status: application.status,
    userId: user.id,
    userEmail: user.email ?? null,
    whatsappNumber: typeof data.whatsappNumber === "string" ? data.whatsappNumber : null,
    whatsappEnabled: Boolean(data.whatsappEnabled),
  };
}

type ProducerApp = {
  id: number;
  userId: string;
  data: unknown;
  status: string;
  createdAt: Date | string;
};

type ProducerUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  name?: string | null;
  city: string | null;
  image: string | null;
};

function mapApplicationToProfile(app: ProducerApp, user?: ProducerUser | null): ProducerProfile {
  const data = parseAppData(app.data);
  const areas = normalizeArray(data.areas);
  const workTypes = normalizeArray(data.workTypes);
  const modes = normalizeArray(data.modes);
  const genres = normalizeArray(data.genres);
  const links = normalizeArray(data.links).filter(isHttpUrl).slice(0, 5);
  const galleryUrls = normalizeArray(data.galleryUrls).filter(isHttpUrl).slice(0, 5);
  const displayName = user?.fullName || user?.name || user?.email || "Üretici";
  const city = data.city || user?.city || null;
  const statement =
    typeof data.statement === "string" && data.statement.trim().length > 0
      ? data.statement.trim()
      : "Açıklama eklenmedi.";
  const status = (app.status === "approved" ? "approved" : "pending") as ProducerStatus;
  const slug = buildProducerSlug(displayName, app.id);
  return {
    id: `producer-${app.id}`,
    userId: app.userId,
    slug,
    displayName,
    image: user?.image ?? null,
    city,
    areas,
    workTypes,
    modes,
    genres,
    statement,
    links,
    galleryUrls,
    status,
  };
}

function buildMockProducers(): ProducerProfile[] {
  return [
    {
      id: "mock-producer-1",
      userId: "mock-user-1",
      slug: buildProducerSlug("Ece Karahan", "mock-producer-1"),
      displayName: "Ece Karahan",
      city: "İstanbul",
      areas: ["Beat yapımı", "Müzik prodüksiyonu", "Mixing"],
      workTypes: ["Var olan projeye katkı", "Baştan sona prodüksiyon"],
      modes: ["Online", "Kendi stüdyomda"],
      genres: ["Pop", "Electronic"],
      statement: "Modern pop ve elektronik projelerde ritim ve prodüksiyon üzerine çalışıyorum.",
      links: ["https://soundcloud.com/"],
      status: "approved",
    },
    {
      id: "mock-producer-2",
      userId: "mock-user-2",
      slug: buildProducerSlug("Mert Çolak", "mock-producer-2"),
      displayName: "Mert Çolak",
      city: "Ankara",
      areas: ["Davul yazımı", "Bas yazımı", "Aranje"],
      workTypes: ["Şarkıya parça yazma", "Revizyon / edit"],
      modes: ["Online"],
      genres: ["Rock", "Metal"],
      statement: "Canlı davul ve bas yazımı, düzenleme ve aranje konularında destek veriyorum.",
      links: ["https://www.youtube.com/"],
      status: "approved",
    },
    {
      id: "mock-producer-3",
      userId: "mock-user-3",
      slug: buildProducerSlug("Selin Uçar", "mock-producer-3"),
      displayName: "Selin Uçar",
      city: "İzmir",
      areas: ["Sound design", "Mixing", "Mastering"],
      workTypes: ["Var olan projeye katkı", "Revizyon / edit"],
      modes: ["Online", "Müşteri stüdyosunda"],
      genres: ["Electronic", "Experimental"],
      statement: "Mix ve mastering tarafında temiz, modern ve dengeli sonuçlara odaklanıyorum.",
      links: ["https://open.spotify.com/"],
      status: "approved",
    },
    {
      id: "mock-producer-4",
      userId: "mock-user-4",
      slug: buildProducerSlug("Bora Şen", "mock-producer-4"),
      displayName: "Bora Şen",
      city: "Bursa",
      areas: ["Gitar yazımı", "Telli enstrüman yazımı", "Aranje"],
      workTypes: ["Şarkıya parça yazma", "Var olan projeye katkı"],
      modes: ["Online", "Kendi stüdyomda"],
      genres: ["Rock", "Pop"],
      statement: "Gitar, telli düzenlemeler ve aranje tarafında hızlı teslim odaklı çalışırım.",
      links: ["https://bandcamp.com/"],
      status: "pending",
    },
    {
      id: "mock-producer-5",
      userId: "mock-user-5",
      slug: buildProducerSlug("Nilay Demir", "mock-producer-5"),
      displayName: "Nilay Demir",
      city: "Antalya",
      areas: ["Beste & söz yazımı", "Aranje", "Müzik prodüksiyonu"],
      workTypes: ["Baştan sona prodüksiyon", "Var olan projeye katkı"],
      modes: ["Online"],
      genres: ["Pop", "Folk / Türk halk müziği"],
      statement: "Şarkı fikrini üretip prodüksiyon sürecine kadar eşlik ederim.",
      links: ["https://www.instagram.com/"],
      status: "approved",
    },
    {
      id: "mock-producer-6",
      userId: "mock-user-6",
      slug: buildProducerSlug("Kerem Aydın", "mock-producer-6"),
      displayName: "Kerem Aydın",
      city: "Eskişehir",
      areas: ["Üflemeli enstrüman yazımı", "Yaylı enstrüman yazımı", "Aranje"],
      workTypes: ["Var olan projeye katkı", "Revizyon / edit"],
      modes: ["Online", "Müşteri stüdyosunda"],
      genres: ["Jazz", "Classical"],
      statement: "Orkestrasyon ve düzenleme tarafında temiz partisyonlar oluştururum.",
      links: ["https://drive.google.com/"],
      status: "pending",
    },
    {
      id: "mock-producer-7",
      userId: "mock-user-7",
      slug: buildProducerSlug("Deniz Sönmez", "mock-producer-7"),
      displayName: "Deniz Sönmez",
      city: "Kocaeli",
      areas: ["DJ edit / set hazırlama", "Sound design", "Mixing"],
      workTypes: ["Revizyon / edit", "Var olan projeye katkı"],
      modes: ["Online"],
      genres: ["Electronic", "Hip-hop / Rap"],
      statement: "Edit ve sound design tarafında hızlı revizyon ve net teslim sunarım.",
      links: ["https://www.youtube.com/"],
      status: "approved",
    },
    {
      id: "mock-producer-8",
      userId: "mock-user-8",
      slug: buildProducerSlug("Cansu Aksoy", "mock-producer-8"),
      displayName: "Cansu Aksoy",
      city: "Adana",
      areas: ["Bas yazımı", "Beat yapımı", "Mixing"],
      workTypes: ["Şarkıya parça yazma", "Revizyon / edit"],
      modes: ["Online", "Kendi stüdyomda"],
      genres: ["Hip-hop / Rap", "Pop"],
      statement: "Beat yazımı ve miks tarafında net, punchy sonuçlara odaklanırım.",
      links: ["https://soundcloud.com/"],
      status: "approved",
    },
  ];
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
      select: { id: true, email: true, fullName: true, name: true, city: true, image: true },
    })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const ordered = [
    ...latest.filter((app) => app.status === "approved"),
    ...latest.filter((app) => app.status !== "approved"),
  ];

  const fromDb = ordered.map((app) => mapApplicationToProfile(app, userMap.get(app.userId)));
  if (fromDb.length === 0) {
    return buildMockProducers();
  }
  if (fromDb.length < 5) {
    const mock = buildMockProducers();
    return [...fromDb, ...mock.slice(0, 5 - fromDb.length)];
  }
  return fromDb;
}

export async function getProducerBySlug(slug?: string | null): Promise<ProducerProfile | null> {
  if (!slug) return null;
  const list = await getProducerListings();
  const direct = list.find((producer) => producer.slug === slug);
  if (direct) return direct;

  const baseSlug = slug.replace(/-\d+$/, "");
  const baseMatch = list.find((producer) => producer.slug.replace(/-\d+$/, "") === baseSlug);
  if (baseMatch) return baseMatch;

  const appId = parseProducerApplicationIdFromSlug(slug);
  if (!appId) return null;
  const app = await prisma.producerApplication.findUnique({ where: { id: appId } });
  if (!app || (app.status !== "approved" && app.status !== "pending")) return null;
  const user = await prisma.user.findUnique({
    where: { id: app.userId },
    select: { id: true, email: true, fullName: true, name: true, city: true, image: true },
  });
  if (user) {
    return mapApplicationToProfile(app, user);
  }

  const candidates = await prisma.producerApplication.findMany({
    where: { status: { in: ["approved", "pending"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const candidateUserIds = Array.from(new Set(candidates.map((row) => row.userId)));
  const candidateUsers = candidateUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: candidateUserIds } },
        select: { id: true, email: true, fullName: true, name: true, city: true, image: true },
      })
    : [];
  const candidateMap = new Map(candidateUsers.map((row) => [row.id, row]));
  const matched = candidates.find((row) => {
    const display =
      candidateMap.get(row.userId)?.fullName ||
      candidateMap.get(row.userId)?.name ||
      candidateMap.get(row.userId)?.email ||
      "Üretici";
    return slugify(display) === baseSlug;
  });
  if (!matched) return null;
  return mapApplicationToProfile(matched, candidateMap.get(matched.userId));
}
