"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Phone, Send, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
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
  studioId: string;
  studioName: string;
  studioSlug: string;
  studioPhone?: string | null;
  bookingApprovalMode?: "manual" | "auto";
  bookingCutoffUnit?: "hours" | "days";
  bookingCutoffValue?: number | null;
};

type ContactChannel = "in_app" | "whatsapp" | "phone";

const formatBadge = (text: string) => (text ? text : "Fiyat yok");
const formatPriceValue = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.includes("₺") ? trimmed : `₺${trimmed}`;
};
const formatPriceNumber = (value?: number | null) => {
  if (value === null || value === undefined) return "Fiyat bilgisi yok";
  return `${Math.round(value).toLocaleString("tr-TR")} ₺`;
};
const parsePriceValue = (value?: string | null) => {
  if (!value) return null;
  const raw = value.toString().trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  } else if (hasDot) {
    const parts = cleaned.split(".");
    const tail = parts[parts.length - 1] ?? "";
    normalized = parts.length > 1 && tail.length === 3 ? parts.join("") : cleaned;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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
  onSlotSelect,
}: {
  calendar?: RoomCalendarSummary | null;
  className?: string;
  onSlotSelect?: (startAt: Date) => void;
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
                  const canSelect = Boolean(onSlotSelect) && inOpenRange && !isBlocked;
                  const handleSelect = () => {
                    if (!canSelect) return;
                    onSlotSelect?.(slotStart);
                  };
                  return canSelect ? (
                    <button
                      key={`${day.toISOString()}-${slot}`}
                      type="button"
                      onClick={handleSelect}
                      className={`flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[10px] ${cellClass} cursor-pointer hover:border-emerald-400 hover:bg-emerald-400/35`}
                    >
                      {isHappyHour ? (
                        <HappyHourIcon className="h-12 w-12 text-amber-400" />
                      ) : (
                        label
                      )}
                    </button>
                  ) : (
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

export function StudioRoomDetails({
  rooms,
  availability,
  studioId,
  studioName,
  studioSlug,
  studioPhone,
  bookingApprovalMode = "manual",
  bookingCutoffUnit = "hours",
  bookingCutoffValue = 24,
}: Props) {
  const defaultOpenRooms =
    rooms.length === 1 && rooms[0] ? { [rooms[0].id]: true } : {};
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>(defaultOpenRooms);
  const [openDrumEquipment, setOpenDrumEquipment] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactChannel, setContactChannel] = useState<ContactChannel>("in_app");
  const [contactRoom, setContactRoom] = useState<{ id?: string; name?: string } | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactAutoOpened, setContactAutoOpened] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationRoom, setReservationRoom] = useState<RoomDetail | null>(null);
  const [reservationStart, setReservationStart] = useState<Date | null>(null);
  const [reservationHours, setReservationHours] = useState(1);
  const [reservationName, setReservationName] = useState("");
  const [reservationPhone, setReservationPhone] = useState("");
  const [reservationEmail, setReservationEmail] = useState("");
  const [reservationNote, setReservationNote] = useState("");
  const [reservationSending, setReservationSending] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationAutoOpened, setReservationAutoOpened] = useState(false);
  const [calendarPreviewOpen, setCalendarPreviewOpen] = useState(false);
  const [calendarPreviewRoomId, setCalendarPreviewRoomId] = useState<string | null>(null);
  const calendarRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!rooms.length) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-[var(--color-muted)]">Henüz oda bilgisi eklenmemiş.</p>
      </Card>
    );
  }

  const hasAvailability = Boolean(availability?.date && availability?.time);
  const phoneDigits = studioPhone ? studioPhone.replace(/\D/g, "") : "";
  const trimmedPhone = phoneDigits.startsWith("0") ? phoneDigits.slice(1) : phoneDigits;
  const phoneNormalized = trimmedPhone
    ? trimmedPhone.startsWith("90")
      ? trimmedPhone
      : `90${trimmedPhone}`
    : "";
  const canWhatsApp = Boolean(phoneNormalized);
  const canPhone = Boolean(trimmedPhone);
  const isAuthed = status === "authenticated";
  const sessionUser = useMemo(
    () =>
      session?.user as
        | { fullName?: string | null; name?: string | null; email?: string | null; phone?: string | null }
        | undefined,
    [session?.user],
  );

  const getAnonymousId = () => {
    if (typeof window === "undefined") return "";
    const key = "studyom:anon";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next =
      window.crypto?.randomUUID?.() ||
      `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  };

  const buildTemplate = (roomName?: string | null) => {
    const cleanedRoom = roomName?.trim();
    const roomLine = cleanedRoom
      ? `${cleanedRoom} için müsaitlik ve fiyat soracaktım.`
      : "Müsaitlik ve fiyat soracaktım.";
    return `Merhaba, ${studioName} hakkında bilgi almak istiyorum. ${roomLine}`;
  };
  const buildWhatsAppTemplate = (roomName?: string | null) => {
    const cleanedRoom = roomName?.trim();
    const roomLine = cleanedRoom ? `${cleanedRoom} için müsaitlik soracaktım.` : "stüdyo için müsaitlik soracaktım.";
    return `Merhaba, studyom'dan ulaşıyorum, ${roomLine}`;
  };

  const openReservation = (room: RoomDetail, startAt: Date) => {
    setReservationRoom(room);
    setReservationStart(startAt);
    setReservationHours(1);
    setReservationNote("");
    setReservationError(null);
    setReservationOpen(true);
    const fallbackName =
      sessionUser?.fullName || sessionUser?.name || sessionUser?.email?.split("@")[0] || "";
    setReservationName(fallbackName);
    setReservationPhone(sessionUser?.phone || "");
    setReservationEmail(sessionUser?.email || "");
  };

  const reservationMaxHours = useMemo(() => {
    if (!reservationRoom?.calendar || !reservationStart) return 0;
    const calendar = reservationRoom.calendar;
    const day = new Date(
      reservationStart.getFullYear(),
      reservationStart.getMonth(),
      reservationStart.getDate(),
    );
    const range = getOpenRange(day, calendar.openingHours);
    if (!range) return 0;
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const startMinutes = (reservationStart.getTime() - dayStart.getTime()) / 60000;
    let max = 0;
    for (let h = 1; h <= 24; h += 1) {
      const endMinutes = startMinutes + h * 60;
      if (endMinutes > range.end) break;
      const slotStart = new Date(reservationStart.getTime() + (h - 1) * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const blocked = calendar.blocks.some((block) => {
        if (!isBlocking(block)) return false;
        const start = new Date(block.startAt);
        const end = new Date(block.endAt);
        return start < slotEnd && end > slotStart;
      });
      if (blocked) break;
      max = h;
    }
    return max;
  }, [reservationRoom, reservationStart]);

  useEffect(() => {
    if (!reservationOpen) return;
    if (!reservationMaxHours) return;
    setReservationHours((prev) => Math.min(Math.max(1, prev), reservationMaxHours));
  }, [reservationOpen, reservationMaxHours]);

  const reservationPrice = useMemo(() => {
    if (!reservationRoom?.calendar || !reservationStart) return null;
    const baseRate =
      parsePriceValue(reservationRoom.pricing.hourlyRate) ??
      parsePriceValue(reservationRoom.pricing.minRate) ??
      parsePriceValue(reservationRoom.pricing.flatRate);
    const happyRate = parsePriceValue(reservationRoom.pricing.happyHourRate) ?? baseRate;
    let total = 0;
    let happyHours = 0;
    let normalHours = 0;
    let missingRate = false;
    const happySlots = reservationRoom.calendar.happyHours ?? [];
    for (let i = 0; i < reservationHours; i += 1) {
      const slotStart = new Date(reservationStart.getTime() + i * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const isHappy = happySlots.some((slot) => {
        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);
        return start < slotEnd && end > slotStart;
      });
      const rate = isHappy ? happyRate : baseRate;
      if (rate === null || rate === undefined) {
        missingRate = true;
        break;
      }
      total += rate;
      if (isHappy) happyHours += 1;
      else normalHours += 1;
    }
    return {
      total: missingRate ? null : total,
      happyHours,
      normalHours,
      baseRate,
      happyRate,
    };
  }, [reservationRoom, reservationStart, reservationHours]);

  const reservationPhoneLocked = isAuthed;
  const reservationPhoneMissing = reservationPhoneLocked && !reservationPhone.trim();
  const autoApproval = bookingApprovalMode === "auto";
  const reservationEmailRequired = !isAuthed && !autoApproval;
  const canSubmitReservation =
    Boolean(reservationRoom) &&
    Boolean(reservationStart) &&
    reservationHours > 0 &&
    Boolean(reservationName.trim()) &&
    Boolean(reservationPhone.trim()) &&
    (!reservationEmailRequired || Boolean(reservationEmail.trim())) &&
    !reservationPhoneMissing &&
    (!autoApproval || isAuthed);

  const openContact = (room?: { id?: string; name?: string } | null) => {
    setContactRoom(room ? { id: room.id, name: room.name } : null);
    setContactChannel("in_app");
    setContactMessage(buildTemplate(room?.name));
    setContactError(null);
    setContactOpen(true);
  };

  const openRoomCalendar = (roomId: string) => {
    setOpenRooms((prev) => ({ ...prev, [roomId]: true }));
    setCalendarPreviewRoomId(roomId);
    setCalendarPreviewOpen(true);
  };

  const logContactEvent = (channel: ContactChannel) => {
    const anonymousId = !isAuthed ? getAnonymousId() : "";
    void fetch("/api/studio-contact-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioId,
        channel,
        roomId: contactRoom?.id,
        anonymousId: anonymousId || undefined,
      }),
      keepalive: true,
    });
  };

  const calendarPreviewRoom = useMemo(
    () => rooms.find((room) => room.id === calendarPreviewRoomId) ?? null,
    [rooms, calendarPreviewRoomId],
  );

  const handleSendMessage = async () => {
    const trimmed = contactMessage.trim();
    if (!trimmed) {
      setContactError("Mesaj gerekli.");
      return;
    }
    if (trimmed.length > 1200) {
      setContactError("Mesaj çok uzun.");
      return;
    }
    if (!isAuthed) {
      const roomParam = contactRoom?.id ? `&roomId=${contactRoom.id}` : "";
      router.push(
        `/login?redirect=${encodeURIComponent(`/studyo/${studioSlug}?contact=1${roomParam}`)}`,
      );
      return;
    }

    setContactSending(true);
    setContactError(null);
    try {
      const threadRes = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId }),
      });
      if (threadRes.status === 401) {
        const roomParam = contactRoom?.id ? `&roomId=${contactRoom.id}` : "";
        router.push(
          `/login?redirect=${encodeURIComponent(`/studyo/${studioSlug}?contact=1${roomParam}`)}`,
        );
        return;
      }
      const threadJson = await threadRes.json().catch(() => ({}));
      if (!threadRes.ok) {
        setContactError(threadJson.error || "Mesajlaşma başlatılamadı.");
        return;
      }
      const threadId = threadJson.threadId;
      if (!threadId) {
        setContactError("Mesajlaşma başlatılamadı.");
        return;
      }

      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          body: trimmed,
          roomId: contactRoom?.id,
        }),
      });
      if (sendRes.status === 401) {
        const roomParam = contactRoom?.id ? `&roomId=${contactRoom.id}` : "";
        router.push(
          `/login?redirect=${encodeURIComponent(`/studyo/${studioSlug}?contact=1${roomParam}`)}`,
        );
        return;
      }
      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        setContactError(sendJson.error || "Mesaj gönderilemedi.");
        return;
      }

      toast.success("Mesaj gönderildi");
      setContactOpen(false);
      router.push(`/messages?studioThread=${threadId}`);
    } catch (err) {
      console.error(err);
      setContactError("Mesaj gönderilemedi.");
    } finally {
      setContactSending(false);
    }
  };

  const handleWhatsApp = () => {
    if (!phoneNormalized) return;
    const text = buildWhatsAppTemplate(contactRoom?.name);
    const url = `https://wa.me/${phoneNormalized}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    logContactEvent("whatsapp");
    setContactOpen(false);
  };

  const handlePhone = () => {
    if (!trimmedPhone) return;
    window.location.href = `tel:+${phoneNormalized}`;
    logContactEvent("phone");
    setContactOpen(false);
  };

  const handleReservationSubmit = async () => {
    if (!reservationRoom || !reservationStart) return;
    if (autoApproval && !isAuthed) {
      setReservationError("Otomatik onaylı rezervasyonlar sadece giriş yapan kullanıcılar için kullanılabilir.");
      return;
    }
    if (!reservationName.trim()) {
      setReservationError("İsim gerekli.");
      return;
    }
    if (!reservationPhone.trim()) {
      setReservationError("Telefon gerekli.");
      return;
    }
    if (reservationEmailRequired && !reservationEmail.trim()) {
      setReservationError("E-posta gerekli.");
      return;
    }
    if (reservationPhoneMissing) {
      setReservationError("Profilinde telefon yok. Lütfen profilden ekle.");
      return;
    }

    const maxHours = reservationMaxHours || 1;
    const safeHours = Math.min(Math.max(1, reservationHours), maxHours);
    setReservationSending(true);
    setReservationError(null);
    try {
      const res = await fetch("/api/studio-reservation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          roomId: reservationRoom.id,
          startAt: reservationStart.toISOString(),
          hours: safeHours,
          requesterName: reservationName.trim(),
          requesterPhone: reservationPhone.trim(),
          requesterEmail: reservationEmail.trim() || undefined,
          note: reservationNote.trim() || undefined,
        }),
      });
      const rawText = await res.text();
      let json: { error?: string } = {};
      if (rawText) {
        try {
          json = JSON.parse(rawText) as { error?: string };
        } catch {
          json = {};
        }
      }
      if (!res.ok) {
        const rawFallback =
          rawText && !rawText.trim().startsWith("<")
            ? rawText.trim().slice(0, 200)
            : `Rezervasyon isteği gönderilemedi. (HTTP ${res.status})`;
        setReservationError(json.error || rawFallback);
        return;
      }
      const status = (json as { status?: string }).status;
      toast.success(status === "approved" ? "Rezervasyon oluşturuldu" : "Rezervasyon isteği gönderildi");
      setReservationOpen(false);
    } catch (err) {
      console.error(err);
      setReservationError("Rezervasyon isteği gönderilemedi.");
    } finally {
      setReservationSending(false);
    }
  };

  useEffect(() => {
    if (!contactOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContactOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contactOpen]);

  useEffect(() => {
    if (!reservationOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReservationOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reservationOpen]);

  useEffect(() => {
    if (contactAutoOpened) return;
    if (searchParams?.get("contact") !== "1") return;
    const roomId = searchParams?.get("roomId") || "";
    const matchedRoom = roomId ? rooms.find((room) => room.id === roomId) : null;
    openContact(matchedRoom);
    setContactAutoOpened(true);
  }, [contactAutoOpened, rooms, searchParams]);

  useEffect(() => {
    if (reservationAutoOpened) return;
    if (searchParams?.get("reserve") !== "1") return;
    const roomId = searchParams?.get("roomId") || "";
    const startParam = searchParams?.get("start") || "";
    const startDate = startParam ? new Date(startParam) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) return;
    const matchedRoom = roomId ? rooms.find((room) => room.id === roomId) : rooms[0] ?? null;
    if (matchedRoom) {
      openReservation(matchedRoom, startDate);
      setReservationAutoOpened(true);
    }
  }, [reservationAutoOpened, rooms, searchParams]);

  const reservationStartLabel = reservationStart
    ? reservationStart.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

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
                  <div ref={(node) => {
                    calendarRefs.current[room.id] = node;
                  }}>
                    <RoomCalendarPreview calendar={room.calendar} onSlotSelect={(startAt) => openReservation(room, startAt)} />
                  </div>
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
                      {visibleExtrasRows.map((row, index) => (
                        <div
                          key={`${row.label}-${row.value}-${index}`}
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

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => openContact({ id: room.id, name: room.name })}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
                  >
                    İletişime Geç
                  </button>
                  <button
                    type="button"
                    onClick={() => openRoomCalendar(room.id)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
                  >
                    Rezervasyon Yap
                  </button>
                </div>
              </>
            )}
          </Card>
        );
      })}
      {calendarPreviewOpen && calendarPreviewRoom ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 pt-10 sm:items-center sm:p-6"
          onClick={() => setCalendarPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Takvim</p>
                {calendarPreviewRoom.name ? (
                  <p className="text-xs text-[var(--color-muted)]">Oda: {calendarPreviewRoom.name}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setCalendarPreviewOpen(false)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface)]"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <RoomCalendarPreview
                calendar={calendarPreviewRoom.calendar}
                onSlotSelect={(startAt) => {
                  setCalendarPreviewOpen(false);
                  openReservation(calendarPreviewRoom, startAt);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {reservationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 pt-10 sm:items-center sm:p-6"
          onClick={() => setReservationOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {autoApproval ? "Rezervasyon" : "Rezervasyon isteği"}
                </p>
                {reservationRoom?.name ? (
                  <p className="text-xs text-[var(--color-muted)]">Seçili oda: {reservationRoom.name}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setReservationOpen(false)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface)]"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    <p className="text-[11px] font-semibold text-[var(--color-primary)]">Başlangıç</p>
                    <p>{reservationStartLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    <p className="text-[11px] font-semibold text-[var(--color-primary)]">Maksimum süre</p>
                    <p>{reservationMaxHours ? `${reservationMaxHours} saat` : "—"}</p>
                  </div>
                </div>
                {autoApproval ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-[11px] text-[var(--color-muted)]">
                    <p className="font-semibold text-[var(--color-primary)]">Otomatik onaylı rezervasyon</p>
                    <p>Bu stüdyoda rezervasyonlar otomatik onaylanır.</p>
                    {bookingCutoffValue ? (
                      <p>
                        {bookingCutoffValue} {bookingCutoffUnit === "days" ? "gün" : "saat"} öncesinden rezervasyon
                        yapılabilir.
                      </p>
                    ) : null}
                    {!isAuthed ? <p>Bu özellik sadece giriş yapan kullanıcılar içindir.</p> : null}
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">Kaç saat istiyorsun?</label>
                  <input
                    type="number"
                    min={1}
                    max={reservationMaxHours || 1}
                    value={reservationHours}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      setReservationHours(Number.isFinite(next) ? next : 1);
                    }}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">İsim</label>
                  <input
                    type="text"
                    value={reservationName}
                    onChange={(event) => setReservationName(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">Telefon</label>
                  <input
                    type="tel"
                    value={reservationPhone}
                    onChange={(event) => setReservationPhone(event.target.value)}
                    disabled={reservationPhoneLocked}
                    readOnly={reservationPhoneLocked}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-70"
                  />
                  {reservationPhoneMissing ? (
                    <p className="text-[11px] text-[var(--color-danger)]">
                      Profilinde telefon yok. Lütfen <a href="/profile" className="underline">profilinden</a> ekle.
                    </p>
                  ) : reservationPhoneLocked ? (
                    <p className="text-[11px] text-[var(--color-muted)]">Telefon profilinden alınır.</p>
                  ) : null}
                </div>

                {!isAuthed && !autoApproval ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-muted)]">E-posta</label>
                    <input
                      type="email"
                      value={reservationEmail}
                      onChange={(event) => setReservationEmail(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">Not (opsiyonel)</label>
                  <textarea
                    value={reservationNote}
                    onChange={(event) => setReservationNote(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-3 text-xs text-[var(--color-muted)]">
                  <p className="text-[11px] font-semibold text-[var(--color-primary)]">Ücret özeti</p>
                  <p className="mt-1 text-sm text-[var(--color-primary)]">
                    Toplam: {formatPriceNumber(reservationPrice?.total ?? null)}
                  </p>
                  {reservationPrice?.happyHours ? (
                    <p className="mt-1 text-[11px]">
                      Happy Hour: {reservationPrice.happyHours} saat · {formatPriceNumber(reservationPrice.happyRate ?? null)}/saat
                    </p>
                  ) : null}
                  {reservationPrice?.normalHours ? (
                    <p className="text-[11px]">
                      Normal: {reservationPrice.normalHours} saat · {formatPriceNumber(reservationPrice.baseRate ?? null)}/saat
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setReservationOpen(false)}>
                      Vazgeç
                    </Button>
                    <Button size="sm" onClick={handleReservationSubmit} disabled={reservationSending || !canSubmitReservation}>
                      {reservationSending ? "Gönderiliyor…" : autoApproval ? "Rezervasyon yap" : "İstek gönder"}
                    </Button>
                  </div>
                </div>
                {reservationError ? (
                  <p className="text-xs text-[var(--color-danger)]">{reservationError}</p>
                ) : null}
              </div>
          </div>
        </div>
      )}
      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 pt-10 sm:items-center sm:p-6"
          onClick={() => setContactOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  Stüdyo ile nasıl iletişime geçmek istersin?
                </p>
                {contactRoom?.name ? (
                  <p className="text-xs text-[var(--color-muted)]">Seçili oda: {contactRoom.name}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface)]"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthed) {
                    const roomParam = contactRoom?.id ? `&roomId=${contactRoom.id}` : "";
                    router.push(
                      `/login?redirect=${encodeURIComponent(`/studyo/${studioSlug}?contact=1${roomParam}`)}`,
                    );
                    return;
                  }
                  setContactChannel("in_app");
                }}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  contactChannel === "in_app"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-primary)] hover:border-[var(--color-accent)]/60"
                }`}
              >
                <MessageCircle className="h-4 w-4 text-[var(--color-accent)]" />
                <span>Studyom üzerinden mesaj</span>
              </button>

              {canWhatsApp ? (
                <button
                  type="button"
                  onClick={() => {
                    setContactChannel("whatsapp");
                    handleWhatsApp();
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-left text-xs font-semibold text-[var(--color-primary)] transition hover:border-[#25D366]/60"
                >
                  <Send className="h-4 w-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>
              ) : null}

              {canPhone ? (
                <button
                  type="button"
                  onClick={() => {
                    setContactChannel("phone");
                    handlePhone();
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-left text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]/60"
                >
                  <Phone className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>Telefon</span>
                </button>
              ) : null}
            </div>

            {contactChannel === "in_app" ? (
              <div className="mt-4 space-y-3">
                {!isAuthed ? (
                  <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-3 text-xs text-[var(--color-muted)]">
                    <p>Mesaj göndermek için giriş yapmalısın. WhatsApp/Telefon için giriş gerekmez.</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const roomParam = contactRoom?.id ? `&roomId=${contactRoom.id}` : "";
                        router.push(
                          `/login?redirect=${encodeURIComponent(`/studyo/${studioSlug}?contact=1${roomParam}`)}`,
                        );
                      }}
                    >
                      Giriş yap
                    </Button>
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-semibold text-[var(--color-muted)]">
                      Mesajın (max 1200 karakter)
                    </label>
                    <textarea
                      value={contactMessage}
                      onChange={(event) => setContactMessage(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[var(--color-muted)]">
                        {contactMessage.trim().length} / 1200
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setContactOpen(false)}>
                          Vazgeç
                        </Button>
                        <Button size="sm" onClick={handleSendMessage} disabled={contactSending}>
                          {contactSending ? "Gönderiliyor…" : "Gönder"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {contactError ? (
                  <p className="text-xs text-[var(--color-danger)]">{contactError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
