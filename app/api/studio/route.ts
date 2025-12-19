import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PricingModel,
  type Room as PrismaRoom,
  type Slot as PrismaSlot,
  type Studio as PrismaStudio,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
} from "@prisma/client";
import type { Equipment, Extras, Features, OpeningHours } from "@/types/panel";
import { z } from "zod";

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
  hasDrumCowbell: false,
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
  alsoTypes: [],
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

const contactMethodOptions = ["Phone", "WhatsApp", "Email"] as const;
const roomTypeOptions = ["Prova odası", "Kayıt odası", "Vokal kabini", "Kontrol odası", "Prodüksiyon odası"] as const;
const bookingModes = ["Onaylı talep (ben onaylarım)", "Direkt rezervasyon (sonra açılabilir)"] as const;
const priceRanges = ["500–750", "750–1000", "1000–1500", "1500+"] as const;
const urlOptional = z.string().trim().optional().or(z.literal(""));

const applicationSchema = z.object({
  studioName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^(?:90)?5\d{9}$/.test(v), "Telefon formatı hatalı"),
  city: z.string().trim().min(2),
  district: z.string().trim().min(1),
  neighborhood: z.string().trim().min(1),
  address: z.string().trim().min(10),
  mapsUrl: z.string().trim().url("Geçerli link"),
  contactMethods: z.array(z.enum(contactMethodOptions)).min(1),
  contactHours: z.string().trim().max(80).optional().or(z.literal("")),
  roomsCount: z.number().int().min(1).max(10),
  roomTypes: z.array(z.enum(roomTypeOptions)).min(1),
  bookingMode: z.enum(bookingModes),
  equipment: z.object({
    drum: z.boolean(),
    guitarAmp: z.boolean(),
    bassAmp: z.boolean(),
    pa: z.boolean(),
    mic: z.boolean(),
  }),
  equipmentHighlight: z.string().trim().max(200).optional().or(z.literal("")),
  priceRange: z.enum(priceRanges),
  priceVaries: z.boolean(),
  linkPortfolio: urlOptional,
  linkGoogle: urlOptional,
});

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
          defaultEquipment,
        features:
          (room.featuresJson as Features | null | undefined) ??
          defaultFeatures,
        extras: {
          ...defaultExtras,
          ...((room.extrasJson as Extras | null | undefined) ?? {}),
        },
        images:
          (room.imagesJson as string[] | null | undefined) ??
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const name = session.user.name;

  await prisma.user.upsert({
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
    return NextResponse.json({ ok: false, error: "Studio not found" }, { status: 404 });
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
      name?: string;
      city?: string;
      district?: string;
      address?: string;
      phone?: string;
      openingHours?: OpeningHours[];
    };
    application?: z.infer<typeof applicationSchema>;
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

  const studioUpdateData: Prisma.StudioUpdateInput = {};

  if (body.studio) {
    const { name, city, district, address, phone, openingHours } = body.studio;
    if (name !== undefined) studioUpdateData.name = name;
    if (city !== undefined) studioUpdateData.city = city;
    if (district !== undefined) studioUpdateData.district = district;
    if (address !== undefined) studioUpdateData.address = address;
    if (phone !== undefined) studioUpdateData.phone = phone;
    if (openingHours !== undefined) {
      studioUpdateData.openingHours = (openingHours ?? studio.openingHours ?? defaultOpeningHours) as Prisma.InputJsonValue;
    }
  }

  if (body.application) {
    const parsed = applicationSchema.safeParse(body.application);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }
    const data = parsed.data;
    const fullAddress = `${data.neighborhood} - ${data.address}`.trim();
    studioUpdateData.name = data.studioName;
    studioUpdateData.city = data.city;
    studioUpdateData.district = data.district;
    studioUpdateData.address = fullAddress;
    studioUpdateData.phone = data.phone;

    const prefixes = [
      "İletişim tercihleri:",
      "Booking modu:",
      "Oda sayısı:",
      "Ekipman sinyali:",
      "Öne çıkan ekipman:",
      "Instagram/Web:",
      "Google Business:",
      "Maps:",
      "İletişim saatleri:",
      "Fiyat aralığı:",
      "Manuel inceleme:",
    ];

    await prisma.notification.deleteMany({
      where: {
        studioId: studio.id,
        OR: prefixes.map((prefix) => ({ message: { startsWith: prefix } })),
      },
    });

    const equipmentSignal =
      Object.entries(data.equipment)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ") || "Belirtilmedi";

    const needsManualReview = !data.linkPortfolio && !data.linkGoogle;

    const notificationsToCreate = [
      { message: `İletişim tercihleri: ${data.contactMethods.join(", ")}` },
      { message: `Booking modu: ${data.bookingMode}` },
      { message: `Oda sayısı: ${data.roomsCount}, tipler: ${data.roomTypes.join(", ")}` },
      { message: `Ekipman sinyali: ${equipmentSignal}` },
      data.equipmentHighlight ? { message: `Öne çıkan ekipman: ${data.equipmentHighlight}` } : undefined,
      data.linkPortfolio ? { message: `Instagram/Web: ${data.linkPortfolio}` } : undefined,
      data.linkGoogle ? { message: `Google Business: ${data.linkGoogle}` } : undefined,
      data.mapsUrl ? { message: `Maps: ${data.mapsUrl}` } : undefined,
      data.contactHours ? { message: `İletişim saatleri: ${data.contactHours}` } : undefined,
      { message: `Fiyat aralığı: ${data.priceRange}${data.priceVaries ? " (odaya göre değişir)" : ""}` },
      needsManualReview ? { message: "Manuel inceleme: evet (doğrulama linki yok)" } : undefined,
    ].filter(Boolean) as { message: string }[];

    if (notificationsToCreate.length) {
      await prisma.notification.createMany({
        data: notificationsToCreate.map((item) => ({
          studioId: studio.id,
          message: item.message,
        })),
      });
    }
  }

  if (Object.keys(studioUpdateData).length > 0) {
    await prisma.studio.update({
      where: { id: studio.id },
      data: studioUpdateData,
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
