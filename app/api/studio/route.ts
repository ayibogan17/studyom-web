import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockStudio } from "@/data/panelMock";
import {
  Prisma,
  PricingModel,
  SlotStatus,
  type Room as PrismaRoom,
  type Slot as PrismaSlot,
  type Studio as PrismaStudio,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
} from "@prisma/client";
import type { Equipment, Extras, Features, OpeningHours } from "@/types/panel";

const statusToDb = (s: "empty" | "confirmed") =>
  s === "confirmed" ? SlotStatus.CONFIRMED : SlotStatus.EMPTY;

const defaultEquipment: Equipment = {
  hasDrum: false,
  drumDetail: "",
  hasDrumKick: false,
  drumKickDetail: "",
  hasDrumSnare: false,
  drumSnareDetail: "",
  hasDrumToms: false,
  drumTomsDetail: "",
  hasDrumFloorTom: false,
  drumFloorTomDetail: "",
  hasDrumHihat: false,
  drumHihatDetail: "",
  hasDrumRide: false,
  drumRideDetail: "",
  hasDrumCrash1: false,
  drumCrash1Detail: "",
  hasDrumCrash2: false,
  drumCrash2Detail: "",
  hasDrumCrash3: false,
  drumCrash3Detail: "",
  hasDrumCrash4: false,
  drumCrash4Detail: "",
  hasDrumChina: false,
  drumChinaDetail: "",
  hasDrumSplash: false,
  drumSplashDetail: "",
  hasTwinPedal: false,
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
  dawList: [],
  recordingEngineerIncluded: false,
  providesLiveAutotune: false,
  rawTrackIncluded: false,
  editServiceLevel: "none",
  mixServiceLevel: "none",
  productionServiceLevel: "none",
};

const defaultExtras: Extras = {
  offersMixMaster: false,
  engineerPortfolioUrl: "",
  offersProduction: false,
  productionAreas: [] as string[],
  offersOther: false,
  otherDetail: "",
  acceptsCourses: false,
  vocalHasEngineer: false,
  vocalLiveAutotune: false,
  vocalRawIncluded: false,
  vocalEditService: "none",
  vocalMixService: "none",
  vocalProductionService: "none",
  drumProRecording: "none",
  drumVideo: "none",
  drumProduction: "none",
  drumMix: "none",
  practiceDescription: "",
  recordingMixService: "none",
  recordingProduction: "none",
  recordingProductionAreas: [],
};

const defaultOpeningHours: OpeningHours[] = Array.from({ length: 7 }, () => ({
  open: true,
  openTime: "09:00",
  closeTime: "21:00",
}));

const pricingToDb = (model: string): PricingModel => {
  switch (model) {
    case "daily":
      return PricingModel.DAILY;
    case "hourly":
      return PricingModel.HOURLY;
    case "variable":
      return PricingModel.VARIABLE;
    case "flat":
    default:
      return PricingModel.FLAT;
  }
};

function normalizeDateKey(key: string) {
  // Treat as midnight UTC to avoid TZ drift
  return new Date(`${key}T00:00:00.000Z`);
}

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
  const openingHours =
    (studio.openingHours as OpeningHours[] | null | undefined) ??
    mockStudio.openingHours ??
    defaultOpeningHours;

  return {
    id: studio.id,
    name: studio.name,
    city: studio.city ?? undefined,
    district: studio.district ?? undefined,
    address: studio.address ?? undefined,
    ownerEmail: studio.ownerEmail,
    phone: studio.phone ?? undefined,
    openingHours,
    ratings: studio.ratings?.map((r) => r.value) ?? [],
    notifications: studio.notifications?.map((n) => n.message) ?? [],
    rooms:
      studio.rooms
        ?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.getTime() - b.createdAt.getTime())
        .map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        color: room.color ?? "#6C63FF",
        order: room.order ?? 0,
        pricing: {
          model: room.pricingModel.toLowerCase(),
          flatRate: room.flatRate ?? undefined,
          minRate: room.minRate ?? undefined,
          dailyRate: room.dailyRate ?? undefined,
          hourlyRate: room.hourlyRate ?? undefined,
        },
        equipment:
          (room.equipmentJson as Equipment | null | undefined) ??
          mockStudio.rooms.find((r) => r.name === room.name)?.equipment ??
          defaultEquipment,
        features:
          (room.featuresJson as Features | null | undefined) ??
          mockStudio.rooms.find((r) => r.name === room.name)?.features ??
          defaultFeatures,
        extras:
          (room.extrasJson as Extras | null | undefined) ??
          mockStudio.rooms.find((r) => r.name === room.name)?.extras ??
          defaultExtras,
        images:
          (room.imagesJson as string[] | null | undefined) ??
          mockStudio.rooms.find((r) => r.name === room.name)?.images ??
          [],
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

async function seedFromMock(email: string, name?: string | null) {
  await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined, role: "STUDIO" },
    create: { email, name: name ?? undefined, role: "STUDIO" },
  });

  const created = await prisma.studio.create({
    data: {
      name: mockStudio.name,
      city: mockStudio.city,
      district: mockStudio.district,
      address: mockStudio.address,
      phone: mockStudio.phone,
      ownerEmail: email,
      openingHours: (mockStudio.openingHours ?? defaultOpeningHours) as Prisma.InputJsonValue,
      notifications: {
        create: mockStudio.notifications.map((message) => ({ message })),
      },
      ratings: {
        create: mockStudio.ratings.map((value) => ({ value })),
      },
      rooms: {
        create: mockStudio.rooms.map((room, idx) => ({
          name: room.name,
          type: room.type,
          color: room.color,
          order: idx,
          pricingModel: pricingToDb(room.pricing.model),
          flatRate: room.pricing.flatRate,
          minRate: room.pricing.minRate,
          dailyRate: room.pricing.dailyRate,
          hourlyRate: room.pricing.hourlyRate,
          equipmentJson: room.equipment,
          featuresJson: room.features,
          extrasJson: room.extras,
          imagesJson: room.images,
          slots: {
            create: Object.entries(room.slots).flatMap(([key, slots]) =>
              slots.map((slot) => ({
                date: normalizeDateKey(key),
                timeLabel: slot.timeLabel,
                status: statusToDb(slot.status),
                customerName: slot.name ?? undefined,
              })),
            ),
          },
        })),
      },
    },
    include: {
      rooms: { include: { slots: true } },
      notifications: true,
      ratings: true,
    },
  });

  return created;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const name = session.user.name;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined, role: "STUDIO" },
    create: { email, name: name ?? undefined, role: "STUDIO" },
  });

  let studio = (await prisma.studio.findFirst({
    where: { ownerEmail: email },
    include: {
      rooms: { include: { slots: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      notifications: true,
      ratings: true,
    },
  })) as StudioWithRelations | null;

  if (!studio) {
    studio = (await seedFromMock(email, user.name)) as StudioWithRelations;
  }

  return NextResponse.json({
    ok: true,
    studio: mapStudioToResponse(studio),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type UpdateRoomPayload = {
    id: string;
    name?: string;
    type?: string;
    color?: string;
    order?: number;
    _delete?: boolean;
    pricing?: {
      model?: string;
      flatRate?: string;
      minRate?: string;
      dailyRate?: string;
      hourlyRate?: string;
    };
    equipment?: Equipment;
    features?: Features;
    extras?: Extras;
    images?: string[];
  };

  type Body = {
    studio?: {
      city?: string;
      district?: string;
      address?: string;
      phone?: string;
      openingHours?: OpeningHours[];
    };
    rooms?: UpdateRoomPayload[];
  };

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: session.user.email },
  });

  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 });
  }

  if (body.studio) {
    const { city, district, address, phone, openingHours } = body.studio;
    await prisma.studio.update({
      where: { id: studio.id },
      data: {
        city,
        district,
        address,
        phone,
        openingHours: (openingHours ?? studio.openingHours ?? defaultOpeningHours) as Prisma.InputJsonValue,
      },
    });
  }

  if (body.rooms?.length) {
    const maxOrder = await prisma.room.aggregate({
      _max: { order: true },
      where: { studioId: studio.id },
    });
    let nextOrder = (maxOrder._max.order ?? 0) + 1;
    for (const roomUpdate of body.rooms) {
      if (roomUpdate._delete && roomUpdate.id) {
        await prisma.room.delete({ where: { id: roomUpdate.id, studioId: studio.id } });
        continue;
      }
      if (!roomUpdate.id) {
        await prisma.room.create({
          data: {
            name: roomUpdate.name || `Yeni Oda ${Date.now() % 1000}`,
            type: roomUpdate.type || "Prova odası",
            color: roomUpdate.color || "#6C63FF",
            order: roomUpdate.order ?? nextOrder++,
            pricingModel: roomUpdate.pricing?.model
              ? pricingToDb(roomUpdate.pricing.model)
              : PricingModel.FLAT,
            flatRate: roomUpdate.pricing?.flatRate,
            minRate: roomUpdate.pricing?.minRate,
            dailyRate: roomUpdate.pricing?.dailyRate,
            hourlyRate: roomUpdate.pricing?.hourlyRate,
            equipmentJson: roomUpdate.equipment ?? defaultEquipment,
            featuresJson: roomUpdate.features ?? defaultFeatures,
            extrasJson: roomUpdate.extras ?? defaultExtras,
            imagesJson: roomUpdate.images ?? [],
            studioId: studio.id,
          },
        });
        continue;
      }
      const room = await prisma.room.findFirst({
        where: { id: roomUpdate.id, studioId: studio.id },
      });
      if (!room) continue;
      await prisma.room.update({
        where: { id: roomUpdate.id },
        data: {
          name: roomUpdate.name ?? room.name,
          type: roomUpdate.type ?? room.type,
          color: roomUpdate.color ?? room.color,
          pricingModel: roomUpdate.pricing?.model
            ? pricingToDb(roomUpdate.pricing.model)
            : room.pricingModel,
          flatRate: roomUpdate.pricing?.flatRate ?? room.flatRate,
          minRate: roomUpdate.pricing?.minRate ?? room.minRate,
          dailyRate: roomUpdate.pricing?.dailyRate ?? room.dailyRate,
          hourlyRate: roomUpdate.pricing?.hourlyRate ?? room.hourlyRate,
          order: roomUpdate.order ?? room.order,
          equipmentJson: roomUpdate.equipment ?? room.equipmentJson ?? defaultEquipment,
          featuresJson: roomUpdate.features ?? room.featuresJson ?? defaultFeatures,
          extrasJson: roomUpdate.extras ?? room.extrasJson ?? defaultExtras,
          imagesJson: roomUpdate.images ?? room.imagesJson ?? [],
        },
      });
    }
  }

  const updated = (await prisma.studio.findUnique({
    where: { id: studio.id },
    include: {
      rooms: { include: { slots: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      notifications: true,
      ratings: true,
    },
  })) as StudioWithRelations | null;

  return NextResponse.json({
    ok: true,
    studio: updated ? mapStudioToResponse(updated) : null,
  });
}
