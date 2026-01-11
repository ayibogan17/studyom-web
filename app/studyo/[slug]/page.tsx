import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/geo";
import { parseStudioIdFromSlug } from "@/lib/studio-slug";
import { isBlockingBlock, isWithinOpeningHours, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import type { Equipment, Extras, Features } from "@/types/panel";
import { StudioRoomDetails } from "./room-details-client";
import { StudioGalleryCarousel } from "./gallery-carousel";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
};

const roomTypeLabels: Record<string, string> = {
  "prova-odasi": "Prova odası",
  "vokal-kabini": "Vokal kabini",
  "kayit-kabini": "Kayıt kabini",
  "davul-kabini": "Davul kabini",
  "etut-odasi": "Etüt odası",
  "kontrol-odasi": "Kontrol odası",
  "produksiyon-odasi": "Prodüksiyon odası",
};

const normalizeRoomType = (value: string) => {
  const slug = slugify(value);
  return roomTypeLabels[slug] ?? value;
};

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value && typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as T;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const extractImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((img) => typeof img === "string") as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((img) => typeof img === "string") as string[];
      }
    } catch {
      return [value];
    }
    return [value];
  }
  if (value && typeof value === "object" && "url" in value) {
    const maybeUrl = (value as { url?: unknown }).url;
    if (typeof maybeUrl === "string") return [maybeUrl];
  }
  return [];
};

const buildRoomHighlights = (equipment: Partial<Equipment>, features: Partial<Features>, extras: Partial<Extras>) => {
  const highlights: string[] = [];
  if (equipment.hasDrum) highlights.push("Davul");
  if (equipment.guitarAmpCount) highlights.push(`Gitar amfi x${equipment.guitarAmpCount}`);
  if (equipment.hasBassAmp) highlights.push("Bas amfisi");
  if (equipment.micCount) highlights.push(`Mikrofon x${equipment.micCount}`);
  if (equipment.hasKeyboard) highlights.push("Klavye");
  if (equipment.hasDiBox) highlights.push("DI Box");
  if (equipment.hasTwinPedal) highlights.push("Twin pedal");
  if (features.recordingEngineerIncluded) highlights.push("Kayıt teknisyeni");
  if (features.hasControlRoom) highlights.push("Control room");
  if (features.musicianMicAllowed) highlights.push("Kendi mikrofonunu getirebilir");
  if (features.providesLiveAutotune) highlights.push("Canlı autotune");
  if (features.rawTrackIncluded) highlights.push("RAW kayıt dahil");
  if (extras.acceptsCourses) highlights.push("Kurslara açık");
  return highlights;
};

const formatPricing = (room: {
  pricingModel: string | null;
  flatRate: string | null;
  minRate: string | null;
  dailyRate: string | null;
  hourlyRate: string | null;
}) => {
  const parts = [
    room.hourlyRate ? `Saatlik ${room.hourlyRate}` : null,
    room.dailyRate ? `Günlük ${room.dailyRate}` : null,
    room.flatRate ? `Paket ${room.flatRate}` : null,
    room.minRate ? `Minimum ${room.minRate}` : null,
  ].filter(Boolean);
  if (!parts.length) return "Fiyat bilgisi eklenmemiş.";
  return parts.join(" · ");
};

const studioSelect = {
  id: true,
  name: true,
  city: true,
  district: true,
  address: true,
  isActive: true,
  ownerEmail: true,
  phone: true,
  coverImageUrl: true,
  openingHours: true,
  calendarSettings: {
    select: {
      dayCutoffHour: true,
      weeklyHours: true,
      happyHourEnabled: true,
      bookingApprovalMode: true,
      bookingCutoffUnit: true,
      bookingCutoffValue: true,
    },
  },
  notifications: {
    select: { message: true },
  },
  rooms: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      pricingModel: true,
      flatRate: true,
      minRate: true,
      dailyRate: true,
      hourlyRate: true,
      happyHourRate: true,
      equipmentJson: true,
      featuresJson: true,
      extrasJson: true,
      imagesJson: true,
    },
  },
} as const;

async function getStudioBySlug(slug: string) {
  const bySlug = await prisma.studio.findUnique({
    where: { slug },
    select: studioSelect,
  });
  if (bySlug) return bySlug;

  const id = parseStudioIdFromSlug(slug);
  if (!id) return null;
  return prisma.studio.findUnique({
    where: { id },
    select: studioSelect,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) {
    return { title: "Stüdyo bulunamadı | Studyom" };
  }
  const city = studio.city ? ` · ${studio.city}` : "";
  return {
    title: `${studio.name}${city} | Studyom`,
    description: `${studio.name} stüdyo detayları ve oda bilgileri.`,
  };
}

export default async function StudioDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const search = searchParams ? await searchParams : undefined;
  const studio = await getStudioBySlug(slug);
  if (!studio) notFound();

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email?.toLowerCase();
  if (!studio.isActive && userEmail !== studio.ownerEmail.toLowerCase()) {
    notFound();
  }

  const dateParam =
    typeof search?.date === "string" ? search.date : Array.isArray(search?.date) ? search.date[0] : null;
  const timeParam =
    typeof search?.time === "string" ? search.time : Array.isArray(search?.time) ? search.time[0] : null;
  const durationParam =
    typeof search?.duration === "string"
      ? search.duration
      : Array.isArray(search?.duration)
        ? search.duration[0]
        : null;
  const durationMinutes = durationParam ? Number.parseInt(durationParam, 10) : 60;

  let availability: { date: string; time: string; duration: number; statusByRoomId: Record<string, boolean> } | null =
    null;

  const pad = (value: number) => value.toString().padStart(2, "0");
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 14);
  const rangeStartKey = `${rangeStart.getFullYear()}-${pad(rangeStart.getMonth() + 1)}-${pad(rangeStart.getDate())}`;
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;
  const openingHours = normalizeOpeningHours(
    (studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );

  const roomCalendarBlocks = await prisma.studioCalendarBlock.findMany({
    where: {
      studioId: studio.id,
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
    },
    select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
  });

  const calendarBlocksByRoom = new Map<
    string,
    Array<{ startAt: string; endAt: string; type?: string | null; status?: string | null }>
  >();
  roomCalendarBlocks.forEach((block) => {
    const list = calendarBlocksByRoom.get(block.roomId) ?? [];
    list.push({
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
      type: block.type,
      status: block.status ?? null,
    });
    calendarBlocksByRoom.set(block.roomId, list);
  });

  const happyHourEnabled = studio.calendarSettings?.happyHourEnabled ?? false;
  const happyHourSlots = happyHourEnabled
    ? await prisma.studioHappyHourSlot.findMany({
        where: { studioId: studio.id },
        select: { roomId: true, startAt: true, endAt: true },
        orderBy: { startAt: "asc" },
      })
    : [];

  const happyHoursByRoom = new Map<string, Array<{ startAt: string; endAt: string }>>();
  if (happyHourEnabled && happyHourSlots.length) {
    const templateMap = new Map<
      string,
      Array<{ weekday: number; startMinutes: number; endMinutes: number }>
    >();
    happyHourSlots.forEach((slot) => {
      const businessStart = new Date(slot.startAt);
      if (businessStart.getHours() < dayCutoffHour) {
        businessStart.setDate(businessStart.getDate() - 1);
      }
      businessStart.setHours(0, 0, 0, 0);
      const weekday = weekdayIndex(businessStart);
      const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
      let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
      if (endMinutes <= startMinutes) endMinutes += 24 * 60;
      const list = templateMap.get(slot.roomId) ?? [];
      const existing = list.find(
        (tpl) => tpl.weekday === weekday && tpl.startMinutes === startMinutes,
      );
      if (!existing || endMinutes > existing.endMinutes) {
        const next = list.filter(
          (tpl) => !(tpl.weekday === weekday && tpl.startMinutes === startMinutes),
        );
        next.push({ weekday, startMinutes, endMinutes });
        templateMap.set(slot.roomId, next);
      } else {
        templateMap.set(slot.roomId, list);
      }
    });

    const maxDisplayDate = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 13);
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    for (let d = new Date(cursor); d <= maxDisplayDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayWeekday = weekdayIndex(dayStart);
      templateMap.forEach((templates, roomId) => {
        templates.forEach((tpl) => {
          if (tpl.weekday !== dayWeekday) return;
          const slotStart = addMinutes(dayStart, tpl.startMinutes);
          const slotEnd = addMinutes(dayStart, tpl.endMinutes);
          const list = happyHoursByRoom.get(roomId) ?? [];
          list.push({ startAt: slotStart.toISOString(), endAt: slotEnd.toISOString() });
          happyHoursByRoom.set(roomId, list);
        });
      });
    }
  }

  if (dateParam && timeParam) {
    const startAt = new Date(`${dateParam}T${timeParam}:00+03:00`);
    if (!Number.isNaN(startAt.getTime())) {
      const minutes = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 60;
      const endAt = new Date(startAt.getTime() + minutes * 60000);
      const cutoff = studio.calendarSettings?.dayCutoffHour ?? 4;
      const withinHours = isWithinOpeningHours(startAt, endAt, openingHours, cutoff);
      const roomIds = studio.rooms.map((room) => room.id);
      let blockedRoomIds = new Set<string>();
      if (withinHours && roomIds.length) {
        const blocks = await prisma.studioCalendarBlock.findMany({
          where: {
            roomId: { in: roomIds },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { roomId: true, type: true, status: true },
        });
        blockedRoomIds = new Set(blocks.filter(isBlockingBlock).map((block) => block.roomId));
      }
      availability = {
        date: dateParam,
        time: timeParam,
        duration: minutes,
        statusByRoomId: Object.fromEntries(
          roomIds.map((roomId) => [roomId, withinHours && !blockedRoomIds.has(roomId)]),
        ),
      };
    }
  }

  const formatPriceBadge = (room: {
    pricingModel: string | null;
    flatRate: string | null;
    minRate: string | null;
    dailyRate: string | null;
    hourlyRate: string | null;
  }) => {
    const withCurrency = (val?: string | null) => {
      if (!val) return "";
      return val.includes("₺") ? val : `₺${val}`;
    };
    if (room.hourlyRate) return `${withCurrency(room.hourlyRate)}/saat`;
    if (room.dailyRate) return `${withCurrency(room.dailyRate)}/gün`;
    if (room.flatRate) return withCurrency(room.flatRate);
    if (room.minRate) return `${withCurrency(room.minRate)}+`;
    return "Fiyat yok";
  };

  const roomsForClient = studio.rooms.map((room, index) => {
    const equipment = parseJson<Partial<Equipment>>(room.equipmentJson, {});
    const features = parseJson<Partial<Features>>(room.featuresJson, {});
    const extras = parseJson<Partial<Extras>>(room.extrasJson, {});
    return {
      id: room.id,
      name: room.name?.trim() ? room.name : `Oda ${index + 1}`,
      typeLabel: normalizeRoomType(room.type),
      priceBadge: formatPriceBadge(room),
      priceLabel: formatPricing(room),
      highlights: buildRoomHighlights(equipment, features, extras),
      pricing: {
        model: room.pricingModel,
        flatRate: room.flatRate,
        minRate: room.minRate,
        dailyRate: room.dailyRate,
        hourlyRate: room.hourlyRate,
        happyHourRate: room.happyHourRate,
      },
      equipment,
      features,
      extras,
      images: extractImages(room.imagesJson),
      calendar: {
        startDate: rangeStartKey,
        dayCutoffHour,
        openingHours,
        blocks: calendarBlocksByRoom.get(room.id) ?? [],
        happyHours: happyHoursByRoom.get(room.id) ?? [],
      },
    };
  });

  const roomNameById = new Map(roomsForClient.map((room) => [room.id, room.name]));
  const roomGalleryItems = studio.rooms.flatMap((room, index) => {
    const label =
      (roomNameById.get(room.id) ?? room.name?.trim()) || `Oda ${index + 1}`;
    return extractImages(room.imagesJson).map((src) => ({ src, roomName: label }));
  });
  const galleryItems =
    roomGalleryItems.length > 0
      ? roomGalleryItems
      : studio.coverImageUrl
        ? [{ src: studio.coverImageUrl, roomName: "Stüdyo kapak" }]
        : [];

  const mapsUrl = studio.notifications
    ?.map((note) => note.message || "")
    .find((msg) => msg.startsWith("Maps:"))
    ?.replace("Maps:", "")
    .trim();

  const parseCoords = (url: string) => {
    const d = url.match(/!3d([+-]?\d+\.\d+)!4d([+-]?\d+\.\d+)/);
    if (d) return { lat: parseFloat(d[1]), lng: parseFloat(d[2]) };
    const q = url.match(/[?&]q=([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
    if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
    const at = url.match(/@([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
    const generic = url.match(/([+-]?\d+\.\d+)[ ,]+([+-]?\d+\.\d+)/);
    if (generic) return { lat: parseFloat(generic[1]), lng: parseFloat(generic[2]) };
    return null;
  };

  const buildMapEmbedSrc = (url?: string | null) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) return null;
    } catch {
      return null;
    }
    const coords = parseCoords(url);
    if (coords) {
      return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`;
    }
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}output=embed`;
  };

  const resolveMapEmbedSrc = async (url?: string | null) => {
    if (!url) return null;
    const direct = buildMapEmbedSrc(url);
    if (direct && !direct.includes("maps.app.goo.gl")) return direct;
    const allowedHosts = [
      "maps.app.goo.gl",
      "goo.gl",
      "goo.gl/maps",
      "maps.google.com",
      "www.google.com",
      "maps.googleusercontent.com",
    ];
    try {
      const parsed = new URL(url);
      if (!allowedHosts.some((host) => parsed.hostname.includes(host))) return direct;
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "studyom-bot/1.0 (+https://studyom.net)",
          "Accept-Language": "tr,en;q=0.8",
        },
      });
      const finalUrl = res.url || url;
      const coords = parseCoords(finalUrl);
      if (coords) {
        return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&output=embed`;
      }
    } catch {
      return direct;
    }
    return direct;
  };

  const mapEmbedSrc = await resolveMapEmbedSrc(mapsUrl);
  const mapHeightClass = "h-52 sm:h-56 md:h-[260px] lg:h-[280px]";

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section>
        <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-5xl font-semibold text-[var(--color-primary)]">{studio.name}</h1>
              <div className="text-sm text-[var(--color-muted)]">
                {[studio.city, studio.district].filter(Boolean).join(" • ") || "Konum belirtilmemiş"}
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {galleryItems.length ? (
                <Card className="relative flex-1 overflow-hidden p-0">
                  <div className={`${mapHeightClass} w-full`}>
                    <StudioGalleryCarousel items={galleryItems} />
                  </div>
                </Card>
              ) : (
                <Card className="flex-1 p-4">
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Henüz görsel eklenmemiş.</p>
                </Card>
              )}
              {mapEmbedSrc ? (
                <div className="w-full md:ml-auto md:w-[40%]">
                  <Card className="overflow-hidden p-0">
                    <div className={`${mapHeightClass} w-full`}>
                      <iframe
                        title="Stüdyo konumu"
                        src={mapEmbedSrc}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </Card>
                </div>
              ) : null}
            </div>

            <StudioRoomDetails
              rooms={roomsForClient}
              availability={availability}
              studioId={studio.id}
              studioName={studio.name}
              studioSlug={slug}
              studioPhone={studio.phone}
              bookingApprovalMode={(studio.calendarSettings?.bookingApprovalMode ?? "manual") as "manual" | "auto"}
              bookingCutoffUnit={(studio.calendarSettings?.bookingCutoffUnit ?? "hours") as "hours" | "days"}
              bookingCutoffValue={studio.calendarSettings?.bookingCutoffValue ?? 24}
            />
        </div>
      </Section>
    </main>
  );
}
