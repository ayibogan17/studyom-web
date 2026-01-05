"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Card } from "@/components/design-system/components/ui/card";
import { slugify } from "@/lib/geo";
import { StudioGalleryCarousel } from "./gallery-carousel";

type RoomDetail = {
  id: string;
  name: string;
  typeLabel: string;
  priceBadge: string;
  priceLabel: string;
  highlights: string[];
  images: string[];
  calendar?: RoomCalendarSummary | null;
  pricing: {
    model?: string | null;
    flatRate?: string | null;
    minRate?: string | null;
    dailyRate?: string | null;
    hourlyRate?: string | null;
    happyHourRate?: string | null;
  };
  equipment: {
    hasDrum?: boolean;
    drumDetail?: string;
    hasDrumKick?: boolean;
    drumKickDetail?: string;
    hasDrumSnare?: boolean;
    drumSnareDetail?: string;
    hasDrumToms?: boolean;
    drumTomsDetail?: string;
    hasDrumFloorTom?: boolean;
    drumFloorTomDetail?: string;
    hasDrumHihat?: boolean;
    drumHihatDetail?: string;
    hasDrumRide?: boolean;
    drumRideDetail?: string;
    hasDrumCrash1?: boolean;
    drumCrash1Detail?: string;
    hasDrumCrash2?: boolean;
    drumCrash2Detail?: string;
    hasDrumCrash3?: boolean;
    drumCrash3Detail?: string;
    hasDrumCrash4?: boolean;
    drumCrash4Detail?: string;
    hasDrumChina?: boolean;
    drumChinaDetail?: string;
    hasDrumSplash?: boolean;
    drumSplashDetail?: string;
    hasDrumCowbell?: boolean;
    drumCowbellDetail?: string;
    hasTwinPedal?: boolean;
    twinPedalDetail?: string;
    micCount?: number;
    micDetails?: string[];
    guitarAmpCount?: number;
    guitarAmpDetails?: string[];
    hasBassAmp?: boolean;
    bassDetail?: string;
    hasDiBox?: boolean;
    diDetail?: string;
    hasPedal?: boolean;
    pedalDetail?: string;
    hasKeyboard?: boolean;
    keyboardDetail?: string;
    hasKeyboardStand?: boolean;
    hasGuitarsForUse?: boolean;
    guitarUseDetail?: string;
  };
  features: {
    micCount?: number;
    micDetails?: string[];
    musicianMicAllowed?: boolean;
    hasControlRoom?: boolean;
    hasHeadphones?: boolean;
    headphonesDetail?: string;
    hasTechSupport?: boolean;
    dawList?: string[];
    recordingEngineerIncluded?: boolean;
    providesLiveAutotune?: boolean;
    rawTrackIncluded?: boolean;
    editServiceLevel?: "none" | "included" | "extra";
    mixServiceLevel?: "none" | "included" | "extra";
    productionServiceLevel?: "none" | "included" | "extra";
  };
  extras: {
    offersMixMaster?: boolean;
    engineerPortfolioUrl?: string;
    offersProduction?: boolean;
    productionAreas?: string[];
    offersOther?: boolean;
    otherDetail?: string;
    acceptsCourses?: boolean;
    alsoTypes?: string[];
    vocalHasEngineer?: boolean;
    vocalLiveAutotune?: boolean;
    vocalRawIncluded?: boolean;
    vocalEditService?: "none" | "included" | "extra";
    vocalMixService?: "none" | "included" | "extra";
    vocalProductionService?: "none" | "included" | "extra";
    drumProRecording?: "none" | "included" | "extra";
    drumVideo?: "none" | "included" | "extra";
    drumProduction?: "none" | "extra";
    drumMix?: "none" | "extra";
    practiceDescription?: string;
    recordingMixService?: "none" | "extra";
    recordingProduction?: "none" | "extra";
    recordingProductionAreas?: string[];
  };
};

type AvailabilityInfo = {
  date: string;
  time: string;
  duration: number;
  statusByRoomId: Record<string, boolean>;
};

type Props = {
  rooms: RoomDetail[];
  availability?: AvailabilityInfo | null;
  contactHref?: string;
};

const formatBadge = (text: string) => (text ? text : "Fiyat yok");
const formatPriceValue = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("₺") ? trimmed : `₺${trimmed}`;
};
const formatText = (value?: string | null) => (value && value.trim() ? value.trim() : "—");
const formatArray = (value?: string[] | null) => (value && value.length ? value.join(", ") : "—");
const formatBoolean = (value?: boolean) => (value ? "Evet" : "Hayır");
const formatCount = (value?: number) => (Number.isFinite(value) ? String(value) : "0");
const formatService = (value?: "none" | "included" | "extra") => {
  if (value === "included") return "Dahil";
  if (value === "extra") return "Ekstra";
  if (value === "none") return "Yok";
  return "—";
};

type DetailRow = {
  label: string;
  value: string;
  show?: boolean;
};

type RoomCalendarSummary = {
  startDate: string;
  dayCutoffHour: number;
  openingHours: {
    open: boolean;
    openTime: string;
    closeTime: string;
  }[];
  blocks: Array<{
    startAt: string;
    endAt: string;
    type?: string | null;
    status?: string | null;
  }>;
  happyHours?: Array<{
    startAt: string;
    endAt: string;
  }>;
};

const weekdaysShort = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const slotStepMinutes = 60;
const parseTimeToMinutes = (value: string) => {
  const [h, m] = value.split(":").map((v) => Number.parseInt(v, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
const formatTimeLabel = (minutes: number) => {
  const total = minutes % (24 * 60);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};
const parseDateKey = (value: string) => {
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
};
const splitPipeList = (value?: string | null) =>
  value
    ? value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;
const getOpenRange = (
  day: Date,
  openingHours: RoomCalendarSummary["openingHours"],
) => {
  const info = openingHours[weekdayIndex(day)];
  if (!info || !info.open) return null;
  const start = parseTimeToMinutes(info.openTime);
  const endRaw = parseTimeToMinutes(info.closeTime);
  if (start === null || endRaw === null) return { start: 0, end: 24 * 60 };
  let end = endRaw;
  if (end <= start) end += 24 * 60;
  return { start, end };
};
const isBlocking = (block: { type?: string | null; status?: string | null }) => {
  const type = (block.type ?? "").toLowerCase();
  if (type.includes("manual") || type.includes("manuel") || type.includes("blok") || type.includes("block")) {
    return true;
  }
  if (type !== "reservation" && type !== "rezervasyon") return false;
  const status = (block.status ?? "").toLowerCase();
  return status === "approved" || status === "onaylı" || status === "onayli";
};

function HappyHourIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 360" role="img" aria-label="Happy Hour" className={className}>
      <title>Happy Hour</title>
      <rect x="20" y="20" rx="48" ry="48" width="860" height="320" fill="none" stroke="currentColor" strokeWidth="18" />
      <rect x="48" y="48" rx="36" ry="36" width="804" height="264" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.25" />
      <path
        fill="currentColor"
        d="M120 160 L132 190 L166 194 L140 216 L148 250 L120 232 L92 250 L100 216 L74 194 L108 190 Z"
      />
      <path
        fill="currentColor"
        d="M780 160 L792 190 L826 194 L800 216 L808 250 L780 232 L752 250 L760 216 L734 194 L768 190 Z"
      />
      <text
        x="450"
        y="160"
        fontSize="96"
        fill="currentColor"
        fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
        textAnchor="middle"
      >
        HAPPY
      </text>
      <text
        x="450"
        y="260"
        fontSize="108"
        fill="currentColor"
        fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
        textAnchor="middle"
      >
        HOUR!
      </text>
    </svg>
  );
}

function RoomCalendarPreview({
  calendar,
  className,
}: {
  calendar?: RoomCalendarSummary | null;
  className?: string;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  if (!calendar) {
    return (
      <div
        className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 text-xs text-[var(--color-muted)] ${className ?? ""}`}
      >
        Takvim verisi yok.
      </div>
    );
  }

  const baseDate = parseDateKey(calendar.startDate);
  if (!baseDate) {
    return (
      <div
        className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 text-xs text-[var(--color-muted)] ${className ?? ""}`}
      >
        Takvim verisi okunamadı.
      </div>
    );
  }

  const maxDaysAhead = 13;
  const maxOffset = Math.floor(maxDaysAhead / 7);
  const maxDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + maxDaysAhead,
  );
  const safeOffset = Math.min(weekOffset, maxOffset);
  const weekStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + safeOffset * 7,
  );
  const days = Array.from({ length: 7 }).map(
    (_, idx) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + idx),
  );
  const ranges = days.map((day) => getOpenRange(day, calendar.openingHours));
  const starts = ranges.filter(Boolean).map((range) => range!.start);
  const ends = ranges.filter(Boolean).map((range) => range!.end);
  const globalStart = starts.length ? Math.min(...starts) : 10 * 60;
  const globalEnd = ends.length ? Math.max(...ends) : 22 * 60;
  const slots: number[] = [];
  for (let m = globalStart; m < globalEnd; m += slotStepMinutes) {
    slots.push(m);
  }
  const happyHours = calendar.happyHours ?? [];

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 overflow-hidden ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--color-primary)]">Haftalık Takvim</p>
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] disabled:opacity-40"
          >
            Önceki
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => Math.min(maxOffset, prev + 1))}
            disabled={weekOffset === maxOffset}
            className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      </div>
      <div className="mt-2 overflow-hidden">
        <div className="w-full">
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 text-[10px] font-semibold text-[var(--color-muted)]">
            <div />
            {days.map((day) => {
              const isOutOfRange = day.getTime() > maxDate.getTime();
              return (
                <div
                  key={day.toISOString()}
                  className={`py-1 text-center ${isOutOfRange ? "text-[var(--color-muted)]/50" : ""}`}
                >
                  {weekdaysShort[weekdayIndex(day)]} {day.getDate()}
                </div>
              );
            })}
          </div>
          <div className="mt-1 grid grid-cols-[48px_repeat(7,1fr)] gap-1 text-[10px]">
            {slots.map((slot) => (
              <div key={`slot-${slot}`} className="contents">
                <div className="flex items-center justify-end pr-1 text-[10px] text-[var(--color-muted)]">
                  {formatTimeLabel(slot)}
                </div>
                {days.map((day, idx) => {
                  const isOutOfRange = day.getTime() > maxDate.getTime();
                  if (isOutOfRange) {
                    return (
                      <div
                        key={`${day.toISOString()}-${slot}`}
                        className="flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] text-[var(--color-muted)]/50"
                      />
                    );
                  }
                  const range = ranges[idx];
                  const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                  slotStart.setMinutes(slotStart.getMinutes() + slot);
                  const slotEnd = new Date(slotStart.getTime() + slotStepMinutes * 60000);
                  const inOpenRange =
                    range && slot >= range.start && slot + slotStepMinutes <= range.end;
                  const isBlocked = inOpenRange
                    ? calendar.blocks.some((block) => {
                        if (!isBlocking(block)) return false;
                        const start = new Date(block.startAt);
                        const end = new Date(block.endAt);
                        return start < slotEnd && end > slotStart;
                      })
                    : false;
                  const isHappyHour =
                    inOpenRange &&
                    happyHours.some((slot) => {
                      const start = new Date(slot.startAt);
                      const end = new Date(slot.endAt);
                      return start < slotEnd && end > slotStart;
                    });
                  const label = inOpenRange ? (isBlocked ? "Dolu" : "Boş") : "";
                  const cellClass = inOpenRange
                    ? isBlocked
                      ? "bg-red-400/30 text-red-900"
                      : "bg-emerald-400/25 text-emerald-900"
                    : "bg-[var(--color-surface)] text-[var(--color-muted)]";
                  return (
                    <div
                      key={`${day.toISOString()}-${slot}`}
                      className={`flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[10px] ${cellClass}`}
                    >
                      {isHappyHour ? (
                        <HappyHourIcon className="h-12 w-12 text-amber-400" />
                      ) : (
                        label
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioRoomDetails({ rooms, availability, contactHref = "/iletisim" }: Props) {
  const defaultOpenRooms =
    rooms.length === 1 && rooms[0] ? { [rooms[0].id]: true } : {};
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>(defaultOpenRooms);
  const [openDrumEquipment, setOpenDrumEquipment] = useState<Record<string, boolean>>({});

  if (!rooms.length) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-[var(--color-muted)]">Henüz oda bilgisi eklenmemiş.</p>
      </Card>
    );
  }

  const hasAvailability = Boolean(availability?.date && availability?.time);

  return (
    <div className="grid w-full gap-4">
      {rooms.map((room) => {
        const isOpen = openRooms[room.id] ?? false;
        const isAvailable = hasAvailability
          ? availability?.statusByRoomId?.[room.id] ?? false
          : null;
        const hasHappyHour = (room.calendar?.happyHours?.length ?? 0) > 0;
        const happyHourRate = formatPriceValue(room.pricing?.happyHourRate);
        const happyHourLabel = happyHourRate
          ? happyHourRate.includes("/") || happyHourRate.includes("saat")
            ? happyHourRate
            : `${happyHourRate}/saat`
          : "";
        const roomTypeSlugs = new Set(
          [room.typeLabel, ...(room.extras.alsoTypes ?? [])]
            .filter(Boolean)
            .map((value) => slugify(value)),
        );
        const hasType = (label: string) => roomTypeSlugs.has(slugify(label));
        const isRehearsal = hasType("Prova odası");
        const isVocal = hasType("Vokal kabini");
        const isRecording = hasType("Kayıt kabini");
        const isDrum = hasType("Davul kabini");
        const isEtut = hasType("Etüt odası");
        const onlyEtut = isEtut && !isRehearsal && !isVocal && !isRecording && !isDrum;
        const showCourses = isRehearsal || isVocal || isDrum || isEtut;
        const onlyVocal = isVocal && !isRehearsal && !isRecording && !isDrum && !isEtut;
        const courseLabel = isEtut ? "Hocalara açık mısınız?" : "Kurslara açık mısınız?";
        const purposeLabels = Array.from(
          new Set([room.typeLabel, ...(room.extras.alsoTypes ?? [])].filter(Boolean)),
        );
        const guitarAmpDetails = room.equipment.guitarAmpDetails ?? [];
        const micDetails = room.equipment.micDetails ?? [];
        const guitarAmpCount = Number.isFinite(room.equipment.guitarAmpCount)
          ? Math.max(0, room.equipment.guitarAmpCount ?? 0)
          : 0;
        const micCount = Number.isFinite(room.equipment.micCount)
          ? Math.max(0, room.equipment.micCount ?? 0)
          : 0;
        const extraGuitars = splitPipeList(room.equipment.guitarUseDetail);
        const iconItems = (() => {
          if (onlyVocal) {
            const items: Array<{ src: string; label: string; detail?: string }> = [];
            const micTotal = micCount > 0 ? micCount : micDetails.length;
            if (micTotal > 0) {
              for (let i = 0; i < micTotal; i += 1) {
                const detail = micDetails[i]?.trim();
                items.push({ src: "/icons/mic.svg", label: "Mikrofon", detail });
              }
            }
            return items;
          }
          if (!isRehearsal && !isRecording) return [];
          const items: Array<{ src: string; label: string; detail?: string }> = [];
          if (room.equipment.hasDrum) {
            const detail = room.equipment.drumDetail?.trim();
            items.push({ src: "/icons/drumkit_stroked.svg", label: "Davul", detail });
          }
          const ampTotal = guitarAmpCount > 0 ? guitarAmpCount : guitarAmpDetails.length;
          if (ampTotal > 0) {
            for (let i = 0; i < ampTotal; i += 1) {
              const detail = guitarAmpDetails[i]?.trim();
              items.push({ src: "/icons/guitar_amp.svg", label: "Gitar amfisi", detail });
            }
          }
          if (room.equipment.hasBassAmp) {
            const detail = room.equipment.bassDetail?.trim();
            items.push({ src: "/icons/bass_amp.svg", label: "Bas amfisi", detail });
          }
          const micTotal = micCount > 0 ? micCount : micDetails.length;
          if (micTotal > 0) {
            for (let i = 0; i < micTotal; i += 1) {
              const detail = micDetails[i]?.trim();
              items.push({ src: "/icons/mic.svg", label: "Mikrofon", detail });
            }
          }
          if (room.equipment.hasKeyboard) {
            const detail = room.equipment.keyboardDetail?.trim();
            items.push({ src: "/icons/keyboard.svg", label: "Klavye", detail });
          } else if (room.equipment.hasKeyboardStand) {
            items.push({ src: "/icons/keyboard_stand.svg", label: "Klavye sehpası" });
          }
          if (extraGuitars.length > 0) {
            extraGuitars.forEach((detail) => {
              const trimmed = detail.trim();
              items.push({ src: "/icons/guitar.svg", label: "Gitar", detail: trimmed });
            });
          }
          return items;
        })();
        const drumLayoutItems = (() => {
          if (!isDrum) return [];
          const items: Array<{
            key: string;
            src: string;
            label: string;
            detail?: string;
            className: string;
          }> = [];
          if (room.equipment.hasDrumKick) {
            items.push({
              key: "kick",
              src: "/icons/kick.svg",
              label: "Kick",
              detail: room.equipment.drumKickDetail?.trim(),
              className: "left-1/2 top-[56%] h-20 w-20 -translate-x-1/2 z-[60]",
            });
          }
          if (room.equipment.hasDrumSnare) {
            items.push({
              key: "snare",
              src: "/icons/snare.svg",
              label: "Snare",
              detail: room.equipment.drumSnareDetail?.trim(),
              className: "left-[36%] top-[56%] h-16 w-16 z-[80]",
            });
          }
          if (room.equipment.hasDrumToms) {
            items.push({
              key: "toms",
              src: "/icons/toms.svg",
              label: "Tomlar",
              detail: room.equipment.drumTomsDetail?.trim(),
              className: "left-1/2 top-[29%] h-24 w-24 -translate-x-1/2 z-[40]",
            });
          }
          if (room.equipment.hasDrumFloorTom) {
            items.push({
              key: "floor-tom",
              src: "/icons/floor_tom.svg",
              label: "Floor tom",
              detail: room.equipment.drumFloorTomDetail?.trim(),
              className: "left-[63%] top-[56%] h-16 w-16 z-[35]",
            });
          }
          if (room.equipment.hasDrumHihat) {
            items.push({
              key: "hihat",
              src: "/icons/hihat.svg",
              label: "Hi-hat",
              detail: room.equipment.drumHihatDetail?.trim(),
              className: "left-[24%] top-[41%] h-16 w-16 z-[70]",
            });
          }
          if (room.equipment.hasDrumRide) {
            items.push({
              key: "ride",
              src: "/icons/ride.svg",
              label: "Ride",
              detail: room.equipment.drumRideDetail?.trim(),
              className: "left-[64%] top-[34%] h-16 w-16 z-[30]",
            });
          }
          if (room.equipment.hasDrumCrash1) {
            items.push({
              key: "crash-1",
              src: "/icons/crash.svg",
              label: "Crash 1",
              detail: room.equipment.drumCrash1Detail?.trim(),
              className: "left-[40%] top-[18%] h-[70px] w-[70px] z-[20]",
            });
          }
          if (room.equipment.hasDrumCrash2) {
            items.push({
              key: "crash-2",
              src: "/icons/crash.svg",
              label: "Crash 2",
              detail: room.equipment.drumCrash2Detail?.trim(),
              className: "left-[60%] top-[18%] h-[70px] w-[70px] z-[20]",
            });
          }
          if (room.equipment.hasDrumCrash3) {
            items.push({
              key: "crash-3",
              src: "/icons/crash.svg",
              label: "Crash 3",
              detail: room.equipment.drumCrash3Detail?.trim(),
              className: "left-[14%] top-[22%] h-[58px] w-[58px] z-[20]",
            });
          }
          if (room.equipment.hasDrumCrash4) {
            items.push({
              key: "crash-4",
              src: "/icons/crash.svg",
              label: "Crash 4",
              detail: room.equipment.drumCrash4Detail?.trim(),
              className: "left-[86%] top-[22%] h-[58px] w-[58px] z-[20]",
            });
          }
          if (room.equipment.hasDrumChina) {
            items.push({
              key: "china",
              src: "/icons/china.svg",
              label: "China",
              detail: room.equipment.drumChinaDetail?.trim(),
              className: "left-[79%] top-[52%] h-12 w-12 z-[10]",
            });
          }
          if (room.equipment.hasDrumSplash) {
            items.push({
              key: "splash",
              src: "/icons/splash.svg",
              label: "Splash",
              detail: room.equipment.drumSplashDetail?.trim(),
              className: "left-[34%] top-[26%] h-11 w-11 z-[15]",
            });
          }
          if (room.equipment.hasDrumCowbell) {
            items.push({
              key: "cowbell",
              src: "/icons/cowbell.svg",
              label: "Cowbell",
              detail: room.equipment.drumCowbellDetail?.trim(),
              className: "left-[50%] top-[45%] h-[18px] w-[18px] -translate-x-1/2 z-[50]",
            });
          }
          if (room.equipment.hasTwinPedal) {
            items.push({
              key: "twin-pedal",
              src: "/icons/twin_pedal.svg",
              label: "Twin pedal",
              detail: room.equipment.twinPedalDetail?.trim(),
              className: "left-[43%] top-[118%] h-24 w-24 -translate-x-1/2 -translate-y-full z-[90]",
            });
          }
          return items;
        })();
        const showDrumInline = isDrum && !isRehearsal;
        const showDrumCollapsible = isDrum && isRehearsal;
        const isDrumOpen = openDrumEquipment[room.id] ?? false;

        const equipmentRows: DetailRow[] = [
          { label: "Davul var mı?", value: formatBoolean(room.equipment.hasDrum), show: isRehearsal || isRecording },
          {
            label: "Davul detayı",
            value: formatText(room.equipment.drumDetail),
            show: (isRehearsal || isRecording) && Boolean(room.equipment.drumDetail?.trim()),
          },
          {
            label: "Mikrofon adedi",
            value: formatCount(room.equipment.micCount),
            show: isRehearsal || isRecording || isVocal,
          },
          {
            label: "Mikrofon detayları",
            value: formatArray(room.equipment.micDetails),
            show:
              (isRehearsal || isRecording || isVocal) && (room.equipment.micDetails?.length ?? 0) > 0,
          },
          {
            label: "Gitar amfi adedi",
            value: formatCount(room.equipment.guitarAmpCount),
            show: isRehearsal || isRecording,
          },
          {
            label: "Gitar amfi detayları",
            value: formatArray(room.equipment.guitarAmpDetails),
            show: (isRehearsal || isRecording) && (room.equipment.guitarAmpDetails?.length ?? 0) > 0,
          },
          {
            label: "Bas amfi",
            value: formatBoolean(room.equipment.hasBassAmp),
            show: isRehearsal || isRecording,
          },
          {
            label: "Bas amfi detayı",
            value: formatText(room.equipment.bassDetail),
            show: (isRehearsal || isRecording) && Boolean(room.equipment.bassDetail?.trim()),
          },
          { label: "DI Box", value: formatBoolean(room.equipment.hasDiBox), show: isRehearsal || isRecording },
          {
            label: "DI detayı",
            value: formatText(room.equipment.diDetail),
            show: (isRehearsal || isRecording) && Boolean(room.equipment.diDetail?.trim()),
          },
          { label: "Klavye", value: formatBoolean(room.equipment.hasKeyboard), show: isRehearsal || isRecording },
          {
            label: "Klavye detayı",
            value: formatText(room.equipment.keyboardDetail),
            show: (isRehearsal || isRecording) && Boolean(room.equipment.keyboardDetail?.trim()),
          },
          {
            label: "Klavye sehpası",
            value: formatBoolean(room.equipment.hasKeyboardStand),
            show: (isRehearsal || isRecording) && room.equipment.hasKeyboard === false,
          },
          {
            label: "Kullanıma hazır gitar",
            value: formatBoolean(room.equipment.hasGuitarsForUse),
            show: isRehearsal || isRecording,
          },
          {
            label: "Gitar detayı",
            value: formatText(room.equipment.guitarUseDetail),
            show: (isRehearsal || isRecording) && Boolean(room.equipment.guitarUseDetail?.trim()),
          },
          { label: "Kick", value: formatBoolean(room.equipment.hasDrumKick), show: isDrum },
          {
            label: "Kick detayı",
            value: formatText(room.equipment.drumKickDetail),
            show: isDrum && Boolean(room.equipment.drumKickDetail?.trim()),
          },
          { label: "Snare", value: formatBoolean(room.equipment.hasDrumSnare), show: isDrum },
          {
            label: "Snare detayı",
            value: formatText(room.equipment.drumSnareDetail),
            show: isDrum && Boolean(room.equipment.drumSnareDetail?.trim()),
          },
          { label: "Tomlar", value: formatBoolean(room.equipment.hasDrumToms), show: isDrum },
          {
            label: "Tom detayı",
            value: formatText(room.equipment.drumTomsDetail),
            show: isDrum && Boolean(room.equipment.drumTomsDetail?.trim()),
          },
          { label: "Floor tom", value: formatBoolean(room.equipment.hasDrumFloorTom), show: isDrum },
          {
            label: "Floor tom detayı",
            value: formatText(room.equipment.drumFloorTomDetail),
            show: isDrum && Boolean(room.equipment.drumFloorTomDetail?.trim()),
          },
          { label: "Hi-hat", value: formatBoolean(room.equipment.hasDrumHihat), show: isDrum },
          {
            label: "Hi-hat detayı",
            value: formatText(room.equipment.drumHihatDetail),
            show: isDrum && Boolean(room.equipment.drumHihatDetail?.trim()),
          },
          { label: "Ride", value: formatBoolean(room.equipment.hasDrumRide), show: isDrum },
          {
            label: "Ride detayı",
            value: formatText(room.equipment.drumRideDetail),
            show: isDrum && Boolean(room.equipment.drumRideDetail?.trim()),
          },
          { label: "Crash 1", value: formatBoolean(room.equipment.hasDrumCrash1), show: isDrum },
          {
            label: "Crash 1 detayı",
            value: formatText(room.equipment.drumCrash1Detail),
            show: isDrum && Boolean(room.equipment.drumCrash1Detail?.trim()),
          },
          { label: "Crash 2", value: formatBoolean(room.equipment.hasDrumCrash2), show: isDrum },
          {
            label: "Crash 2 detayı",
            value: formatText(room.equipment.drumCrash2Detail),
            show: isDrum && Boolean(room.equipment.drumCrash2Detail?.trim()),
          },
          { label: "Crash 3", value: formatBoolean(room.equipment.hasDrumCrash3), show: isDrum },
          {
            label: "Crash 3 detayı",
            value: formatText(room.equipment.drumCrash3Detail),
            show: isDrum && Boolean(room.equipment.drumCrash3Detail?.trim()),
          },
          { label: "Crash 4", value: formatBoolean(room.equipment.hasDrumCrash4), show: isDrum },
          {
            label: "Crash 4 detayı",
            value: formatText(room.equipment.drumCrash4Detail),
            show: isDrum && Boolean(room.equipment.drumCrash4Detail?.trim()),
          },
          { label: "China", value: formatBoolean(room.equipment.hasDrumChina), show: isDrum },
          {
            label: "China detayı",
            value: formatText(room.equipment.drumChinaDetail),
            show: isDrum && Boolean(room.equipment.drumChinaDetail?.trim()),
          },
          { label: "Splash", value: formatBoolean(room.equipment.hasDrumSplash), show: isDrum },
          {
            label: "Splash detayı",
            value: formatText(room.equipment.drumSplashDetail),
            show: isDrum && Boolean(room.equipment.drumSplashDetail?.trim()),
          },
          { label: "Cowbell", value: formatBoolean(room.equipment.hasDrumCowbell), show: isDrum },
          {
            label: "Cowbell detayı",
            value: formatText(room.equipment.drumCowbellDetail),
            show: isDrum && Boolean(room.equipment.drumCowbellDetail?.trim()),
          },
          { label: "Twin pedal", value: formatBoolean(room.equipment.hasTwinPedal), show: isDrum },
          {
            label: "Twin pedal detayı",
            value: formatText(room.equipment.twinPedalDetail),
            show: isDrum && Boolean(room.equipment.twinPedalDetail?.trim()),
          },
        ];

        const infoRows: DetailRow[] = [
          {
            label: "Kendi mikrofonunu getirebilir",
            value: formatBoolean(room.features.musicianMicAllowed),
            show: isVocal,
          },
          { label: "DAW listesi", value: formatArray(room.features.dawList), show: isRecording },
          {
            label: "Kayıt teknisyeni",
            value: formatBoolean(room.features.recordingEngineerIncluded),
            show: isRecording,
          },
          { label: "Control room", value: formatBoolean(room.features.hasControlRoom), show: isRecording },
        ];

        const extrasRows: DetailRow[] = [
          {
            label: "Kayıt teknisyeni var mı?",
            value: formatBoolean(room.extras.vocalHasEngineer),
            show: isVocal,
          },
          {
            label: "Canlı autotune",
            value: formatBoolean(room.extras.vocalLiveAutotune),
            show: isVocal,
          },
          {
            label: "RAW kayıt dahil",
            value: formatBoolean(room.extras.vocalRawIncluded),
            show: isVocal,
          },
          { label: "Edit hizmeti", value: formatService(room.extras.vocalEditService), show: isVocal },
          { label: "Mix/Mastering", value: formatService(room.extras.vocalMixService), show: isVocal },
          { label: "Prodüksiyon hizmeti", value: formatService(room.extras.vocalProductionService), show: isVocal },
          { label: "Profesyonel davul kaydı", value: formatService(room.extras.drumProRecording), show: isDrum },
          { label: "Video çekimi", value: formatService(room.extras.drumVideo), show: isDrum },
          { label: "Davul prodüksiyonu", value: formatService(room.extras.drumProduction), show: isDrum },
          { label: "Davul mix/mastering", value: formatService(room.extras.drumMix), show: isDrum },
          { label: "Edit/Mix/Mastering", value: formatService(room.extras.recordingMixService), show: isRecording },
          { label: "Prodüksiyon hizmeti", value: formatService(room.extras.recordingProduction), show: isRecording },
          {
            label: "Prodüksiyon alanları",
            value: formatArray(room.extras.recordingProductionAreas),
            show: isRecording && (room.extras.recordingProductionAreas?.length ?? 0) > 0,
          },
          {
            label: "Etüt odası bilgileri",
            value: formatText(room.extras.practiceDescription),
            show: isEtut && !onlyEtut,
          },
        ];

        const visibleEquipmentRows = equipmentRows.filter((row) => row.show);
        const visibleInfoRows = infoRows.filter((row) => row.show);
        const visibleExtrasRows = extrasRows.filter(
          (row) => row.show && !["yok", "none", "hayır", "no"].includes(row.value.toLowerCase()),
        );

        return (
          <Card key={room.id} className="space-y-4 p-5">
            <button
              type="button"
              onClick={() => setOpenRooms((prev) => ({ ...prev, [room.id]: !isOpen }))}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--color-primary)]">
                  <span>{room.name}</span>
                  {hasHappyHour ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      <HappyHourIcon className="h-3.5 w-3.5" />
                      Happy Hour
                    </span>
                  ) : null}
                  {purposeLabels.length ? (
                    <span className="text-xs font-medium text-[var(--color-muted)]">
                      · {purposeLabels.join(" / ")}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {happyHourLabel ? (
                  <span className="text-xs font-semibold text-amber-400">{happyHourLabel}</span>
                ) : null}
                <span className="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  {formatBadge(room.priceBadge)}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-[var(--color-muted)] transition ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </div>
            </button>
            {isOpen && (
              <>
                <div className="grid items-stretch gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
                    {onlyEtut ? (
                      <div className="flex h-full w-full flex-col justify-center gap-2 text-xs text-[var(--color-muted)]">
                        <p className="text-xs font-semibold text-[var(--color-primary)]">Oda açıklaması</p>
                        <p className="whitespace-pre-line">{formatText(room.extras.practiceDescription)}</p>
                      </div>
                    ) : showDrumInline ? (
                      <div className="relative h-72 w-full">
                        {drumLayoutItems.length ? (
                          drumLayoutItems.map((item) => {
                            const detailText = item.detail?.trim();
                            return (
                              <div
                                key={item.key}
                                className={`group absolute flex flex-col items-center text-[10px] text-[var(--color-muted)] ${item.className}`}
                              >
                                <div
                                  className="relative flex items-center justify-center"
                                  title={detailText || undefined}
                                >
                                  <img
                                    src={item.src}
                                    alt={item.label}
                                    className="h-full w-full origin-center scale-[2] object-contain"
                                    loading="lazy"
                                  />
                                  {detailText ? (
                                    <span className="pointer-events-none absolute bottom-1 left-1/2 z-[9999] w-max max-w-[140px] -translate-x-1/2 rounded-md bg-black px-2 py-1 text-center text-[9px] leading-tight text-white opacity-0 transition group-hover:opacity-100">
                                      {detailText}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-[var(--color-muted)]">
                            Davul ekipmanı bilgisi eklenmemiş.
                          </p>
                        )}
                      </div>
                    ) : iconItems.length ? (
                      <div className="grid max-h-full w-full grid-cols-3 items-center justify-items-center gap-3 overflow-y-auto pr-1">
                        {iconItems.map((item, index) => {
                          const detailText = item.detail?.trim();
                          return (
                            <div
                              key={`${item.label}-${index}`}
                              className="group flex flex-col items-center gap-1 text-[10px] text-[var(--color-muted)]"
                            >
                              <div className="relative flex items-center justify-center">
                                <img
                                  src={item.src}
                                  alt={item.label}
                                  className="h-20 w-auto max-w-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <span>{item.label}</span>
                              {detailText ? (
                                <span className="max-w-[120px] text-center text-[9px] leading-tight text-[var(--color-muted)]">
                                  {detailText}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-muted)]">
                        Prova ekipmanı bilgisi eklenmemiş.
                      </p>
                    )}
                  </div>
                  <RoomCalendarPreview calendar={room.calendar} />
                </div>
                {showDrumCollapsible ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDrumEquipment((prev) => ({ ...prev, [room.id]: !isDrumOpen }))
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-[var(--color-primary)]"
                      aria-expanded={isDrumOpen}
                    >
                      <span>Davul ekipmanı</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--color-muted)] transition ${isDrumOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {isDrumOpen ? (
                      <div className="border-t border-[var(--color-border)] p-4">
                        <div className="relative h-72 w-full">
                          <div className="relative h-full w-full origin-center" style={{ transform: "scale(0.8)" }}>
                            {drumLayoutItems.length ? (
                              drumLayoutItems.map((item) => {
                                const detailText = item.detail?.trim();
                                return (
                                  <div
                                    key={item.key}
                                    className={`group absolute flex flex-col items-center text-[10px] text-[var(--color-muted)] ${item.className}`}
                                  >
                                    <div
                                      className="relative flex items-center justify-center"
                                      title={detailText || undefined}
                                    >
                                      <img
                                        src={item.src}
                                        alt={item.label}
                                        className="h-full w-full origin-center scale-[2.5] object-contain"
                                        loading="lazy"
                                      />
                                      {detailText ? (
                                        <span className="pointer-events-none absolute bottom-1 left-1/2 z-[9999] w-max max-w-[140px] -translate-x-1/2 rounded-md bg-black px-2 py-1 text-center text-[9px] leading-tight text-white opacity-0 transition group-hover:opacity-100">
                                          {detailText}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-[var(--color-muted)]">
                                Davul ekipmanı bilgisi eklenmemiş.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]">
                  {room.images.length ? (
                    <div className="h-56 sm:h-64">
                      <StudioGalleryCarousel
                        items={room.images.map((src) => ({
                          src,
                          roomName: room.name,
                        }))}
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center px-4 text-xs text-[var(--color-muted)]">
                      Bu oda için görsel eklenmemiş.
                    </div>
                  )}
                </div>

                {visibleInfoRows.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-primary)]">Bilgiler</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibleInfoRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-xs"
                        >
                          <span className="text-[var(--color-muted)]">{row.label}</span>
                          <span className="text-[var(--color-primary)]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {visibleExtrasRows.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-primary)]">Ekstralar</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibleExtrasRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-xs"
                        >
                          <span className="text-[var(--color-muted)]">{row.label}</span>
                          <span className="text-[var(--color-primary)]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {hasAvailability ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-4 py-3">
                    <p className="text-xs font-semibold text-[var(--color-primary)]">Müsaitlik durumu</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      <Badge variant={isAvailable ? "default" : "outline"}>
                        {isAvailable ? "Müsait" : "Dolu"}
                      </Badge>
                      <span>Seçtiğin saat için uygunluk</span>
                    </div>
                  </div>
                ) : null}

                <a
                  href={contactHref}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
                >
                  İletişime Geç
                </a>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
