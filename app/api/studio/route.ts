import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockStudio } from "@/data/panelMock";
import {
  PricingModel,
  SlotStatus,
  type Room as PrismaRoom,
  type Slot as PrismaSlot,
  type Studio as PrismaStudio,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
} from "@prisma/client";

const statusToDb = (s: "empty" | "confirmed") =>
  s === "confirmed" ? SlotStatus.CONFIRMED : SlotStatus.EMPTY;

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
  rooms: (PrismaRoom & { slots: PrismaSlot[] })[];
  notifications: PrismaNotification[];
  ratings: PrismaRating[];
};

function mapStudioToResponse(studio: StudioWithRelations) {
  return {
    id: studio.id,
    name: studio.name,
    city: studio.city,
    district: studio.district,
    address: studio.address,
    ownerEmail: studio.ownerEmail,
    phone: studio.phone,
    ratings: studio.ratings?.map((r) => r.value) ?? [],
    notifications: studio.notifications?.map((n) => n.message) ?? [],
    rooms:
      studio.rooms?.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        color: room.color,
        pricing: {
          model: room.pricingModel.toLowerCase(),
          flatRate: room.flatRate ?? undefined,
          minRate: room.minRate ?? undefined,
          dailyRate: room.dailyRate ?? undefined,
          hourlyRate: room.hourlyRate ?? undefined,
        },
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
      notifications: {
        create: mockStudio.notifications.map((message) => ({ message })),
      },
      ratings: {
        create: mockStudio.ratings.map((value) => ({ value })),
      },
      rooms: {
        create: mockStudio.rooms.map((room) => ({
          name: room.name,
          type: room.type,
          color: room.color,
          pricingModel: pricingToDb(room.pricing.model),
          flatRate: room.pricing.flatRate,
          minRate: room.pricing.minRate,
          dailyRate: room.pricing.dailyRate,
          hourlyRate: room.pricing.hourlyRate,
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
      rooms: { include: { slots: true } },
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
    pricing?: {
      model?: string;
      flatRate?: string;
      minRate?: string;
      dailyRate?: string;
      hourlyRate?: string;
    };
  };

  type Body = {
    studio?: {
      city?: string;
      district?: string;
      address?: string;
      phone?: string;
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
    const { city, district, address, phone } = body.studio;
    await prisma.studio.update({
      where: { id: studio.id },
      data: { city, district, address, phone },
    });
  }

  if (body.rooms?.length) {
    for (const roomUpdate of body.rooms) {
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
        },
      });
    }
  }

  const updated = (await prisma.studio.findUnique({
    where: { id: studio.id },
    include: {
      rooms: { include: { slots: true } },
      notifications: true,
      ratings: true,
    },
  })) as StudioWithRelations | null;

  return NextResponse.json({
    ok: true,
    studio: updated ? mapStudioToResponse(updated) : null,
  });
}
