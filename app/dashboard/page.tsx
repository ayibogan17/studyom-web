import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import {
  Prisma,
  PricingModel,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
  type Room as PrismaRoom,
  type Slot as PrismaSlot,
  type Studio as PrismaStudio,
  UserRole,
} from "@prisma/client";
import type { Equipment, Extras, Features, OpeningHours } from "@/types/panel";

import { DashboardClient } from "./dashboard-client";

const defaultEquipment: Equipment = {
  hasDrum: false,
  drumDetail: "",
  micCount: 0,
  micDetails: [] as string[],
  guitarAmpCount: 0,
  guitarAmpDetails: [] as string[],
  hasBassAmp: false,
  bassDetail: "",
  hasDiBox: false,
  diDetail: "",
  hasPedal: false,
  pedalDetail: "",
  hasKeyboard: false,
  keyboardDetail: "",
  hasKeyboardStand: false,
  hasGuitarsForUse: false,
  guitarUseDetail: "",
};

const defaultFeatures: Features = {
  micCount: 0,
  micDetails: [] as string[],
  musicianMicAllowed: false,
  hasControlRoom: false,
  hasHeadphones: false,
  headphonesDetail: "",
  hasTechSupport: false,
};

const defaultExtras: Extras = {
  offersMixMaster: false,
  engineerPortfolioUrl: "",
  offersProduction: false,
  productionAreas: [] as string[],
  offersOther: false,
  otherDetail: "",
  acceptsCourses: false,
  alsoTypes: [],
};

const defaultOpeningHours: OpeningHours[] = Array.from({ length: 7 }, () => ({
  open: true,
  openTime: "09:00",
  closeTime: "21:00",
}));

const pricingFromDb = (model: PricingModel): "flat" | "daily" | "hourly" | "variable" => {
  switch (model) {
    case PricingModel.DAILY:
      return "daily";
    case PricingModel.HOURLY:
      return "hourly";
    case PricingModel.VARIABLE:
      return "variable";
    case PricingModel.FLAT:
    default:
      return "flat";
  }
};

type StudioWithRelations = PrismaStudio & {
  openingHours?: Prisma.JsonValue | null;
  rooms: (PrismaRoom & {
    order?: number;
    equipmentJson?: Prisma.JsonValue | null;
    featuresJson?: Prisma.JsonValue | null;
    extrasJson?: Prisma.JsonValue | null;
    imagesJson?: Prisma.JsonValue | null;
    slots: PrismaSlot[];
  })[];
  notifications: PrismaNotification[];
  ratings: PrismaRating[];
};

function mapStudioToResponse(studio: StudioWithRelations) {
  const openingHoursRaw =
    studio.openingHours as OpeningHours[] | null | undefined;
  const openingHours =
    Array.isArray(openingHoursRaw) && openingHoursRaw.length === 7
      ? openingHoursRaw
      : defaultOpeningHours;

  return {
    id: studio.id,
    name: studio.name,
    city: studio.city ?? undefined,
    district: studio.district ?? undefined,
    address: studio.address ?? undefined,
    ownerEmail: studio.ownerEmail,
    phone: studio.phone ?? undefined,
    coverImageUrl: studio.coverImageUrl ?? undefined,
    openingHours,
    ratings: studio.ratings?.map((r) => r.value) ?? [],
    notifications: studio.notifications?.map((n) => n.message) ?? [],
    rooms:
      studio.rooms?.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        color: room.color ?? "#6C63FF",
        pricing: {
          model: pricingFromDb(room.pricingModel),
          flatRate: room.flatRate ?? undefined,
          minRate: room.minRate ?? undefined,
          dailyRate: room.dailyRate ?? undefined,
          hourlyRate: room.hourlyRate ?? undefined,
          happyHourRate: room.happyHourRate ?? undefined,
        },
        equipment: (room.equipmentJson as Equipment | null | undefined) ?? defaultEquipment,
        features: (room.featuresJson as Features | null | undefined) ?? defaultFeatures,
        extras: { ...defaultExtras, ...((room.extrasJson as Extras | null | undefined) ?? {}) },
        images: (room.imagesJson as string[] | null | undefined) ?? [],
        slots: room.slots?.reduce<Record<string, { timeLabel: string; status: "empty" | "confirmed"; name?: string }[]>>(
          (acc, slot) => {
            const key = slot.date.toISOString().slice(0, 10);
            acc[key] = acc[key] || [];
            acc[key].push({
              timeLabel: slot.timeLabel,
              status: slot.status === "CONFIRMED" ? "confirmed" : "empty",
              name: slot.customerName ?? undefined,
            });
            return acc;
          },
          {},
        ) ?? {},
      })) ?? [],
  };
}

async function loadStudio(email: string, name?: string | null) {
  await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined, role: "STUDIO" },
    create: { email, name: name ?? undefined, role: "STUDIO" },
  });

  const studio = (await prisma.studio.findFirst({
    where: { ownerEmail: email },
    include: {
      rooms: { include: { slots: true } },
      notifications: true,
      ratings: true,
    },
  })) as StudioWithRelations | null;

  if (!studio) {
    return null;
  }

  return mapStudioToResponse(studio);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const search = await searchParams;

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  const sessionRole =
    (session.user as { role?: string }).role === "STUDIO" ? UserRole.STUDIO : UserRole.USER;
  const isStudioHint =
    (typeof search?.as === "string" && search?.as === "studio") ||
    (Array.isArray(search?.as) && search?.as.includes("studio"));

  // Kullanıcı ve stüdyo var mı?
  const [existingUser, existingStudio] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.studio.findFirst({ where: { ownerEmail: session.user.email } }),
  ]);

  // Öncelik: query param -> mevcut stüdyo kaydı -> mevcut kullanıcı rolü -> oturum rolü
  const desiredRole = isStudioHint
    ? UserRole.STUDIO
    : existingStudio
      ? UserRole.STUDIO
      : existingUser?.role
        ? existingUser.role
        : sessionRole;

  // Kullanıcı kaydını oluştur/çek
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined, role: desiredRole },
    create: {
      email: session.user.email,
      name: session.user.name ?? undefined,
      role: desiredRole,
    },
  });

  if (user.role !== UserRole.STUDIO) {
    redirect("/profile");
  }

  const initialStudio = await loadStudio(user.email, user.name);
  if (!initialStudio) {
    redirect("/studio/new");
  }

  const studioTeacherLinks = await prisma.teacherStudioLink.findMany({
    where: { studioId: initialStudio.id, status: "approved" },
    include: {
      teacherUser: { select: { id: true, email: true, fullName: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const teacherUserIds = studioTeacherLinks.map((link) => link.teacherUserId);
  const teacherApps = teacherUserIds.length
    ? await prisma.teacherApplication.findMany({
        where: { userId: { in: teacherUserIds }, status: "approved" },
        orderBy: { createdAt: "desc" },
        select: { id: true, userId: true },
      })
    : [];
  const appByUser = new Map<string, { id: number; userId: string }>();
  for (const app of teacherApps) {
    if (!appByUser.has(app.userId)) {
      appByUser.set(app.userId, app);
    }
  }
  const linkedTeachers = studioTeacherLinks
    .map((link) => {
      const app = appByUser.get(link.teacherUserId);
      if (!app) return null;
      const displayName =
        link.teacherUser.fullName || link.teacherUser.name || link.teacherUser.email || "Hoca";
      return {
        id: link.id,
        name: displayName,
        email: link.teacherUser.email,
        image: link.teacherUser.image,
        slug: `${slugify(displayName)}-${app.id}`,
      };
    })
    .filter((item): item is { id: string; name: string; email: string; image: string | null; slug: string } =>
      Boolean(item),
    );

  const studioProducerLinks = await prisma.producerStudioLink.findMany({
    where: { studioId: initialStudio.id, status: "approved" },
    include: {
      producerUser: { select: { id: true, email: true, fullName: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const producerUserIds = studioProducerLinks.map((link) => link.producerUserId);
  const producerApps = producerUserIds.length
    ? await prisma.producerApplication.findMany({
        where: { userId: { in: producerUserIds }, status: "approved" },
        orderBy: { createdAt: "desc" },
        select: { id: true, userId: true },
      })
    : [];
  const producerAppByUser = new Map<string, { id: number; userId: string }>();
  for (const app of producerApps) {
    if (!producerAppByUser.has(app.userId)) {
      producerAppByUser.set(app.userId, app);
    }
  }
  const linkedProducers = studioProducerLinks
    .map((link) => {
      const app = producerAppByUser.get(link.producerUserId);
      if (!app) return null;
      const displayName =
        link.producerUser.fullName || link.producerUser.name || link.producerUser.email || "Üretici";
      return {
        id: link.id,
        name: displayName,
        email: link.producerUser.email,
        image: link.producerUser.image,
        slug: `${slugify(displayName)}-${app.id}`,
      };
    })
    .filter((item): item is { id: string; name: string; email: string; image: string | null; slug: string } =>
      Boolean(item),
    );

  return (
    <DashboardClient
      initialStudio={initialStudio}
      userName={user.name}
      userEmail={user.email}
      emailVerified={Boolean(user.emailVerified)}
      linkedTeachers={linkedTeachers}
      linkedProducers={linkedProducers}
    />
  );
}
