import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { mockStudio } from "@/data/panelMock";
import { prisma } from "@/lib/prisma";
import {
  PricingModel,
  SlotStatus,
  type Notification as PrismaNotification,
  type Rating as PrismaRating,
  type Room as PrismaRoom,
  type Slot as PrismaSlot,
  type Studio as PrismaStudio,
  UserRole,
} from "@prisma/client";
import type { Equipment, Extras, Features, OpeningHours } from "@/types/panel";

import { DashboardClient } from "./dashboard-client";

const statusToDb = (s: "empty" | "confirmed") =>
  s === "confirmed" ? SlotStatus.CONFIRMED : SlotStatus.EMPTY;

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
};

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

function normalizeDateKey(key: string) {
  // Treat as midnight UTC to avoid TZ drift
  return new Date(`${key}T00:00:00.000Z`);
}

function UserDashboardMock({ name, email }: { name?: string | null; email?: string | null }) {
  const suggested = mockStudio.rooms.slice(0, 2).map((r, idx) => ({
    name: `${mockStudio.name} • ${r.name}`,
    district: mockStudio.district ?? "Kadıköy",
    price: r.pricing.flatRate || r.pricing.hourlyRate || "350",
    tag: idx === 0 ? "Öne çıkan" : "Yakınında",
    color: r.color,
  }));

  const upcoming = [
    {
      title: "Prova • Oda 1",
      date: "Cumartesi, 18:00 - 20:00",
      place: mockStudio.name,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Kullanıcı paneli (demo)
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş geldin{ name ? `, ${name}` : ""}!
          </h1>
          {email && <p className="text-sm text-gray-600">Giriş yaptığın e-posta: {email}</p>}
        </header>

        <section className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Yaklaşan rezervasyon</h2>
              <span className="text-xs font-semibold text-blue-700">Demo</span>
            </div>
            {upcoming.map((item, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                <p className="text-sm font-semibold text-blue-900">{item.title}</p>
                <p className="text-sm text-blue-800">{item.date}</p>
                <p className="text-xs text-blue-700">{item.place}</p>
              </div>
            ))}
            <Link
              href="/studios"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Başka stüdyo ara
            </Link>
          </div>

          <div className="space-y-4 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sana önerilenler</h2>
              <span className="text-xs font-semibold text-gray-500">Mok veri</span>
            </div>
            <div className="space-y-3">
              {suggested.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-600">
                      {s.district} • Saatlik {s.price}₺
                    </p>
                    <span className="text-[11px] font-semibold text-blue-700">{s.tag}</span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-full border"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
            <Link
              href="/#lead-form"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              İhtiyacımı yazmak istiyorum
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

type StudioWithRelations = PrismaStudio & {
  rooms: (PrismaRoom & { slots: PrismaSlot[] })[];
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

async function loadStudio(email: string, name?: string | null) {
  await prisma.user.upsert({
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
    studio = (await seedFromMock(email, name)) as StudioWithRelations;
  }

  return mapStudioToResponse(studio);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  const sessionRole =
    (session.user as any).role === "STUDIO" ? UserRole.STUDIO : UserRole.USER;
  const isStudioHint =
    (typeof searchParams?.as === "string" && searchParams?.as === "studio") ||
    (Array.isArray(searchParams?.as) && searchParams?.as.includes("studio"));

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

  // User rolü ise mock kullanıcı paneli göster
  if (user.role !== UserRole.STUDIO) {
    return <UserDashboardMock name={user.name} email={user.email} />;
  }

  const initialStudio = await loadStudio(user.email, user.name);

  return (
    <DashboardClient initialStudio={initialStudio} userName={user.name} userEmail={user.email} />
  );
}
