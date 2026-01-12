import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import { mergeRoles, normalizeRoles } from "@/lib/roles";
import {
  Prisma,
  PricingModel,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
  type Room as PrismaRoom,
  type Studio as PrismaStudio,
  UserRole,
} from "@prisma/client";
import type { Equipment, Extras, Features, OpeningHours } from "@/types/panel";

import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Stüdyo Dashboard | Studyom",
  robots: { index: false, follow: false },
};

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
  })[];
  notifications: PrismaNotification[];
  ratings: PrismaRating[];
};

type ReservationRequest = {
  id: string;
  roomId: string;
  roomName: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  requesterImage: string | null;
  requesterIsAnon: boolean;
  note: string | null;
  startAt: string;
  endAt: string;
  hours: number;
  totalPrice: number | null;
  status: string;
  studioUnread: boolean;
  createdAt: string;
  updatedAt: string;
  calendarBlockId: string | null;
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
        slots: {},
      })) ?? [],
  };
}

async function loadStudio(email: string) {
  const ownerEmail = email.toLowerCase();
  const studio = (await prisma.studio.findFirst({
    where: { ownerEmail: { equals: ownerEmail, mode: "insensitive" } },
    include: {
      rooms: true,
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
  const tabParam =
    typeof search?.tab === "string"
      ? search.tab
      : Array.isArray(search?.tab)
        ? search.tab[0]
        : null;

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  const ownerEmail = session.user.email.toLowerCase();
  const sessionRole =
    (session.user as { role?: string }).role === "STUDIO" ? UserRole.STUDIO : UserRole.USER;
  const isStudioHint =
    (typeof search?.as === "string" && search?.as === "studio") ||
    (Array.isArray(search?.as) && search?.as.includes("studio"));

  // Kullanıcı ve stüdyo var mı?
  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  const existingStudio = await prisma.studio.findFirst({
    where: { ownerEmail: { equals: ownerEmail, mode: "insensitive" } },
    select: { id: true },
  });

  // Öncelik: query param -> mevcut stüdyo kaydı -> mevcut kullanıcı rolü -> oturum rolü
  const desiredRole = isStudioHint
    ? UserRole.STUDIO
    : existingStudio
      ? UserRole.STUDIO
      : existingUser?.role
        ? existingUser.role
        : sessionRole;

  // Kullanıcı kaydını oluştur/çek
  const baseRoles = normalizeRoles(existingUser);
  const nextRoles =
    desiredRole === UserRole.STUDIO ? mergeRoles(baseRoles, ["studio_owner"]) : baseRoles.length ? baseRoles : ["musician"];
  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: session.user.name ?? undefined,
      role: desiredRole,
      roles: { set: nextRoles },
    },
    create: {
      email: ownerEmail,
      name: session.user.name ?? undefined,
      role: desiredRole,
      roles: desiredRole === UserRole.STUDIO ? ["musician", "studio_owner"] : ["musician"],
    },
  });

  if (user.role !== UserRole.STUDIO) {
    redirect("/profile");
  }

  if (!existingStudio) {
    redirect("/studio/new");
  }

  const reservationRequests: ReservationRequest[] = [];
  const bookingApprovalMode = "manual";
  const linkedTeachers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];
  const linkedProducers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];

  return (
    <DashboardClient
      initialStudio={undefined}
      reservationRequests={reservationRequests}
      bookingApprovalMode={bookingApprovalMode}
      initialTab={tabParam}
      userName={user.name}
      userEmail={user.email}
      emailVerified={Boolean(user.emailVerified)}
      linkedTeachers={linkedTeachers}
      linkedProducers={linkedProducers}
    />
  );
}
