"use client";

import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { BarChart3, ChevronDown, Key, Save } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { Equipment, OpeningHours, Room, Slot, Studio } from "@/types/panel";

type Props = {
  initialStudio?: Studio;
  userName?: string | null;
  userEmail?: string | null;
  emailVerified?: boolean;
  linkedTeachers?: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    slug: string;
  }[];
  linkedProducers?: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    slug: string;
  }[];
};

const shortDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const longDays = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function HappyHourIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 360"
      role="img"
      aria-label="Happy Hour"
      className={className}
    >
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
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
      >
        HAPPY
      </text>
      <text
        x="450"
        y="260"
        fontSize="108"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
      >
        HOUR!
      </text>
    </svg>
  );
}

const contactMethodOptions = ["Phone", "WhatsApp", "Email"] as const;
const roomTypeOptions = ["Prova odası", "Kayıt odası", "Vokal kabini", "Kontrol odası", "Prodüksiyon odası"] as const;
const roomTypeOptionsUi = ["Prova odası", "Vokal kabini", "Kayıt kabini", "Davul kabini", "Etüt odası"] as const;
const bookingModes = ["Onaylı talep (ben onaylarım)", "Direkt rezervasyon (sonra açılabilir)"] as const;
const priceRanges = ["500–750", "750–1000", "1000–1500", "1500+"] as const;
const recordingProductionOptions = [
  "Davul yazımı",
  "Bas yazımı",
  "Gitar yazımı",
  "Telli enstrüman yazımı",
  "Üflemeli enstrüman yazımı",
  "Yaylı enstrüman yazımı",
  "Beat yapımı",
  "Enstrüman ekleme",
  "Aranje",
  "Müzik prodüksiyonu",
  "Sound design",
  "Beste & söz yazımı",
  "DJ edit / set hazırlama",
] as const;

type ContactMethod = (typeof contactMethodOptions)[number];
type RoomTypeOption = (typeof roomTypeOptions)[number];
type BookingMode = (typeof bookingModes)[number];
type PriceRange = (typeof priceRanges)[number];

const contactMethodLabels: Record<ContactMethod, string> = {
  Phone: "Telefon",
  WhatsApp: "WhatsApp",
  Email: "E-posta",
};

type RoomSectionProps = {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
};

function RoomSection({
  title,
  description,
  open,
  onToggle,
  children,
  className,
}: RoomSectionProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-800 shadow-sm ${
        className ?? ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {description ? <p className="mt-1 text-xs text-gray-600">{description}</p> : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </div>
  );
}

const defaultEquipment: Room["equipment"] = {
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
  drumCowbellDetail: "",
  hasTwinPedal: false,
  twinPedalDetail: "",
  micCount: 0,
  micDetails: [],
  guitarAmpCount: 0,
  guitarAmpDetails: [],
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

const defaultFeatures: Room["features"] = {
  micCount: 0,
  micDetails: [],
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

const defaultExtras: Room["extras"] = {
  offersMixMaster: false,
  engineerPortfolioUrl: "",
  offersProduction: false,
  productionAreas: [],
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

const guitarList = (val?: string | null) => (val ? val.split("|") : []);

type BasicInfoForm = {
  studioName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  mapsUrl: string;
  contactMethods: ContactMethod[];
  contactHours: string;
  roomsCount: number;
  roomTypes: RoomTypeOption[];
  bookingMode: BookingMode;
  equipment: {
    drum: boolean;
    guitarAmp: boolean;
    bassAmp: boolean;
    pa: boolean;
    mic: boolean;
  };
  equipmentHighlight: string;
  priceRange: PriceRange;
  priceVaries: boolean;
  linkPortfolio: string;
  linkGoogle: string;
};

const equipmentLabels: Record<keyof BasicInfoForm["equipment"], string> = {
  drum: "Davul seti",
  guitarAmp: "Gitar amfisi",
  bassAmp: "Bas amfisi",
  pa: "PA / Ses sistemi",
  mic: "Mikrofon",
};

const defaultBasicForm: BasicInfoForm = {
  studioName: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  address: "",
  mapsUrl: "",
  contactMethods: ["Phone"],
  contactHours: "",
  roomsCount: 1,
  roomTypes: [],
  bookingMode: "Onaylı talep (ben onaylarım)",
  equipment: {
    drum: false,
    guitarAmp: false,
    bassAmp: false,
    pa: false,
    mic: false,
  },
  equipmentHighlight: "",
  priceRange: "500–750",
  priceVaries: false,
  linkPortfolio: "",
  linkGoogle: "",
};

const parseNotificationValue = (notifications: string[], prefix: string) => {
  const found = notifications.find((note) => note.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
};

const parseAddressParts = (value?: string | null) => {
  const raw = value?.trim() ?? "";
  if (!raw) return { neighborhood: "", address: "" };
  const parts = raw.split(" - ");
  if (parts.length >= 2) {
    const [neighborhood, ...rest] = parts;
    return { neighborhood: neighborhood.trim(), address: rest.join(" - ").trim() };
  }
  return { neighborhood: "", address: raw };
};

const parseBasicInfoFromStudio = (studio: Studio | null): BasicInfoForm => {
  if (!studio) return { ...defaultBasicForm };
  const notes = studio.notifications ?? [];
  const { neighborhood, address } = parseAddressParts(studio.address);

  const contactMethodsRaw = parseNotificationValue(notes, "İletişim tercihleri:");
  const contactMethods = contactMethodsRaw
    ? contactMethodsRaw.split(",").map((m) => m.trim()).filter((m) => contactMethodOptions.includes(m as ContactMethod))
    : [];

  const roomInfo = parseNotificationValue(notes, "Oda sayısı:");
  const roomsCountMatch = roomInfo.match(/(\d+)/);
  const roomsCount = roomsCountMatch ? Number(roomsCountMatch[1]) : defaultBasicForm.roomsCount;
  const roomTypesMatch = roomInfo.match(/tipler:\s*(.*)/i);
  const roomTypesRaw = roomTypesMatch ? roomTypesMatch[1].split(",").map((t) => t.trim()) : [];
  const roomTypes = roomTypesRaw.filter((t) => roomTypeOptions.includes(t as RoomTypeOption)) as RoomTypeOption[];

  const equipmentSignal = parseNotificationValue(notes, "Ekipman sinyali:");
  const equipmentTokens = equipmentSignal
    ? equipmentSignal.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const equipment = {
    drum: equipmentTokens.includes("drum"),
    guitarAmp: equipmentTokens.includes("guitarAmp"),
    bassAmp: equipmentTokens.includes("bassAmp"),
    pa: equipmentTokens.includes("pa"),
    mic: equipmentTokens.includes("mic"),
  };

  const bookingModeRaw = parseNotificationValue(notes, "Booking modu:");
  const bookingMode = bookingModes.includes(bookingModeRaw as BookingMode)
    ? (bookingModeRaw as BookingMode)
    : defaultBasicForm.bookingMode;

  const priceRaw = parseNotificationValue(notes, "Fiyat aralığı:");
  const priceVaries = priceRaw.includes("odaya göre");
  const priceRangeCandidate = priceRaw.split("(")[0].trim();
  const priceRange = priceRanges.includes(priceRangeCandidate as PriceRange)
    ? (priceRangeCandidate as PriceRange)
    : defaultBasicForm.priceRange;

  return {
    studioName: studio.name ?? "",
    phone: studio.phone ?? "",
    city: studio.city ?? "",
    district: studio.district ?? "",
    neighborhood,
    address,
    mapsUrl: parseNotificationValue(notes, "Maps:"),
    contactMethods: contactMethods.length ? (contactMethods as ContactMethod[]) : defaultBasicForm.contactMethods,
    contactHours: parseNotificationValue(notes, "İletişim saatleri:"),
    roomsCount: Number.isNaN(roomsCount) ? defaultBasicForm.roomsCount : roomsCount,
    roomTypes,
    bookingMode,
    equipment,
    equipmentHighlight: parseNotificationValue(notes, "Öne çıkan ekipman:"),
    priceRange,
    priceVaries,
    linkPortfolio: parseNotificationValue(notes, "Instagram/Web:"),
    linkGoogle: parseNotificationValue(notes, "Google Business:"),
  };
};

function normalizeRoom(room: Room): Room {
  return {
    ...room,
    equipment: room.equipment ?? { ...defaultEquipment },
    features: room.features ?? { ...defaultFeatures },
    extras: { ...defaultExtras, ...(room.extras ?? {}) },
    images: room.images ?? [],
    slots: room.slots ?? {},
  };
}

const buildDefaultOpeningHours = (): OpeningHours[] =>
  Array.from({ length: 7 }, () => ({
    open: true,
    openTime: "09:00",
    closeTime: "21:00",
  }));

const normalizeOpeningHours = (hours?: OpeningHours[] | null): OpeningHours[] =>
  Array.isArray(hours) && hours.length === 7 ? hours : buildDefaultOpeningHours();

function normalizeStudio(data: Studio | null): Studio | null {
  if (!data) return null;
  return {
    ...data,
    openingHours: normalizeOpeningHours(data.openingHours),
    rooms: (data.rooms ?? []).map((r) => normalizeRoom(r)),
  };
}

const colorPalette = ["#1D4ED8", "#0EA5E9", "#10B981", "#F97316", "#F43F5E"];

const pickNextColor = (rooms: Room[]) => {
  const used = new Set(
    rooms
      .map((r) => r.color)
      .filter(Boolean)
      .map((c) => c!.toLowerCase()),
  );
  const next =
    colorPalette.find((c) => !used.has(c.toLowerCase())) ?? colorPalette[rooms.length % colorPalette.length];
  return next;
};

const pad = (n: number) => n.toString().padStart(2, "0");
const hourOptions = Array.from({ length: 24 }, (_, h) => `${pad(h)}:00`);
const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};
const formatKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const weekdayIndex = (d: Date) => {
  // Monday = 0 ... Sunday = 6
  return (d.getDay() + 6) % 7;
};

const pricingLabel = (room: Room) => {
  const { pricing, type } = room;
  if (pricing.model === "flat" && pricing.flatRate) {
    return `Saatlik ${pricing.flatRate}₺`;
  }
  if (pricing.model === "daily" && pricing.dailyRate) {
    return `Günlük ${pricing.dailyRate}₺`;
  }
  if (pricing.model === "hourly" && pricing.hourlyRate) {
    return `Saatlik ${pricing.hourlyRate}₺`;
  }
  if (pricing.model === "variable" && pricing.minRate) {
    return `Değişken • min ${pricing.minRate}₺`;
  }
  return `${type} için ücret bilgisi eklenmedi`;
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

const ensureSlotsForDay = (
  room: Room,
  day: Date,
  openingHours: OpeningHours[],
): Room => {
  const key = formatKey(day);
  if (room.slots[key]) return room;

  const dayIdx = weekdayIndex(day);
  const info = openingHours[dayIdx];
  const prevInfo = openingHours[(dayIdx + 6) % 7];
  if (!info || !info.open) {
    // Eğer önceki gün ertesi güne taşan saatler varsa onları ekle
    const ranges: { start: number; end: number }[] = [];
    if (prevInfo?.open) {
      const [prevStart] = prevInfo.openTime.split(":").map(Number);
      const [prevEnd] = prevInfo.closeTime.split(":").map(Number);
      if (prevEnd <= prevStart && prevEnd > 0) {
        ranges.push({ start: 0, end: prevEnd });
      }
    }
    const slotsFromRanges: Slot[] = [];
    ranges.forEach(({ start, end }) => {
      for (let h = start; h < end; h++) {
        slotsFromRanges.push({
          timeLabel: `${pad(h)}:00 - ${pad(h + 1)}:00`,
          status: "empty",
        });
      }
    });
    return { ...room, slots: { ...room.slots, [key]: slotsFromRanges } };
  }

  const [startHour] = info.openTime.split(":").map(Number);
  const [endHour] = info.closeTime.split(":").map(Number);
  const ranges: { start: number; end: number }[] = [];

  // Önceki günden taşan aralık
  if (prevInfo?.open) {
    const [prevStart] = prevInfo.openTime.split(":").map(Number);
    const [prevEnd] = prevInfo.closeTime.split(":").map(Number);
    if (prevEnd <= prevStart && prevEnd > 0) {
      ranges.push({ start: 0, end: prevEnd });
    }
  }

  // Bugünün aralığı
  if (endHour > startHour) {
    ranges.push({ start: startHour, end: endHour });
  } else if (endHour < startHour) {
    // ertesi güne sarkan: bugün start..24
    ranges.push({ start: startHour, end: 24 });
    // ertesi gün 0..endHour kısmı, bu günün slot’una yazılmıyor; o gün ensureSlotsForDay çağrısında ekleniyor
  }
  // endHour === startHour ise boş (24 saat açık desteği yok, kapalı say)

  const generated: Slot[] = [];
  ranges.forEach(({ start, end }) => {
    for (let h = start; h < end; h++) {
      generated.push({
        timeLabel: `${pad(h)}:00 - ${pad(h + 1)}:00`,
        status: "empty",
      });
    }
  });

  return { ...room, slots: { ...room.slots, [key]: generated } };
};

type CalendarView = "month" | "week" | "day";

type CalendarBlock = {
  id: string;
  roomId: string;
  startAt: string;
  endAt: string;
  type: "manual_block" | "reservation";
  title?: string;
  status?: string | null;
  note?: string;
};

type CalendarSettings = {
  slotStepMinutes: number;
  dayCutoffHour: number;
  timezone: string;
  happyHourEnabled?: boolean;
  weeklyHours: OpeningHours[];
};

const slotStepOptions = [30, 60, 90, 120] as const;
const cutoffHourOptions = [0, 1, 2, 3, 4, 5, 6] as const;

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const buildEndTimeOptions = (openTime: string, cutoffHour: number) => {
  const openHour = Number(openTime.split(":")[0] ?? 0);
  const base = Array.from({ length: 24 - openHour }, (_, idx) => openHour + idx);
  const wrap = Array.from({ length: cutoffHour + 1 }, (_, idx) => idx);
  const order: number[] = [...base, ...wrap];
  const seen = new Set<number>();
  return order.filter((h) => {
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  }).map((h) => `${pad(h)}:00`);
};

const formatMinutesLabel = (totalMinutes: number) => {
  const dayOffset = Math.floor(totalMinutes / (24 * 60));
  const minutes = totalMinutes % (24 * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = `${pad(h)}:${pad(m)}`;
  return dayOffset > 0 ? `${label} (+${dayOffset})` : label;
};

const withAlpha = (hex: string, alpha: number) => {
  const fallback = `rgba(29, 78, 216, ${alpha})`;
  if (!hex) return fallback;
  let value = hex.trim().replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (value.length !== 6) return fallback;
  const num = Number.parseInt(value, 16);
  if (Number.isNaN(num)) return fallback;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

const startOfWeek = (date: Date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = weekdayIndex(day);
  day.setDate(day.getDate() - offset);
  return day;
};

const getDayRange = (day: Date, cutoffHour: number) => {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(cutoffHour, 0, 0, 0);
  return { start, end };
};

const getBusinessDayStartForTime = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < cutoffHour * 60) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const getTimelineForDay = (day: Date, openingHours: OpeningHours[], cutoffHour: number) => {
  const info = openingHours[weekdayIndex(day)];
  if (!info || !info.open) {
    return {
      start: 0,
      end: (24 + cutoffHour) * 60,
      isOpen: false,
    };
  }
  const openMinutes = minutesFromTime(info.openTime);
  let closeMinutes = minutesFromTime(info.closeTime);
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60;
  const end = Math.max(closeMinutes, (24 + cutoffHour) * 60);
  return { start: openMinutes, end, isOpen: true };
};

export function DashboardClient({
  initialStudio,
  userName,
  userEmail,
  emailVerified,
  linkedTeachers,
  linkedProducers,
}: Props) {
  const [studio, setStudio] = useState<Studio | null>(
    normalizeStudio(initialStudio ?? null),
  );
  const [activeTab, setActiveTab] = useState<string>("calendar");
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    const rooms = initialStudio?.rooms ?? [];
    if (!rooms.length) return "";
    const sorted = [...rooms].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name ?? "").localeCompare(b.name ?? ""),
    );
    return sorted[0]?.id ?? "";
  });
  const [calendarRoomScope, setCalendarRoomScope] = useState<string>(() => {
    const rooms = initialStudio?.rooms ?? [];
    if (!rooms.length) return "";
    const sorted = [...rooms].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name ?? "").localeCompare(b.name ?? ""),
    );
    return sorted[0]?.id ?? "";
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [weekCursor, setWeekCursor] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [calendarDraft, setCalendarDraft] = useState<CalendarSettings | null>(null);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    id?: string;
    day: Date;
    roomId: string;
    startMinutes: number;
    endMinutes: number;
    type: "manual_block" | "reservation";
    title: string;
    status: string;
    note: string;
  } | null>(null);
  const [dragState, setDragState] = useState<{ day: Date; start: number; end: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hoursDraft, setHoursDraft] = useState<OpeningHours[]>(
    normalizeOpeningHours(normalizeStudio(initialStudio ?? null)?.openingHours ?? null),
  );
  const [showRatings, setShowRatings] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [dragRoomId, setDragRoomId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [basicForm, setBasicForm] = useState<BasicInfoForm>(() =>
    parseBasicInfoFromStudio(initialStudio ?? null),
  );
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [basicUnlocked, setBasicUnlocked] = useState(false);
  const [basicTouched, setBasicTouched] = useState(false);
  const [basicSaving, setBasicSaving] = useState(false);
  const [basicStatus, setBasicStatus] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverStatus, setCoverStatus] = useState<string | null>(null);
  const [happyHourOpen, setHappyHourOpen] = useState(false);
  const [happyHourActive, setHappyHourActive] = useState(false);
  const [happyHourSlots, setHappyHourSlots] = useState<Record<string, boolean>>({});
  const [happyHourDays, setHappyHourDays] = useState(() =>
    longDays.map(() => ({ enabled: false, endTime: "22:00" })),
  );
  const [happyHourTouched, setHappyHourTouched] = useState(false);
  const [happyHourSaving, setHappyHourSaving] = useState(false);
  const [happyHourStatus, setHappyHourStatus] = useState<string | null>(null);
  const [happyHourScheduleVersion, setHappyHourScheduleVersion] = useState(0);
  const [calendarSummary, setCalendarSummary] = useState<{
    weekOccupancy: number;
    monthOccupancy: number;
    monthRevenue: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const studioRooms = studio?.rooms ?? [];
  const teacherLinks = linkedTeachers ?? [];
  const producerLinks = linkedProducers ?? [];
  const effectiveOpeningHours =
    normalizeOpeningHours(calendarSettings?.weeklyHours ?? studio?.openingHours ?? null);
  const slotStepMinutes = calendarSettings?.slotStepMinutes ?? 60;
  const dayCutoffHour = calendarSettings?.dayCutoffHour ?? 4;
  const orderedRooms = useMemo(() => {
    if (!studio?.rooms) return [];
    return [...studio.rooms].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
    );
  }, [studio?.rooms]);
  const roomColorById = useMemo(
    () => new Map(orderedRooms.map((room) => [room.id, room.color ?? "#1D4ED8"])),
    [orderedRooms],
  );
  const roomNameById = useMemo(
    () => new Map(orderedRooms.map((room) => [room.id, room.name || "Oda"])),
    [orderedRooms],
  );
  const happyHourRoomId = calendarRoomScope === "all" ? selectedRoomId : calendarRoomScope;
  const buildHappyHourKey = useCallback(
    (day: Date, minutes: number) =>
      `${happyHourRoomId}-${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(
        day.getDate(),
      )}-${minutes}`,
    [happyHourRoomId],
  );
  const isHappyHourSlot = useCallback(
    (day: Date, minutes: number) => {
      if (!happyHourActive || !happyHourRoomId) return false;
      const slotStart = addMinutes(day, minutes);
      const businessStart = getBusinessDayStartForTime(slotStart, dayCutoffHour);
      const minutesFromStart = Math.round(
        (slotStart.getTime() - businessStart.getTime()) / 60000,
      );
      const key = buildHappyHourKey(businessStart, minutesFromStart);
      return !!happyHourSlots[key];
    },
    [happyHourActive, happyHourRoomId, dayCutoffHour, buildHappyHourKey, happyHourSlots],
  );
  const calendarRoomIds = useMemo(() => {
    if (!orderedRooms.length) return [];
    if (calendarRoomScope === "all") {
      return orderedRooms.map((room) => room.id);
    }
    return [calendarRoomScope];
  }, [calendarRoomScope, orderedRooms]);
  const currentRoomRaw =
    orderedRooms.find((r) => r.id === selectedRoomId) ?? orderedRooms[0] ?? null;
  const currentRoom = currentRoomRaw ? normalizeRoom(currentRoomRaw) : null;
  const selectedRoomTypes = currentRoom
    ? Array.from(
        new Set([currentRoom.type, ...(currentRoom.extras?.alsoTypes ?? [])].filter(Boolean)),
      )
    : [];
  const activeRoomTypes = new Set(selectedRoomTypes);
  const hasRoomType = (type: Room["type"]) => activeRoomTypes.has(type);
  const isRehearsalLike = hasRoomType("Prova odası") || hasRoomType("Kayıt kabini");
  const showCourses =
    hasRoomType("Prova odası") ||
    hasRoomType("Vokal kabini") ||
    hasRoomType("Davul kabini") ||
    hasRoomType("Etüt odası");
  const coursesTitle = hasRoomType("Etüt odası") ? "Hocalara açık mısınız?" : "Kurslara açık mısınız?";
  const coursesDescription = "Hocalar odalarınızı ders vermek için kullanabilir.";
  const showExtras =
    hasRoomType("Vokal kabini") ||
    hasRoomType("Davul kabini") ||
    hasRoomType("Kayıt kabini");
  const rehearsalEquipmentTitle =
    hasRoomType("Prova odası") && hasRoomType("Kayıt kabini")
      ? "Prova / Kayıt ekipmanları"
      : hasRoomType("Kayıt kabini") && !hasRoomType("Prova odası")
        ? "Kayıt kabini ekipmanları"
        : "Prova ekipmanları";
  const sectionKey = (suffix: string) => (currentRoom ? `${currentRoom.id}:${suffix}` : suffix);
  const isSectionOpen = (suffix: string) => openSections[sectionKey(suffix)] ?? false;
  const toggleSection = (suffix: string) => {
    const key = sectionKey(suffix);
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const updateRoomTypes = (nextTypes: Room["type"][]) => {
    if (!currentRoom) return;
    const unique = Array.from(new Set(nextTypes));
    if (!unique.length) return;
    const primary = unique.includes(currentRoom.type) ? currentRoom.type : unique[0];
    const also = unique.filter((t) => t !== primary);
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((r) =>
              r.id === currentRoom.id
                ? {
                    ...r,
                    type: primary,
                    extras: { ...(r.extras ?? defaultExtras), alsoTypes: also },
                  }
                : r,
            ),
          }
        : prev,
    );
    if (saving) return;
    void saveRoomBasics(currentRoom.id, {
      name: currentRoom.name,
      type: primary,
      color: currentRoom.color,
      pricing: currentRoom.pricing,
      equipment: currentRoom.equipment,
      features: currentRoom.features,
      extras: { ...currentRoom.extras, alsoTypes: also },
    });
  };
  const persistImages = async (images: string[], statusText?: string) => {
    if (!currentRoom?.id) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((r) =>
              r.id === currentRoom.id
                ? {
                    ...r,
                    images,
                  }
                : r,
            ),
          }
        : prev,
    );
    await saveRoomBasics(currentRoom.id, { images });
    if (statusText) {
      setStatus(statusText);
    }
  };
  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }
    const data = (await res.json()) as { publicUrl?: string };
    return data.publicUrl;
  };
  const uploadCoverImage = async (file: File) => {
    if (!studio) return;
    if (file.size > 5 * 1024 * 1024) {
      setCoverStatus("5 MB üzeri dosya eklenemez.");
      return;
    }
    setCoverUploading(true);
    setCoverStatus(null);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Upload failed");
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio: { coverImageUrl: url } }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.studio) {
        setStudio(normalizeStudio(json.studio));
        setCoverStatus("Kapak görseli kaydedildi.");
      } else {
        setCoverStatus(json?.error || "Kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
      setCoverStatus("Görsel yüklenemedi.");
    } finally {
      setCoverUploading(false);
    }
  };
  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void uploadCoverImage(file);
    event.target.value = "";
  };
  const updateRoomImages = (urls: string[], replaceIndex?: number) => {
    if (!currentRoom?.id || !urls.length) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((r) => {
              if (r.id !== currentRoom.id) return r;
              const existing = r.images ?? [];
              let nextImages = existing;
              if (typeof replaceIndex === "number") {
                nextImages = [...existing];
                nextImages[replaceIndex] = urls[0] ?? nextImages[replaceIndex];
              } else {
                nextImages = [...existing, ...urls];
              }
              return { ...r, images: nextImages };
            }),
          }
        : prev,
    );
  };
  const uploadImages = async (files: File[], opts?: { replaceIndex?: number }) => {
    if (!currentRoom?.id) {
      setStatus("Önce bir oda seçin.");
      return;
    }
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (!valid.length) {
      setStatus("5 MB üzeri dosyalar eklenemez.");
      return;
    }
    try {
      const uploadedUrls: string[] = [];
      for (const file of valid) {
        const url = await uploadFile(file);
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length) {
        const base = currentRoom?.images ?? [];
        const nextImages =
          opts?.replaceIndex !== undefined
            ? base.map((img, idx) => (idx === opts.replaceIndex ? uploadedUrls[0] ?? img : img))
            : [...base, ...uploadedUrls];
        updateRoomImages(uploadedUrls, opts?.replaceIndex);
        await persistImages(
          nextImages,
          opts?.replaceIndex !== undefined ? "Görsel güncellendi" : "Görseller eklendi",
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("Görseller yüklenemedi.");
    }
  };
  const moveImage = (from: number, to: number) => {
    if (!currentRoom?.id) return;
    const arr = [...(currentRoom.images ?? [])];
    if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    void persistImages(arr, "Görsel sırası kaydedildi");
  };
  // sync hours draft when studio/settings changes
  useEffect(() => {
    setHoursDraft(
      normalizeOpeningHours(calendarSettings?.weeklyHours ?? studio?.openingHours ?? null),
    );
  }, [studio?.openingHours, calendarSettings?.weeklyHours]);

  useEffect(() => {
    if (!studio) return;
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/studio/calendar-settings");
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && json.settings) {
          setCalendarSettings(json.settings as CalendarSettings);
          setCalendarDraft(json.settings as CalendarSettings);
          setHappyHourActive(!!json.settings.happyHourEnabled);
        } else {
          const fallback: CalendarSettings = {
            slotStepMinutes: 60,
            dayCutoffHour: 4,
            timezone: "Europe/Istanbul",
            happyHourEnabled: false,
            weeklyHours: normalizeOpeningHours(studio.openingHours ?? hoursDraft),
          };
          setCalendarSettings(fallback);
          setCalendarDraft(fallback);
          setHappyHourActive(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, [studio?.id]);

  useEffect(() => {
    if (!happyHourRoomId) return;
    let active = true;
    const loadSchedule = async () => {
      try {
        const res = await fetch(`/api/studio/happy-hours/schedule?roomId=${happyHourRoomId}`);
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        const fallback = normalizeOpeningHours(
          calendarSettings?.weeklyHours ?? studio?.openingHours ?? null,
        );
        if (res.ok && Array.isArray(json.days)) {
          const map = new Map<number, { endTime?: string; enabled?: boolean }>();
          json.days.forEach((item: { weekday?: number; endTime?: string; enabled?: boolean }) => {
            if (typeof item.weekday === "number") {
              map.set(item.weekday, item);
            }
          });
          setHappyHourDays(
            longDays.map((_, idx) => {
              const entry = map.get(idx);
              const fallbackEnd = fallback[idx]?.closeTime ?? "22:00";
              return {
                enabled: !!entry?.enabled,
                endTime: entry?.endTime ?? fallbackEnd,
              };
            }),
          );
        } else {
          setHappyHourDays(
            longDays.map((_, idx) => ({
              enabled: false,
              endTime: fallback[idx]?.closeTime ?? "22:00",
            })),
          );
        }
        setHappyHourTouched(false);
      } catch (err) {
        if (!active) return;
        console.error(err);
      }
    };
    loadSchedule();
    return () => {
      active = false;
    };
  }, [happyHourRoomId, calendarSettings?.weeklyHours, studio?.openingHours]);

  useEffect(() => {
    if (!studio || basicTouched) return;
    setBasicForm(parseBasicInfoFromStudio(studio));
  }, [studio, basicTouched]);

  useEffect(() => {
    if (!selectedDate) return;
    setWeekCursor(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!studio) return;
    if (!calendarRoomIds.length) return;
    let rangeStart: Date;
    let rangeEnd: Date;
    if (calendarView === "month") {
      const startOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const offset = weekdayIndex(startOfMonth);
      const firstVisible = new Date(startOfMonth);
      firstVisible.setDate(startOfMonth.getDate() - offset);
      const totalCells = Math.ceil((offset + new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate()) / 7) * 7;
      const lastVisible = new Date(firstVisible);
      lastVisible.setDate(firstVisible.getDate() + totalCells - 1);
      rangeStart = new Date(firstVisible.getFullYear(), firstVisible.getMonth(), firstVisible.getDate());
      rangeEnd = getDayRange(lastVisible, dayCutoffHour).end;
    } else if (calendarView === "week") {
      const baseDay = weekCursor;
      rangeStart = startOfWeek(baseDay);
      rangeEnd = addMinutes(
        new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 7),
        dayCutoffHour * 60,
      );
    } else {
      const baseDay = selectedDate ?? new Date();
      const dayStart = new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate());
      rangeStart = dayStart;
      rangeEnd = getDayRange(dayStart, dayCutoffHour).end;
    }

    const loadBlocks = async () => {
      setCalendarLoading(true);
      setCalendarError(null);
      try {
        const roomQuery =
          calendarRoomScope === "all"
            ? `roomIds=${calendarRoomIds.join(",")}`
            : `roomId=${calendarRoomIds[0]}`;
        const blocksPromise = fetch(
          `/api/studio/calendar-blocks?${roomQuery}&start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
        );
        const happyPromise = happyHourRoomId
          ? fetch(
              `/api/studio/happy-hours?roomId=${happyHourRoomId}&start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
            )
          : null;
        const [blocksRes, happyRes] = await Promise.all([blocksPromise, happyPromise]);
        const blocksJson = await blocksRes.json().catch(() => ({}));
        if (!blocksRes.ok) {
          setCalendarError(blocksJson.error || "Takvim blokları alınamadı.");
          setCalendarBlocks([]);
          setCalendarLoading(false);
          return;
        }
        setCalendarBlocks((blocksJson.blocks as CalendarBlock[]) ?? []);
        if (happyRes) {
          const happyJson = await happyRes.json().catch(() => ({}));
          if (happyRes.ok) {
            const nextSlots: Record<string, boolean> = {};
            (happyJson.slots as { startAt: string; endAt: string }[] | undefined)?.forEach(
              (slot) => {
                const start = new Date(slot.startAt);
                const end = new Date(slot.endAt);
                const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
                const minutesFromStart = Math.round(
                  (start.getTime() - businessStart.getTime()) / 60000,
                );
                const minutesToEnd = Math.round(
                  (end.getTime() - businessStart.getTime()) / 60000,
                );
                if (!Number.isFinite(minutesFromStart) || !Number.isFinite(minutesToEnd)) return;
                const endBound = Math.max(minutesToEnd, minutesFromStart + slotStepMinutes);
                for (let m = minutesFromStart; m < endBound; m += slotStepMinutes) {
                  nextSlots[buildHappyHourKey(businessStart, m)] = true;
                }
              },
            );
            setHappyHourSlots(nextSlots);
          } else {
            setHappyHourSlots({});
          }
        } else {
          setHappyHourSlots({});
        }
      } catch (err) {
        console.error(err);
        setCalendarError("Takvim blokları alınamadı.");
        setCalendarBlocks([]);
        setHappyHourSlots({});
      } finally {
        setCalendarLoading(false);
      }
    };

    void loadBlocks();
  }, [
    calendarView,
    calendarRoomScope,
    calendarRoomIds,
    happyHourRoomId,
    buildHappyHourKey,
    happyHourScheduleVersion,
    selectedDate,
    weekCursor,
    monthCursor,
    dayCutoffHour,
    studio,
  ]);

  const updateBasicField = <K extends keyof BasicInfoForm>(key: K, value: BasicInfoForm[K]) => {
    setBasicTouched(true);
    setBasicForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBasicArray = <K extends "contactMethods" | "roomTypes">(
    key: K,
    value: BasicInfoForm[K][number],
  ) => {
    setBasicTouched(true);
    setBasicForm((prev) => {
      const current = prev[key] as string[];
      const exists = current.includes(value as string);
      const next = exists ? current.filter((v) => v !== value) : [...current, value as string];
      return { ...prev, [key]: next } as BasicInfoForm;
    });
  };

  const toggleEquipment = (key: keyof BasicInfoForm["equipment"]) => {
    setBasicTouched(true);
    setBasicForm((prev) => ({
      ...prev,
      equipment: { ...prev.equipment, [key]: !prev.equipment[key] },
    }));
  };

  const ImagesBlock = () => {
    if (!currentRoom) return null;
    return (
      <>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:border-blue-400"
          >
            Görsel ekle
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            await uploadImages(files);
            e.target.value = "";
          }}
        />
        {currentRoom.images?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {currentRoom.images.map((src, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <img
                  src={src}
                  alt={`Oda görsel ${idx + 1}`}
                  className="h-36 w-full cursor-pointer object-cover transition hover:opacity-90"
                  onClick={() => setPreviewImage(src)}
                />
                <div className="flex flex-col gap-1 px-2 py-1 text-[11px] text-gray-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-900">
                      {idx === 0 ? "Kapak" : `Görsel ${idx + 1}`}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, idx - 1)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-800 transition enabled:hover:border-blue-400 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={idx === (currentRoom.images?.length ?? 0) - 1}
                        onClick={() => moveImage(idx, idx + 1)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-800 transition enabled:hover:border-blue-400 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, 0)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-800 transition enabled:hover:border-blue-400 disabled:opacity-50"
                      >
                        Kapak yap
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">Sırayı değiştirebilirsiniz</span>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        if (!currentRoom) return;
                        const next = (currentRoom.images ?? []).filter((_, i) => i !== idx);
                        await persistImages(next, "Görsel silindi");
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">Henüz görsel eklenmedi.</p>
        )}
      </>
    );
  };

  const CoursesBlock = () => {
    if (!currentRoom) return null;
    return (
      <>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setStudio((prev) =>
                  prev
                    ? {
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === currentRoom.id
                            ? { ...r, extras: { ...r.extras, acceptsCourses: true } }
                            : r,
                        ),
                      }
                    : prev,
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                currentRoom.extras?.acceptsCourses ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              Evet
            </button>
            <button
              type="button"
              onClick={() =>
                setStudio((prev) =>
                  prev
                    ? {
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === currentRoom.id
                            ? { ...r, extras: { ...r.extras, acceptsCourses: false } }
                            : r,
                        ),
                      }
                    : prev,
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                currentRoom.extras?.acceptsCourses ? "bg-gray-200 text-gray-800" : "bg-red-100 text-red-800"
              }`}
            >
              Hayır
            </button>
          </div>
        </div>
        <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          Kurslara açığız derseniz Hocalarımız sizinle iletişime geçecektir. Buradaki amacımız yetenekli olup
          da ders verecek odası olmayan müzisyenlerimizi, stüdyolarının boş vakitlerini doldurmaya çalışan siz
          stüdyo sahipleriyle buluşturmak. Bizim önerimiz: <strong>Hocalarımıza normal ücret üzerinden %20 indirim uygulanması.</strong> Tabi tercih sizin.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            saveRoomBasics(currentRoom.id, {
              name: currentRoom.name,
              type: currentRoom.type,
              color: currentRoom.color,
              pricing: currentRoom.pricing,
              extras: { ...currentRoom.extras, acceptsCourses: currentRoom.extras?.acceptsCourses ?? false },
            })
          }
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kurs ayarını kaydet"}
        </button>
      </>
    );
  };

  useEffect(() => {
    if (!orderedRooms.length) return;
    const exists = orderedRooms.some((r) => r.id === selectedRoomId);
    if (!exists) {
      setSelectedRoomId(orderedRooms[0].id);
      setActiveTab(`room-${orderedRooms[0].id}`);
    }
  }, [orderedRooms, selectedRoomId]);

  useEffect(() => {
    if (!orderedRooms.length) return;
    if (calendarRoomScope === "all") return;
    if (calendarRoomScope !== selectedRoomId) {
      setCalendarRoomScope(selectedRoomId);
    }
  }, [calendarRoomScope, orderedRooms.length, selectedRoomId]);

  useEffect(() => {
    if (orderedRooms.length > 1) return;
    if (calendarRoomScope === "all") {
      setCalendarRoomScope(selectedRoomId || orderedRooms[0]?.id || "");
    }
  }, [calendarRoomScope, orderedRooms, selectedRoomId]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key.startsWith("room-")) {
      const id = key.replace("room-", "");
      setSelectedRoomId(id);
    }
    if (key === "calendar") {
      setCalendarView("week");
    }
  };

  const handleDaySelect = (day: Date) => {
    if (!currentRoom) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((room) => {
              if (room.id !== currentRoom.id) return room;
              return ensureSlotsForDay(room, day, effectiveOpeningHours);
            }),
          }
        : prev,
    );
    setSelectedDate(day);
    setCalendarView("day");
  };

  const handleCalendarViewChange = (view: CalendarView) => {
    setCalendarView(view);
    if (view === "week" && selectedDate) {
      setWeekCursor(selectedDate);
    }
    if (view === "day" && !selectedDate) {
      setSelectedDate(new Date());
    }
  };

  const openDrawerForRange = (day: Date, startMinutes: number, endMinutes: number) => {
    if (!currentRoom) return;
    const start = Math.min(startMinutes, endMinutes);
    const end = Math.max(startMinutes, endMinutes);
    setDrawerData({
      day,
      roomId: currentRoom.id,
      startMinutes: start,
      endMinutes: end,
      type: "reservation",
      title: "",
      status: "approved",
      note: "",
    });
    setDrawerOpen(true);
  };

  const openDrawerForBlock = (day: Date, block: CalendarBlock) => {
    const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const startAt = new Date(block.startAt);
    const endAt = new Date(block.endAt);
    const startMinutes = Math.round((startAt.getTime() - base.getTime()) / 60000);
    const endMinutes = Math.round((endAt.getTime() - base.getTime()) / 60000);
    setDrawerData({
      id: block.id,
      day,
      roomId: block.roomId,
      startMinutes,
      endMinutes,
      type: block.type,
      title: block.title ?? "",
      status: block.status ?? "pending",
      note: block.note ?? "",
    });
    setDrawerOpen(true);
  };

  const toggleHappyHourSlot = async (day: Date, minutes: number, active: boolean) => {
    if (!happyHourRoomId) return;
    setCalendarError(null);
    const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const startAt = addMinutes(base, minutes);
    const endAt = addMinutes(base, minutes + slotStepMinutes);
    const key = buildHappyHourKey(day, minutes);
    const prevValue = !!happyHourSlots[key];
    setHappyHourSlots((prev) => ({ ...prev, [key]: active }));
    try {
      const res = await fetch("/api/studio/happy-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: happyHourRoomId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          active,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setCalendarError(json.error || "Happy hour kaydedilemedi.");
        setHappyHourSlots((prev) => ({ ...prev, [key]: prevValue }));
      }
    } catch (err) {
      console.error(err);
      setCalendarError("Happy hour kaydedilemedi.");
      setHappyHourSlots((prev) => ({ ...prev, [key]: prevValue }));
    }
  };

  const setHappyHourEnabled = async (next: boolean) => {
    const prev = happyHourActive;
    setHappyHourActive(next);
    setCalendarError(null);
    try {
      const res = await fetch("/api/studio/calendar-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ happyHourEnabled: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.settings) {
        setHappyHourActive(prev);
        setCalendarError(json.error || "Happy hour kaydedilemedi.");
        return;
      }
      const settings = json.settings as CalendarSettings;
      setCalendarSettings((prevSettings) =>
        prevSettings ? { ...prevSettings, happyHourEnabled: settings.happyHourEnabled } : prevSettings,
      );
      setCalendarDraft((prevDraft) =>
        prevDraft ? { ...prevDraft, happyHourEnabled: settings.happyHourEnabled } : prevDraft,
      );
    } catch (err) {
      console.error(err);
      setHappyHourActive(prev);
      setCalendarError("Happy hour kaydedilemedi.");
    }
  };

  const saveHappyHourSchedule = useCallback(async () => {
    if (!happyHourRoomId) {
      setHappyHourStatus("Oda seçilmedi.");
      return;
    }
    const invalid = happyHourDays.find(
      (day) => day.enabled && parseTimeToMinutes(day.endTime) === null,
    );
    if (invalid) {
      setHappyHourStatus("Saat formatı geçersiz.");
      return;
    }
    const payload = {
      roomId: happyHourRoomId,
      days: happyHourDays.map((day, idx) => ({
        weekday: idx,
        enabled: day.enabled,
        endTime: day.endTime,
      })),
    };
    setHappyHourSaving(true);
    setHappyHourStatus(null);
    try {
      const res = await fetch("/api/studio/happy-hours/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHappyHourStatus(json.error || "Happy Hour kaydedilemedi.");
      } else {
        setHappyHourStatus("Happy Hour kaydedildi.");
        setHappyHourScheduleVersion((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
      setHappyHourStatus("Happy Hour kaydedilemedi.");
    } finally {
      setHappyHourSaving(false);
    }
  }, [happyHourDays, happyHourRoomId]);

  useEffect(() => {
    if (!happyHourTouched || !happyHourRoomId || happyHourSaving) return;
    const timer = setTimeout(() => {
      void saveHappyHourSchedule();
    }, 600);
    return () => clearTimeout(timer);
  }, [happyHourDays, happyHourTouched, happyHourRoomId, happyHourSaving, saveHappyHourSchedule]);

  const saveCalendarBlock = async () => {
    if (!drawerData || !currentRoom) return;
    const base = new Date(drawerData.day.getFullYear(), drawerData.day.getMonth(), drawerData.day.getDate());
    const startAt = addMinutes(base, drawerData.startMinutes);
    const endAt = addMinutes(base, drawerData.endMinutes);
    setCalendarError(null);
    try {
      const payload = {
        roomId: drawerData.roomId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        type: drawerData.type,
        title: drawerData.title,
        status: drawerData.type === "reservation" ? drawerData.status : null,
        note: drawerData.note,
      };
      const res = await fetch(
        drawerData.id ? `/api/studio/calendar-blocks/${drawerData.id}` : "/api/studio/calendar-blocks",
        {
          method: drawerData.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCalendarError(json.error || "Kaydedilemedi.");
        return;
      }
      const block = (json.block ?? json) as CalendarBlock;
      setCalendarBlocks((prev) => {
        const filtered = prev.filter((item) => item.id !== block.id);
        return [...filtered, block].sort((a, b) => a.startAt.localeCompare(b.startAt));
      });
      setDrawerOpen(false);
      setDrawerData(null);
    } catch (err) {
      console.error(err);
      setCalendarError("Kaydedilemedi.");
    }
  };

  const deleteCalendarBlock = async () => {
    if (!drawerData?.id) return;
    setCalendarError(null);
    try {
      const res = await fetch(`/api/studio/calendar-blocks/${drawerData.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setCalendarError(json.error || "Silinemedi.");
        return;
      }
      setCalendarBlocks((prev) => prev.filter((item) => item.id !== drawerData.id));
      setDrawerOpen(false);
      setDrawerData(null);
    } catch (err) {
      console.error(err);
      setCalendarError("Silinemedi.");
    }
  };

  const updateSlot = (
    index: number,
    patch: Partial<Slot>,
    date: Date | null,
  ) => {
    if (!currentRoom || !date || !studio) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((room) => {
              if (room.id !== currentRoom.id) return room;
              const roomWithSlots = ensureSlotsForDay(
                room,
                date,
                effectiveOpeningHours,
              );
              const key = formatKey(date);
              const updatedSlots = roomWithSlots.slots[key].map((slot, i) =>
                i === index ? { ...slot, ...patch } : slot,
              );
              return {
                ...roomWithSlots,
                slots: { ...roomWithSlots.slots, [key]: updatedSlots },
              };
            }),
          }
        : prev,
    );
  };

  const updateSlotAndPersist = async (
    index: number,
    patch: Partial<Slot>,
    date: Date | null,
  ) => {
    if (!currentRoom || !date) return;
    updateSlot(index, patch, date);
    try {
      await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: currentRoom.id,
          date: formatKey(date),
          timeLabel: slotList[index]?.timeLabel,
          status: patch.status,
          name: patch.name,
        }),
      });
    } catch (e) {
      console.error("Slot save failed", e);
      setStatus("Slot kaydedilemedi");
    }
  };

  const persistRoomOrder = async (ordered: Room[]) => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: ordered.map((r) => ({ id: r.id, order: r.order ?? 0 })),
        }),
      });
      let json: { studio?: Studio | null; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        // Ignore parse errors; treat empty body as ok
        json = null;
      }
      if (res.ok) {
        if (json?.studio) {
          setStudio(normalizeStudio(json.studio));
        }
        setStatus("Oda sırası kaydedildi");
      } else {
        const text = json?.error ?? (await res.text().catch(() => "")) ?? "";
        setStatus(text || `Kaydedilemedi (status ${res.status})`);
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const saveStudioMeta = async (data: {
    name?: string;
    city?: string;
    district?: string;
    address?: string;
    phone?: string;
    openingHours?: OpeningHours[];
  }) => {
    if (!studio) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio: data }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        setStudio(normalizeStudio(json.studio));
        if (data.openingHours) {
          setHoursDraft(normalizeOpeningHours(data.openingHours));
        }
        setStatus("Kaydedildi");
      } else {
        setStatus(json.error || "Kaydedilemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const saveCalendarSettings = async () => {
    if (!studio || !calendarDraft) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio/calendar-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStepMinutes: calendarDraft.slotStepMinutes,
          dayCutoffHour: calendarDraft.dayCutoffHour,
          timezone: calendarDraft.timezone,
          happyHourEnabled: calendarDraft.happyHourEnabled,
          weeklyHours: hoursDraft,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.settings) {
        const settings = json.settings as CalendarSettings;
        setCalendarSettings({
          ...settings,
          weeklyHours: normalizeOpeningHours(settings.weeklyHours),
        });
        setCalendarDraft({
          ...settings,
          weeklyHours: normalizeOpeningHours(settings.weeklyHours),
        });
        setHappyHourActive(!!settings.happyHourEnabled);
        setStudio((prev) =>
          prev ? { ...prev, openingHours: normalizeOpeningHours(settings.weeklyHours) } : prev,
        );
        setStatus("Takvim ayarları kaydedildi");
      } else {
        setStatus(json.error || "Kaydedilemedi");
      }
    } catch (err) {
      console.error(err);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const saveBasicInfo = async () => {
    if (!studio) return;
    setBasicSaving(true);
    setBasicStatus(null);
    try {
      const cleanedPhone = basicForm.phone.replace(/\D/g, "");
      const fullAddress = basicForm.neighborhood
        ? `${basicForm.neighborhood} - ${basicForm.address}`.trim()
        : basicForm.address.trim();
      const payload = {
        ...basicForm,
        phone: cleanedPhone,
        roomsCount: Number(basicForm.roomsCount) || 1,
      };
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studio: {
            name: payload.studioName,
            city: payload.city,
            district: payload.district,
            address: fullAddress,
            phone: payload.phone,
          },
          application: payload,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.studio) {
        setStudio(normalizeStudio(json.studio));
        setBasicForm(parseBasicInfoFromStudio(json.studio));
        setBasicTouched(false);
        setBasicStatus("Kaydedildi");
      } else {
        setBasicStatus(json?.error || "Kaydedilemedi");
      }
    } catch (err) {
      console.error(err);
      setBasicStatus("Kaydedilemedi");
    } finally {
      setBasicSaving(false);
    }
  };

  const saveRoomBasics = async (roomId: string, patch: Partial<Room>) => {
    if (!studio) return;
    const existingRoom = studio.rooms.find((room) => room.id === roomId);
    const mergedPricing =
      patch.pricing || existingRoom?.pricing
        ? { ...(existingRoom?.pricing ?? {}), ...(patch.pricing ?? {}) }
        : undefined;
    const model = mergedPricing?.model ?? existingRoom?.pricing?.model;
    const baseRate =
      model === "daily"
        ? parsePriceValue(mergedPricing?.dailyRate ?? existingRoom?.pricing?.dailyRate) ??
          parsePriceValue(mergedPricing?.hourlyRate ?? existingRoom?.pricing?.hourlyRate)
        : model === "hourly"
          ? parsePriceValue(mergedPricing?.hourlyRate ?? existingRoom?.pricing?.hourlyRate) ??
            parsePriceValue(mergedPricing?.dailyRate ?? existingRoom?.pricing?.dailyRate)
          : model === "flat"
            ? parsePriceValue(mergedPricing?.flatRate ?? existingRoom?.pricing?.flatRate)
            : parsePriceValue(mergedPricing?.minRate ?? existingRoom?.pricing?.minRate);
    const happyRate = parsePriceValue(mergedPricing?.happyHourRate ?? existingRoom?.pricing?.happyHourRate);
    if (happyRate !== null && baseRate !== null && happyRate >= baseRate * 0.9) {
      setStatus("Happy Hour minimum %10 olmalıdır.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: [
            {
              id: roomId,
              name: patch.name,
              type: patch.type,
              color: patch.color,
              pricing: mergedPricing,
              equipment: patch.equipment,
              extras: patch.extras,
              features: patch.features,
              images: patch.images,
              order: patch.order,
            },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        setStudio(normalizeStudio(json.studio));
        setStatus("Kaydedildi");
      } else {
        setStatus(json.error || "Kaydedilemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const addRoom = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const existingPayload = buildRoomsPayload(orderedRooms);
      const newRoomOrder = orderedRooms.length;
      const nextColor = pickNextColor(orderedRooms);
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: [
            ...existingPayload,
            {
              name: `Yeni Oda ${studioRooms.length + 1}`,
              type: "Prova odası",
              color: nextColor,
              order: newRoomOrder,
              pricing: { model: "flat", flatRate: "" },
              equipment: defaultEquipment,
              features: defaultFeatures,
              extras: defaultExtras,
              images: [],
            },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        const normalized = normalizeStudio(json.studio);
        setStudio(normalized);
        if (normalized?.rooms?.length) {
          const newest =
            [...normalized.rooms].sort(
              (a, b) => (b.order ?? 0) - (a.order ?? 0) || b.name.localeCompare(a.name),
            )[0] ?? normalized.rooms[normalized.rooms.length - 1];
          setSelectedRoomId(newest.id);
          setActiveTab(`room-${newest.id}`);
        }
        setStatus("Yeni oda eklendi");
      } else {
        setStatus(json.error || "Oda eklenemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Oda eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!studio) return;
    const run = async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch("/api/studio/calendar-summary");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || "Özet alınamadı");
        }
        const data = json.summary as {
          weekOccupancy: number;
          monthOccupancy: number;
          monthRevenue: number;
        };
        setCalendarSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSummaryLoading(false);
      }
    };
    run();
  }, [studio?.id]);

  const buildRoomsPayload = (rooms: Room[]) =>
    rooms.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      color: r.color,
      order: r.order ?? 0,
      pricing: r.pricing,
      equipment: r.equipment ?? defaultEquipment,
      features: r.features ?? defaultFeatures,
      extras: { ...defaultExtras, ...(r.extras ?? {}) },
      images: r.images ?? [],
    }));

  const startOfMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth(),
    1,
  );
  const startOffset = weekdayIndex(startOfMonth);
  const daysInMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth() + 1,
    0,
  ).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const slotList = (() => {
    if (!currentRoom || !selectedDate || !studio) return [];
    const key = formatKey(selectedDate);
    const withSlots = ensureSlotsForDay(currentRoom, selectedDate, effectiveOpeningHours);
    return withSlots.slots[key] || [];
  })();
  const selectedDayStart = selectedDate
    ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : null;
  const selectedDayRange = selectedDayStart ? getDayRange(selectedDayStart, dayCutoffHour) : null;
  const selectedBlocks = selectedDayStart
    ? calendarBlocks.filter((block) => {
        const start = new Date(block.startAt);
        const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
        return businessStart.getTime() === selectedDayStart.getTime();
      })
    : [];
  const selectedBlockMinutes =
    selectedDayStart && selectedDayRange
      ? selectedBlocks.reduce((acc, block) => {
          const status = (block.status ?? "").toLowerCase();
          if (block.type === "reservation" && status !== "approved" && status !== "onaylı") {
            return acc;
          }
          const start = new Date(block.startAt).getTime();
          const end = new Date(block.endAt).getTime();
          const clampedStart = Math.max(start, selectedDayRange.start.getTime());
          const clampedEnd = Math.min(end, selectedDayRange.end.getTime());
          const diff = Math.max(0, clampedEnd - clampedStart);
          return acc + diff / 60000;
        }, 0)
      : 0;
  const selectedSlotHours = slotList.filter((slot) => slot.status === "confirmed").length;
  const selectedFilledHours =
    selectedBlocks.length > 0 ? selectedBlockMinutes / 60 : selectedSlotHours;
  const selectedFilledLabel =
    Number.isInteger(selectedFilledHours) ? String(selectedFilledHours) : selectedFilledHours.toFixed(1);
  const formatPercent = (value: number) =>
    Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString("tr-TR")} TL`;
  const weekOccupancy = calendarSummary?.weekOccupancy ?? 0;
  const monthOccupancy = calendarSummary?.monthOccupancy ?? 0;
  const monthRevenue = calendarSummary?.monthRevenue ?? 0;

  const getFilledHoursForDay = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const range = getDayRange(dayStart, dayCutoffHour);
    const minutes = calendarBlocks.reduce((acc, block) => {
      const start = new Date(block.startAt);
      const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
      if (businessStart.getTime() !== dayStart.getTime()) return acc;
      const status = (block.status ?? "").toLowerCase();
      if (block.type === "reservation" && status !== "approved" && status !== "onaylı") {
        return acc;
      }
      const end = new Date(block.endAt);
      const clampedStart = Math.max(start.getTime(), range.start.getTime());
      const clampedEnd = Math.min(end.getTime(), range.end.getTime());
      const diff = Math.max(0, clampedEnd - clampedStart);
      return acc + diff / 60000;
    }, 0);
    if (minutes <= 0) return 0;
    const hours = minutes / 60;
    return Number.isInteger(hours) ? Number(hours.toFixed(0)) : Number(hours.toFixed(1));
  };


  if (!studio) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
        Studio verisi yüklenemedi.
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-b from-white via-blue-50/40 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {status && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {status}
            </div>
          )}
          <nav className="mb-6 flex flex-wrap gap-2">
            {[
              { key: "panel", label: "Panel" },
              { key: "calendar", label: "Takvim" },
              ...orderedRooms.map((r) => ({ key: `room-${r.id}`, label: r.name || "Oda" })),
            ].map((item) => (
              <button
                key={item.key}
                draggable={item.key.startsWith("room-")}
                onDragStart={() => {
                  if (item.key.startsWith("room-")) setDragRoomId(item.key.replace("room-", ""));
                }}
                onDragOver={(e) => {
                  if (!item.key.startsWith("room-")) return;
                  e.preventDefault();
                }}
                onDrop={() => {
                  if (!item.key.startsWith("room-")) return;
                  const targetId = item.key.replace("room-", "");
                  if (!dragRoomId || dragRoomId === targetId) return;
                  const newOrder = [...orderedRooms];
                  const from = newOrder.findIndex((r) => r.id === dragRoomId);
                  const to = newOrder.findIndex((r) => r.id === targetId);
                  if (from === -1 || to === -1) return;
                  const [moved] = newOrder.splice(from, 1);
                  newOrder.splice(to, 0, moved);
                  const withOrder = newOrder.map((r, idx) => ({ ...r, order: idx }));
                  setStudio((prev) => (prev ? { ...prev, rooms: withOrder } : prev));
                  persistRoomOrder(withOrder);
                  setDragRoomId(null);
                }}
                onDragEnd={() => setDragRoomId(null)}
                onClick={() => handleTabChange(item.key)}
                className={`rounded-full border px-5 py-2.5 text-base font-semibold transition ${
                  activeTab === item.key
                    ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                    : "border-blue-100 bg-white text-gray-800 hover:border-blue-200"
                }`}
              >
                {item.key.startsWith("room-") && (
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-full border border-white/70"
                    style={{
                      backgroundColor:
                        orderedRooms.find((r) => `room-${r.id}` === item.key)?.color ?? "#1D4ED8",
                    }}
                    aria-hidden
                  />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
            <button
              onClick={addRoom}
              className="rounded-full border border-dashed border-gray-200 px-5 py-2.5 text-base font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
            >
              + Oda ekle
            </button>
          </nav>

        {activeTab === "panel" && (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-blue-900">Rezervasyon özeti</p>
                <Link
                  href="/dashboard/reservation-stats?as=studio"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#9A3412] text-[#9A3412] transition hover:border-[#7C2D12] hover:text-[#7C2D12]"
                  aria-label="Rezervasyon istatistikleri"
                  title="Rezervasyon istatistikleri"
                >
                  <BarChart3 className="h-6 w-6 text-[#9A3412] stroke-[#9A3412]" />
                </Link>
              </div>
              <div className="mt-2 space-y-1 text-sm text-blue-800">
                <p>
                  Bu haftaki doluluk:{" "}
                  {summaryLoading ? "Hesaplanıyor..." : formatPercent(weekOccupancy)}
                </p>
                <p>
                  Bu ayki doluluk:{" "}
                  {summaryLoading ? "Hesaplanıyor..." : formatPercent(monthOccupancy)}
                </p>
                <p>
                  Tahmini aylık gelir:{" "}
                  {summaryLoading ? "Hesaplanıyor..." : formatCurrency(monthRevenue)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-blue-900">Onay yöntemi</p>
                <div className="group relative inline-flex items-center">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 text-[10px] font-semibold text-blue-700">
                    i
                  </span>
                  <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs text-blue-900 opacity-0 shadow-lg transition group-hover:opacity-100">
                    Talep otomatik onaylanır olarak seçtiğinizde, müzisyenler Studyom üzerinden sizinle hiç iletişime geçmeden bir odanızın bir saatini kapatabilirler. Whatsapp ve Mail üzerinden bilgilendirilirsiniz.
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm text-blue-900">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="booking-approval"
                    className="h-3.5 w-3.5"
                    defaultChecked
                    disabled
                  />
                  <span>Talebi ben onaylarım</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="booking-approval"
                    className="h-3.5 w-3.5"
                    disabled
                  />
                  <span>Talep otomatik onaylanır</span>
                </label>
              </div>
              <p className="mt-3 text-xs text-blue-700">Rezervasyon ayarları yakında aktif olacaktır.</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p className="text-sm font-semibold text-blue-900">Rezervasyon istekleri</p>
              {studio.notifications.filter((n) => /rezervasyon|talep/i.test(n)).length ? (
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  {studio.notifications
                    .filter((n) => /rezervasyon|talep/i.test(n))
                    .slice(0, 3)
                    .map((n, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>{n}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-blue-700">Henüz rezervasyon isteği yok.</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Açılış saatleri</p>
                  <p className="text-xs text-gray-600">
                    Tüm odalar için geçerli. Kapalı günler kırmızı görünür.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (editingHours) {
                        if (calendarSettings) {
                          setCalendarDraft(calendarSettings);
                          setHoursDraft(calendarSettings.weeklyHours);
                        }
                      }
                      setEditingHours((v) => !v);
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                  >
                    {editingHours ? "İptal" : "Saatleri düzenle"}
                  </button>
                  {editingHours && (
                    <button
                      disabled={saving}
                      onClick={saveCalendarSettings}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  )}
                </div>
                {studio.calendarNote && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {studio.calendarNote}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {(editingHours ? hoursDraft : effectiveOpeningHours).map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm ${
                      h.open
                        ? "border-gray-100 bg-gray-50 text-gray-900"
                        : "border-red-100 bg-red-50 text-red-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{longDays[idx]}</span>
                      {editingHours ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={h.open}
                            onChange={(e) =>
                              setHoursDraft((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, open: e.target.checked } : item,
                                ),
                              )
                            }
                          />
                          Açık
                        </label>
                      ) : (
                        <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
                      )}
                    </div>
                    {editingHours && h.open && (
                      <div className="flex items-center gap-2 text-xs">
                        <select
                          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1"
                          value={h.openTime}
                          onChange={(e) => {
                            const nextOpen = e.target.value;
                            const nextOptions = buildEndTimeOptions(nextOpen, dayCutoffHour);
                            setHoursDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      openTime: nextOpen,
                                      closeTime: nextOptions.includes(item.closeTime)
                                        ? item.closeTime
                                        : nextOptions[0],
                                    }
                                  : item,
                              ),
                            );
                          }}
                        >
                          {hourOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <span>-</span>
                        <select
                          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1"
                          value={h.closeTime}
                          onChange={(e) =>
                            setHoursDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, closeTime: e.target.value } : item,
                              ),
                            )
                          }
                        >
                          {buildEndTimeOptions(h.openTime, dayCutoffHour).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {!editingHours && (
                      <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Blok süresi</p>
                  <select
                    value={calendarDraft?.slotStepMinutes ?? slotStepMinutes}
                    onChange={(e) =>
                      setCalendarDraft((prev) => ({
                        ...(prev ?? {
                          slotStepMinutes,
                          dayCutoffHour,
                          timezone: "Europe/Istanbul",
                          weeklyHours: hoursDraft,
                        }),
                        slotStepMinutes: Number(e.target.value),
                      }))
                    }
                    disabled={!editingHours}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none disabled:opacity-60"
                  >
                    {slotStepOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} dk
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">İş günü bitişi</p>
                  <select
                    value={calendarDraft?.dayCutoffHour ?? dayCutoffHour}
                    onChange={(e) =>
                      setCalendarDraft((prev) => ({
                        ...(prev ?? {
                          slotStepMinutes,
                          dayCutoffHour,
                          timezone: "Europe/Istanbul",
                          weeklyHours: hoursDraft,
                        }),
                        dayCutoffHour: Number(e.target.value),
                      }))
                    }
                    disabled={!editingHours}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-400 focus:outline-none disabled:opacity-60"
                  >
                    {cutoffHourOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {pad(opt)}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p className="text-sm font-semibold text-blue-900">Stüdyo Kapak Görseli</p>
              <p className="mt-2 text-sm text-blue-800">
                Stüdyo arayanlar kapak olarak bu görseli görecekler.
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Tek foto, max 5 MB. Yatay olması önerilir.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white/80">
                {studio?.coverImageUrl ? (
                  <img
                    src={studio.coverImageUrl}
                    alt="Stüdyo kapak görseli"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-blue-700">
                    Henüz kapak görseli eklenmedi
                  </div>
                )}
              </div>
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {coverUploading ? "Yükleniyor..." : "Kapak görseli yükle"}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverStatus && (
                <p className="mt-2 text-xs text-blue-800">{coverStatus}</p>
              )}
              <p className="mt-2 text-xs text-blue-700">
                Buraya yüklenen fotoğraf, Stüdyo arama kısmındaki önizlemede kapak olarak kullanılacak.
              </p>
            </div>

            <div
              className={`rounded-2xl border border-amber-200 bg-amber-100/80 p-2 lg:col-span-3 ${
                happyHourOpen ? "" : "min-h-[86px] flex flex-col justify-center"
              }`}
            >
              <button
                type="button"
                onClick={() => setHappyHourOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="pl-4">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">Happy Hour</p>
                    <HappyHourIcon className="h-[5.1rem] w-[5.1rem] text-amber-900" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-900">
                  {happyHourOpen ? "Gizle" : "Göster"}
                </span>
              </button>
              {happyHourOpen && (
                <div className="mt-2 space-y-2 text-xs text-amber-900">
                  <p className="text-xs text-amber-800">
                    Happy Hour fiyatlandırması oda fiyatlandırmasındadır.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-900">Happy Hour günleri ve saatleri</p>
                    <div className="space-y-2">
                      {longDays.map((day, idx) => {
                        const row = happyHourDays[idx];
                        return (
                          <div
                            key={day}
                            className="flex flex-col gap-2 rounded-lg border border-amber-200/70 bg-white/70 px-3 py-2 sm:flex-row sm:items-center"
                          >
                            <label className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                              <input
                                type="checkbox"
                                checked={row?.enabled ?? false}
                                onChange={(e) =>
                                  setHappyHourDays((prev) => {
                                    setHappyHourTouched(true);
                                    return prev.map((item, index) =>
                                      index === idx ? { ...item, enabled: e.target.checked } : item,
                                    );
                                  })
                                }
                                className="h-4 w-4 rounded border border-amber-400/60 bg-white text-amber-700 focus:ring-2 focus:ring-amber-500"
                              />
                              {day}
                            </label>
                            {row?.enabled && (
                              <label className="flex items-center gap-2 text-xs text-amber-900 sm:ml-auto">
                                <span>Saat kaça kadar?</span>
                                <select
                                  value={row.endTime}
                                  onChange={(e) =>
                                    setHappyHourDays((prev) => {
                                      setHappyHourTouched(true);
                                      return prev.map((item, index) =>
                                        index === idx ? { ...item, endTime: e.target.value } : item,
                                      );
                                    })
                                  }
                                  className="h-8 rounded-lg border border-amber-200/80 bg-white px-2 text-xs font-semibold text-amber-900 focus:border-amber-400 focus:outline-none"
                                >
                                  {hourOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={saveHappyHourSchedule}
                      disabled={happyHourSaving}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                    >
                      {happyHourSaving ? "Kaydediliyor..." : "Günleri kaydet"}
                    </button>
                    {happyHourStatus && (
                      <span className="text-xs text-amber-900">{happyHourStatus}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-amber-900">
                    Durum: {happyHourActive ? "Aktif" : "Kapalı"}
                  </p>
                  <p className="text-xs font-semibold text-amber-900">Happy Hour aktifleştir</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setHappyHourEnabled(true)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Aktifleştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setHappyHourEnabled(false)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              )}
            </div>
            </section>

            <section className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Temel bilgiler</p>
                  <p className="text-xs text-gray-600">
                    Başvurudaki bilgileri buradan düzenleyebilirsin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBasicInfo((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                  >
                    {showBasicInfo ? "Gizle" : "Düzenle"}
                    <ChevronDown
                      className={`h-4 w-4 transition ${showBasicInfo ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasicUnlocked((prev) => !prev)}
                    aria-pressed={basicUnlocked}
                    aria-label={basicUnlocked ? "Düzenlemeyi kilitle" : "Düzenlemeyi aç"}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      basicUnlocked
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 text-gray-800 hover:border-blue-300"
                    }`}
                  >
                    <Key className="h-4 w-4" aria-hidden />
                  </button>
                  {showBasicInfo && (
                    <button
                      onClick={saveBasicInfo}
                      disabled={basicSaving || !basicUnlocked}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {basicSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  )}
                </div>
              </div>

              {showBasicInfo && (
                <>
                  {basicStatus && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
                      {basicStatus}
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Stüdyo adı
                      <input
                        value={basicForm.studioName}
                        onChange={(e) => updateBasicField("studioName", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Telefon
                      <input
                        value={basicForm.phone}
                        onChange={(e) => updateBasicField("phone", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Şehir
                      <input
                        value={basicForm.city}
                        onChange={(e) => updateBasicField("city", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      İlçe
                      <input
                        value={basicForm.district}
                        onChange={(e) => updateBasicField("district", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Mahalle
                      <input
                        value={basicForm.neighborhood}
                        onChange={(e) => updateBasicField("neighborhood", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700 md:col-span-2">
                      Açık adres
                      <textarea
                        value={basicForm.address}
                        onChange={(e) => updateBasicField("address", e.target.value)}
                        rows={3}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700 md:col-span-2">
                      Google Maps linki
                      <input
                        value={basicForm.mapsUrl}
                        onChange={(e) => updateBasicField("mapsUrl", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">İletişim tercihleri</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                        {contactMethodOptions.map((method) => (
                          <label key={method} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={basicForm.contactMethods.includes(method)}
                              onChange={() => toggleBasicArray("contactMethods", method)}
                              disabled={!basicUnlocked}
                            />
                            {contactMethodLabels[method]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      İletişim saatleri
                      <input
                        value={basicForm.contactHours}
                        onChange={(e) => updateBasicField("contactHours", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Oda sayısı
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={basicForm.roomsCount}
                        onChange={(e) =>
                          updateBasicField("roomsCount", Math.max(1, Number(e.target.value) || 1))
                        }
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">Oda tipleri</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                        {roomTypeOptions.map((room) => (
                          <label key={room} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={basicForm.roomTypes.includes(room)}
                              onChange={() => toggleBasicArray("roomTypes", room)}
                              disabled={!basicUnlocked}
                            />
                            {room}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Booking modu
                      <select
                        value={basicForm.bookingMode}
                        onChange={(e) => updateBasicField("bookingMode", e.target.value as BookingMode)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      >
                        {bookingModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">Ekipman setleri</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                        {Object.keys(equipmentLabels).map((key) => (
                          <label key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={basicForm.equipment[key as keyof BasicInfoForm["equipment"]]}
                              onChange={() => toggleEquipment(key as keyof BasicInfoForm["equipment"])}
                              disabled={!basicUnlocked}
                            />
                            {equipmentLabels[key as keyof BasicInfoForm["equipment"]]}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Öne çıkan ekipman
                      <input
                        value={basicForm.equipmentHighlight}
                        onChange={(e) => updateBasicField("equipmentHighlight", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <div className="space-y-2">
                      <label className="flex flex-col gap-2 text-sm text-gray-700">
                        Fiyat aralığı
                        <select
                          value={basicForm.priceRange}
                          onChange={(e) => updateBasicField("priceRange", e.target.value as PriceRange)}
                          disabled={!basicUnlocked}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                        >
                          {priceRanges.map((range) => (
                            <option key={range} value={range}>
                              {range}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={basicForm.priceVaries}
                          onChange={() => updateBasicField("priceVaries", !basicForm.priceVaries)}
                          disabled={!basicUnlocked}
                        />
                        Fiyatlar odaya göre değişir
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Instagram / Web
                      <input
                        value={basicForm.linkPortfolio}
                        onChange={(e) => updateBasicField("linkPortfolio", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                      Google işletme linki
                      <input
                        value={basicForm.linkGoogle}
                        onChange={(e) => updateBasicField("linkGoogle", e.target.value)}
                        disabled={!basicUnlocked}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                      />
                    </label>
                  </div>
                </>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Hocalarım</p>
                  <p className="text-xs text-gray-600">Bağlı hocalar burada listelenir.</p>
                </div>
              </div>

              {teacherLinks.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">Henüz bağlı hoca yok.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teacherLinks.map((teacher) => {
                    const initial = teacher.name?.charAt(0)?.toUpperCase() || "?";
                    return (
                      <div
                        key={teacher.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700">
                            {teacher.image ? (
                              <img
                                src={teacher.image}
                                alt={`${teacher.name} profil fotoğrafı`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                            {teacher.email && (
                              <p className="text-xs text-gray-600">{teacher.email}</p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/hocalar/${teacher.slug}`}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                        >
                          Hoca profiline git
                        </Link>
                      </div>
                    );
                  })}
                </div>
                )}
            </section>

            <section className="mt-6 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Çalışılan Üreticiler</p>
                  <p className="text-xs text-gray-600">Onaylanan üreticiler burada listelenir.</p>
                </div>
              </div>

              {producerLinks.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">Henüz bağlı üretici yok.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {producerLinks.map((producer) => {
                    const initial = producer.name?.charAt(0)?.toUpperCase() || "?";
                    return (
                      <div
                        key={producer.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700">
                            {producer.image ? (
                              <img
                                src={producer.image}
                                alt={`${producer.name} profil fotoğrafı`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{producer.name}</p>
                            {producer.email && <p className="text-xs text-gray-600">{producer.email}</p>}
                          </div>
                        </div>
                        <Link
                          href={`/uretim/${producer.slug}`}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                        >
                          Üretici profiline git
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "calendar" && (
          !currentRoom ? (
            <section className="mt-2 rounded-3xl border border-black/5 bg-white/80 p-5 text-sm text-gray-700 shadow-sm backdrop-blur">
              <p className="font-semibold text-gray-900">Takvim için önce oda ekleyin.</p>
              <p className="mt-1 text-xs text-gray-600">
                Oda ekledikten sonra takvim üzerinden saat ve slot düzenleyebilirsiniz.
              </p>
              <button
                onClick={addRoom}
                className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
              >
                Oda ekle
              </button>
            </section>
          ) : (
          <section className="mt-2 rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: currentRoom.color }}
              />
              <span>Takvim vurguları oda rengine göre</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Takvim</p>
                <p className="text-xs text-gray-600">
                  {currentRoom.name} için slotları düzenle.
                </p>
                {calendarView === "day" && selectedDate && (
                  <p className="mt-1 text-xs font-semibold text-gray-700">
                    Seçili gün:{" "}
                    {selectedDate.toLocaleDateString("tr-TR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white text-xs font-semibold">
                  {([
                    { key: "month", label: "Ay" },
                    { key: "week", label: "Hafta" },
                    { key: "day", label: "Gün" },
                  ] as const).map((item, idx) => (
                    <button
                      key={item.key}
                      onClick={() => handleCalendarViewChange(item.key as CalendarView)}
                      className={`px-3 py-2 ${
                        calendarView === item.key
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      } ${idx === 0 ? "rounded-l-lg" : ""} ${
                        idx === 2 ? "rounded-r-lg" : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {calendarView === "month" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setMonthCursor(
                          new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    >
                      Önceki
                    </button>
                    <div className="min-w-[160px] text-center text-sm font-semibold text-gray-900">
                      {monthCursor.toLocaleDateString("tr-TR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <button
                      onClick={() =>
                        setMonthCursor(
                          new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    >
                      Sonraki
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (calendarView === "week") {
                          setWeekCursor((prev) => addMinutes(prev, -7 * 24 * 60));
                        } else {
                          setSelectedDate((prev) =>
                            prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1) : new Date(),
                          );
                        }
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    >
                      Önceki
                    </button>
                    <div className="min-w-[180px] text-center text-sm font-semibold text-gray-900">
                      {calendarView === "week"
                        ? (() => {
                            const start = startOfWeek(weekCursor);
                            const end = addMinutes(start, 6 * 24 * 60);
                            return `${start.toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })} - ${end.toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })}`;
                          })()
                        : (selectedDate ?? new Date()).toLocaleDateString("tr-TR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                    </div>
                    <button
                      onClick={() => {
                        if (calendarView === "week") {
                          setWeekCursor((prev) => addMinutes(prev, 7 * 24 * 60));
                        } else {
                          setSelectedDate((prev) =>
                            prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1) : new Date(),
                          );
                        }
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {orderedRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setCalendarRoomScope(room.id);
                    handleTabChange("calendar");
                  }}
                  style={
                    calendarRoomScope === room.id
                      ? { backgroundColor: room.color, borderColor: room.color, color: "#fff" }
                      : { borderColor: "#e5e7eb" }
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    calendarRoomScope === room.id ? "" : "bg-gray-50 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  {room.name}
                </button>
              ))}
              {orderedRooms.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCalendarRoomScope("all");
                    handleTabChange("calendar");
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    calendarRoomScope === "all"
                      ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  Tümü
                </button>
              ) : null}
            </div>

            {calendarView === "month" && (
              <>
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-700">
                    {shortDays.map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
                    {Array.from({ length: totalCells }).map((_, idx) => {
                      const dayNum = idx - startOffset + 1;
                      if (dayNum < 1 || dayNum > daysInMonth) {
                        return <div key={idx} />;
                      }
                      const date = new Date(
                        monthCursor.getFullYear(),
                        monthCursor.getMonth(),
                        dayNum,
                      );
                      const key = formatKey(date);
                      const dayIdx = weekdayIndex(date);
                      const isOpen = effectiveOpeningHours[dayIdx]?.open;
                      const isSelected =
                        selectedDate &&
                        formatKey(selectedDate) === key &&
                        selectedRoomId === currentRoom.id;
                      const filledHours = getFilledHoursForDay(date);
                      const selectedStyle = isSelected
                        ? {
                            borderColor: currentRoom.color,
                            backgroundColor: `${currentRoom.color}22`,
                          }
                        : {};

                      return (
                        <button
                          key={idx}
                          onClick={() => isOpen && handleDaySelect(date)}
                          style={selectedStyle}
                          className={`flex h-16 flex-col rounded-xl border text-left transition ${
                            !isOpen
                              ? "cursor-not-allowed border-red-100 bg-red-50 text-red-700"
                              : !isSelected
                                ? "border-gray-200 bg-white hover:border-blue-300"
                                : ""
                          }`}
                        >
                          <span className="px-2 py-1 text-sm font-semibold">{dayNum}</span>
                          {filledHours > 0 && (
                            <span className="px-2 text-xs text-green-700">
                              {filledHours} saat dolu
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </>
            )}

            {calendarView !== "month" && (
              <div className="mt-4 space-y-3">
                {calendarError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {calendarError}
                  </div>
                ) : null}
                <div className="rounded-2xl border border-gray-100 bg-white/90 p-4">
                  {calendarLoading ? (
                    <p className="text-sm text-gray-600">Takvim yükleniyor...</p>
                  ) : calendarView === "day" ? (
                    (() => {
                      const day = selectedDate ?? new Date();
                      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                      const range = getDayRange(dayStart, dayCutoffHour);
                      const baseTimeline = getTimelineForDay(dayStart, effectiveOpeningHours, dayCutoffHour);
                      const dayBlocks = calendarBlocks.filter((block) => {
                        const start = new Date(block.startAt);
                        const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
                        return businessStart.getTime() === dayStart.getTime();
                      });
                      const visibleDayBlocks = dayBlocks.filter((block) => block.type !== "manual_block");
                      const blockExtents = visibleDayBlocks.map((block) => {
                        const start = new Date(block.startAt);
                        const end = new Date(block.endAt);
                        return {
                          start: (start.getTime() - range.start.getTime()) / 60000,
                          end: (end.getTime() - range.start.getTime()) / 60000,
                        };
                      });
                      const minBlock = blockExtents.length ? Math.min(...blockExtents.map((b) => b.start)) : null;
                      const maxBlock = blockExtents.length ? Math.max(...blockExtents.map((b) => b.end)) : null;
                      const timeline = {
                        start: minBlock !== null ? Math.min(baseTimeline.start, minBlock) : baseTimeline.start,
                        end: maxBlock !== null ? Math.max(baseTimeline.end, maxBlock) : baseTimeline.end,
                      };
                      const openInfo = effectiveOpeningHours[weekdayIndex(dayStart)];
                      const openMinutes = openInfo?.open ? minutesFromTime(openInfo.openTime) : null;
                      let closeMinutes = openInfo?.open ? minutesFromTime(openInfo.closeTime) : null;
                      if (openInfo?.open && openMinutes !== null && closeMinutes !== null && closeMinutes <= openMinutes) {
                        closeMinutes += 24 * 60;
                      }
                      const slots: number[] = [];
                      for (let m = timeline.start; m < timeline.end; m += slotStepMinutes) {
                        slots.push(m);
                      }
                      const slotHeight = 36;
                      const totalHeight = slots.length * slotHeight;
                      return (
                        <div className="grid grid-cols-[72px_1fr] gap-3">
                          <div className="flex flex-col">
                            {slots.map((m) => (
                              <div
                                key={`label-${m}`}
                                className="flex items-center justify-end pr-2 text-xs text-gray-500"
                                style={{ height: slotHeight }}
                              >
                                {formatMinutesLabel(m)}
                              </div>
                            ))}
                          </div>
                          <div
                            className="relative rounded-xl border border-gray-100 bg-gray-50"
                            style={{ height: totalHeight }}
                            onMouseUp={() => {
                              if (dragState) {
                                openDrawerForRange(dayStart, dragState.start, dragState.end);
                                setDragState(null);
                              }
                            }}
                          >
                            {slots.map((m) => {
                              const isHappy = isHappyHourSlot(dayStart, m);
                              return (
                              <div
                                key={`slot-${m}`}
                                className={`relative border-b border-gray-200/60 ${
                                  !openInfo?.open ||
                                  openMinutes === null ||
                                  closeMinutes === null ||
                                  m < openMinutes ||
                                  m + slotStepMinutes > closeMinutes
                                    ? "bg-gray-200/70"
                                    : ""
                                }`}
                                style={{ height: slotHeight }}
                                onMouseDown={() => setDragState({ day: dayStart, start: m, end: m + slotStepMinutes })}
                                onMouseEnter={() => {
                                  if (!dragState) return;
                                  setDragState((prev) => (prev ? { ...prev, end: m + slotStepMinutes } : prev));
                                }}
                                onClick={() => {
                                  if (dragState) return;
                                  openDrawerForRange(dayStart, m, m + slotStepMinutes);
                                }}
                              >
                                {isHappy && (
                                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                                    <HappyHourIcon className="h-14 w-14 text-amber-600" />
                                  </div>
                                )}
                              </div>
                              );
                            })}
                            {dragState && dragState.day.toDateString() === dayStart.toDateString() && (
                              <div
                                className="absolute left-2 right-2 rounded-xl border border-blue-300 bg-blue-200/40"
                                style={{
                                  top:
                                    ((Math.min(dragState.start, dragState.end) - timeline.start) /
                                      slotStepMinutes) *
                                    slotHeight,
                                  height:
                                    (Math.abs(dragState.end - dragState.start) / slotStepMinutes) *
                                    slotHeight,
                                }}
                              />
                            )}
                            {visibleDayBlocks.map((block) => {
                              const start = new Date(block.startAt);
                              const end = new Date(block.endAt);
                              const minutesFromStart = (start.getTime() - range.start.getTime()) / 60000;
                              const minutesToEnd = (end.getTime() - range.start.getTime()) / 60000;
                              const top = ((minutesFromStart - timeline.start) / slotStepMinutes) * slotHeight;
                              const height = ((minutesToEnd - minutesFromStart) / slotStepMinutes) * slotHeight;
                              if (height <= 0) return null;
                              const status = (block.status ?? "").toLowerCase();
                              const isAllRooms = calendarRoomScope === "all";
                              const roomColor = roomColorById.get(block.roomId ?? "") ?? "#1D4ED8";
                              const roomLabel = roomNameById.get(block.roomId ?? "") ?? "Oda";
                              const palette =
                                block.type === "manual_block"
                                  ? "border-blue-300/60 bg-blue-400/30 text-blue-900"
                                  : status === "approved" || status === "onaylı"
                                    ? "border-green-300/60 bg-green-400/30 text-green-900"
                                    : status === "cancelled" || status === "iptal"
                                      ? "border-red-300/60 bg-red-400/30 text-red-900"
                                      : "border-yellow-300/60 bg-yellow-300/30 text-yellow-900";
                              const inlineStyle = isAllRooms
                                ? {
                                    top,
                                    height,
                                    borderColor: withAlpha(roomColor, 0.55),
                                    backgroundColor: withAlpha(roomColor, 0.22),
                                    color: "#0f172a",
                                  }
                                : { top, height };
                              return (
                                <div
                                  key={block.id}
                                  className={`absolute left-2 right-2 rounded-xl border ${
                                    isAllRooms ? "" : palette
                                  }`}
                                  style={inlineStyle}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDrawerForBlock(dayStart, block);
                                    }}
                                    className="w-full rounded-xl px-3 py-2 text-left text-xs"
                                  >
                                    <p className="font-semibold">
                                      {formatMinutesLabel(minutesFromStart)} -{" "}
                                      {formatMinutesLabel(minutesToEnd)}
                                    </p>
                                    {isAllRooms ? (
                                      <p className="text-[10px] font-semibold">{roomLabel}</p>
                                    ) : null}
                                    <p className="truncate">
                                      {block.title?.trim()
                                        ? block.title
                                        : block.type === "manual_block"
                                          ? "Manuel blok"
                                          : "Rezervasyon"}
                                    </p>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const weekStart = startOfWeek(weekCursor);
                      const days = Array.from({ length: 7 }).map((_, idx) =>
                        new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + idx),
                      );
                      const timelines = days.map((day) =>
                        getTimelineForDay(day, effectiveOpeningHours, dayCutoffHour),
                      );
                      let minStart = Math.min(...timelines.map((t) => t.start));
                      let maxEnd = Math.max(...timelines.map((t) => t.end));
                      const dayRanges = days.map((day) => getDayRange(day, dayCutoffHour));
                      days.forEach((day, idx) => {
                        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                        const range = dayRanges[idx];
                        const blocks = calendarBlocks.filter((block) => {
                          const start = new Date(block.startAt);
                          const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
                          return businessStart.getTime() === dayStart.getTime();
                        });
                        const visibleBlocks = blocks.filter((block) => block.type !== "manual_block");
                        if (visibleBlocks.length) {
                          const extents = visibleBlocks.map((block) => {
                            const start = new Date(block.startAt);
                            const end = new Date(block.endAt);
                            return {
                              start: (start.getTime() - range.start.getTime()) / 60000,
                              end: (end.getTime() - range.start.getTime()) / 60000,
                            };
                          });
                          minStart = Math.min(minStart, ...extents.map((e) => e.start));
                          maxEnd = Math.max(maxEnd, ...extents.map((e) => e.end));
                        }
                      });
                      const timeline = { start: minStart, end: maxEnd };
                      const slots: number[] = [];
                      for (let m = timeline.start; m < timeline.end; m += slotStepMinutes) {
                        slots.push(m);
                      }
                      const slotHeight = 28;
                      const totalHeight = slots.length * slotHeight;
                      return (
                        <div className="grid grid-cols-[72px_1fr] gap-3">
                          <div className="flex flex-col">
                            {slots.map((m) => (
                              <div
                                key={`week-label-${m}`}
                                className="flex items-center justify-end pr-2 text-xs text-gray-500"
                                style={{ height: slotHeight }}
                              >
                                {formatMinutesLabel(m)}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {days.map((day) => {
                              const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                              const range = getDayRange(dayStart, dayCutoffHour);
                              const openInfo = effectiveOpeningHours[weekdayIndex(dayStart)];
                              const openMinutes = openInfo?.open ? minutesFromTime(openInfo.openTime) : null;
                              let closeMinutes = openInfo?.open ? minutesFromTime(openInfo.closeTime) : null;
                              if (openInfo?.open && openMinutes !== null && closeMinutes !== null && closeMinutes <= openMinutes) {
                                closeMinutes += 24 * 60;
                              }
                              const dayBlocks = calendarBlocks.filter((block) => {
                                const start = new Date(block.startAt);
                                const businessStart = getBusinessDayStartForTime(start, dayCutoffHour);
                                return businessStart.getTime() === dayStart.getTime();
                              });
                              const visibleDayBlocks = dayBlocks.filter(
                                (block) => block.type !== "manual_block",
                              );
                              return (
                                <div key={day.toISOString()} className="space-y-2">
                                  <div className="text-xs font-semibold text-gray-600">
                                    {day.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" })}
                                  </div>
                                  <div
                                    className="relative rounded-xl border border-gray-100 bg-gray-50"
                                    style={{ height: totalHeight }}
                                    onMouseUp={() => {
                                      if (dragState) {
                                        openDrawerForRange(day, dragState.start, dragState.end);
                                        setDragState(null);
                                      }
                                    }}
                                  >
                                    {slots.map((m) => {
                                      const isHappy = isHappyHourSlot(dayStart, m);
                                      return (
                                      <div
                                        key={`week-slot-${day.toDateString()}-${m}`}
                                        className={`relative border-b border-gray-200/60 ${
                                          !openInfo?.open ||
                                          openMinutes === null ||
                                          closeMinutes === null ||
                                          m < openMinutes ||
                                          m + slotStepMinutes > closeMinutes
                                            ? "bg-gray-200/70"
                                            : ""
                                        }`}
                                        style={{ height: slotHeight }}
                                        onMouseDown={() => setDragState({ day, start: m, end: m + slotStepMinutes })}
                                        onMouseEnter={() => {
                                          if (!dragState) return;
                                          setDragState((prev) =>
                                            prev ? { ...prev, end: m + slotStepMinutes } : prev,
                                          );
                                        }}
                                        onClick={() => {
                                          if (dragState) return;
                                          openDrawerForRange(day, m, m + slotStepMinutes);
                                        }}
                                      >
                                        {isHappy && (
                                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                                            <HappyHourIcon className="h-12 w-12 text-amber-600" />
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                    {dragState && dragState.day.toDateString() === day.toDateString() && (
                                      <div
                                        className="absolute left-2 right-2 rounded-xl border border-blue-300 bg-blue-200/40"
                                        style={{
                                          top:
                                            ((Math.min(dragState.start, dragState.end) - timeline.start) /
                                              slotStepMinutes) *
                                            slotHeight,
                                          height:
                                            (Math.abs(dragState.end - dragState.start) / slotStepMinutes) *
                                            slotHeight,
                                        }}
                                      />
                                    )}
                                    {visibleDayBlocks.map((block) => {
                                      const start = new Date(block.startAt);
                                      const end = new Date(block.endAt);
                                      const minutesFromStart = (start.getTime() - range.start.getTime()) / 60000;
                                      const minutesToEnd = (end.getTime() - range.start.getTime()) / 60000;
                                      const top =
                                        ((minutesFromStart - timeline.start) / slotStepMinutes) * slotHeight;
                                      const height =
                                        ((minutesToEnd - minutesFromStart) / slotStepMinutes) * slotHeight;
                                      if (height <= 0) return null;
                                      const status = (block.status ?? "").toLowerCase();
                                      const isAllRooms = calendarRoomScope === "all";
                                      const roomColor = roomColorById.get(block.roomId ?? "") ?? "#1D4ED8";
                                      const roomLabel = roomNameById.get(block.roomId ?? "") ?? "Oda";
                                      const palette =
                                        block.type === "manual_block"
                                          ? "border-blue-300/60 bg-blue-400/30 text-blue-900"
                                          : status === "approved" || status === "onaylı"
                                            ? "border-green-300/60 bg-green-400/30 text-green-900"
                                            : status === "cancelled" || status === "iptal"
                                              ? "border-red-300/60 bg-red-400/30 text-red-900"
                                              : "border-yellow-300/60 bg-yellow-300/30 text-yellow-900";
                                      const inlineStyle = isAllRooms
                                        ? {
                                            top,
                                            height,
                                            borderColor: withAlpha(roomColor, 0.55),
                                            backgroundColor: withAlpha(roomColor, 0.22),
                                            color: "#0f172a",
                                          }
                                        : { top, height };
                                      return (
                                        <div
                                          key={block.id}
                                          className={`absolute left-2 right-2 rounded-xl border ${
                                            isAllRooms ? "" : palette
                                          }`}
                                          style={inlineStyle}
                                        >
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDrawerForBlock(day, block);
                                            }}
                                            className="w-full rounded-xl px-2 py-1 text-left text-[10px]"
                                          >
                                            <p className="font-semibold">
                                              {formatMinutesLabel(minutesFromStart)}-
                                              {formatMinutesLabel(minutesToEnd)}
                                            </p>
                                            {isAllRooms ? (
                                              <p className="text-[10px] font-semibold">{roomLabel}</p>
                                            ) : null}
                                            <p className="truncate">
                                              {block.title?.trim()
                                                ? block.title
                                                : block.type === "manual_block"
                                                  ? "Manuel blok"
                                                  : "Rezervasyon"}
                                            </p>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {drawerOpen && drawerData && (
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-gray-200 bg-white p-5 shadow-2xl">
                {(() => {
                  const timeline = getTimelineForDay(drawerData.day, effectiveOpeningHours, dayCutoffHour);
                  const minOption = Math.min(
                    timeline.start,
                    drawerData.startMinutes,
                    drawerData.endMinutes,
                  );
                  const maxOption = Math.max(
                    timeline.end,
                    drawerData.startMinutes,
                    drawerData.endMinutes,
                  );
                  const options: number[] = [];
                  for (let m = minOption; m <= maxOption; m += slotStepMinutes) {
                    options.push(m);
                  }
                  const duration = Math.max(0, drawerData.endMinutes - drawerData.startMinutes);
                  const drawerRoomLabel =
                    roomNameById.get(drawerData.roomId) ?? currentRoom?.name ?? "Oda";
                  return (
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Slot detayı</p>
                          <p className="text-xs text-gray-600">
                            {drawerData.day.toLocaleDateString("tr-TR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDrawerOpen(false);
                            setDrawerData(null);
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-blue-300"
                        >
                          Kapat
                        </button>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600">
                        <p>Oda: {drawerRoomLabel}</p>
                        <p>Süre: {duration} dk</p>
                      </div>

                      <div className="grid gap-3">
                        <label className="flex flex-col gap-2 text-xs text-gray-600">
                          Rezervasyon adı
                          <input
                            value={drawerData.title}
                            onChange={(e) =>
                              setDrawerData((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                            }
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                            placeholder="Grup adı veya isim girin"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs text-gray-600">
                          Başlangıç
                          <select
                            value={drawerData.startMinutes}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setDrawerData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      startMinutes: value,
                                      endMinutes: Math.max(prev.endMinutes, value + slotStepMinutes),
                                    }
                                  : prev,
                              );
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                          >
                            {options.map((m) => (
                              <option key={`start-${m}`} value={m}>
                                {formatMinutesLabel(m)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-xs text-gray-600">
                          Bitiş
                          <select
                            value={drawerData.endMinutes}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setDrawerData((prev) =>
                                prev ? { ...prev, endMinutes: Math.max(value, prev.startMinutes + slotStepMinutes) } : prev,
                              );
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                          >
                            {options
                              .filter((m) => m > drawerData.startMinutes)
                              .map((m) => (
                                <option key={`end-${m}`} value={m}>
                                  {formatMinutesLabel(m)}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-xs text-gray-600">
                          Tip
                          <select
                            value={drawerData.type}
                            onChange={(e) =>
                              setDrawerData((prev) =>
                                prev ? { ...prev, type: e.target.value as "manual_block" | "reservation" } : prev,
                              )
                            }
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                          >
                            <option value="reservation">Rezervasyon</option>
                            <option value="manual_block">Manuel blok</option>
                          </select>
                        </label>
                        {drawerData.type === "reservation" && (
                          <label className="flex flex-col gap-2 text-xs text-gray-600">
                            Durum
                            <select
                              value={drawerData.status}
                              onChange={(e) =>
                                setDrawerData((prev) =>
                                  prev ? { ...prev, status: e.target.value } : prev,
                                )
                              }
                              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
                            >
                              <option value="pending">Beklemede</option>
                              <option value="approved">Onaylı</option>
                              <option value="cancelled">İptal</option>
                            </select>
                          </label>
                        )}
                        <label className="flex flex-col gap-2 text-xs text-gray-600">
                          Not
                          <textarea
                            value={drawerData.note}
                            onChange={(e) =>
                              setDrawerData((prev) => (prev ? { ...prev, note: e.target.value } : prev))
                            }
                            rows={4}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                            placeholder="Not ekle (opsiyonel)"
                          />
                        </label>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                        {drawerData.id ? (
                          <button
                            onClick={deleteCalendarBlock}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:border-red-300"
                          >
                            Sil
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={saveCalendarBlock}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
          )
        )}

        {activeTab.startsWith("room-") && currentRoom && (
          <section className="mt-4 grid gap-5 max-w-6xl mx-auto">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-800">Oda ismi:</span>
                <input
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:outline-none"
                  value={currentRoom.name}
                  onChange={(e) =>
                    setStudio((prev) =>
                      prev
                        ? {
                            ...prev,
                            rooms: prev.rooms.map((r) =>
                              r.id === currentRoom.id ? { ...r, name: e.target.value } : r,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-8 w-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: currentRoom.color }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setShowPalette((v) => !v)}
                    className="rounded-full border border-gray-200 p-2 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-700"
                    aria-label="Renk değiştir"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      saveRoomBasics(currentRoom.id, {
                        name: currentRoom.name,
                        type: currentRoom.type,
                        color: currentRoom.color,
                      })
                    }
                    disabled={saving}
                    className="rounded-full border border-gray-200 p-2 text-gray-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
                    aria-label="Oda bilgilerini kaydet"
                    title="Kaydet"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="text-xs text-gray-500">
                    Buradaki bütün bilgiler herkese görünür olacaktır.
                  </span>
                </div>
                {showPalette && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setStudio((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === currentRoom.id ? { ...r, color: c } : r,
                                  ),
                                }
                              : prev,
                          );
                          setShowPalette(false);
                        }}
                        className="h-9 w-9 rounded-full border border-gray-200 ring-offset-2 hover:ring-2 hover:ring-blue-400"
                        style={{ backgroundColor: c }}
                        aria-label={`Renk ${c}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-gray-800">Bu oda hangi amaçta?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roomTypeOptionsUi.map((type) => {
                    const active = selectedRoomTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          active ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={active}
                          onChange={(e) => {
                            const next = new Set(selectedRoomTypes);
                            if (e.target.checked) {
                              next.add(type);
                            } else {
                              next.delete(type);
                            }
                            if (!next.size) return;
                            updateRoomTypes(Array.from(next));
                          }}
                        />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                {currentRoom.name}
              </h2>
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-gray-900 shadow-sm space-y-3">
                <RoomSection
                  title="Fiyatlandırma"
                  open={isSectionOpen("pricing")}
                  onToggle={() => toggleSection("pricing")}
                >
                  {(() => {
                    const activePricingModel =
                      currentRoom.pricing.model === "daily" || currentRoom.pricing.model === "hourly"
                        ? currentRoom.pricing.model
                        : "hourly";
                    const baseRate = parsePriceValue(
                      activePricingModel === "daily"
                        ? currentRoom.pricing.dailyRate ?? currentRoom.pricing.hourlyRate
                        : currentRoom.pricing.hourlyRate ?? currentRoom.pricing.dailyRate,
                    );
                    const happyRate = parsePriceValue(currentRoom.pricing.happyHourRate);
                    const happyRateInvalid =
                      happyHourActive && happyRate !== null && baseRate !== null && happyRate >= baseRate * 0.9;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-900">
                          <label className="flex items-center gap-2">
                            <span>Ücretlendirme</span>
                            <select
                              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none"
                              value={activePricingModel}
                              onChange={(e) => {
                                const nextModel = e.target.value as Room["pricing"]["model"];
                                const rate =
                                  nextModel === "daily"
                                    ? currentRoom.pricing.dailyRate ?? currentRoom.pricing.hourlyRate ?? ""
                                    : currentRoom.pricing.hourlyRate ?? currentRoom.pricing.dailyRate ?? "";
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                pricing: {
                                                  ...r.pricing,
                                                  model: nextModel,
                                                  dailyRate: nextModel === "daily" ? rate : "",
                                                  hourlyRate: nextModel === "hourly" ? rate : "",
                                                  flatRate: "",
                                                  minRate: "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                );
                              }}
                            >
                              <option value="daily">Günlük</option>
                              <option value="hourly">Saatlik</option>
                            </select>
                          </label>
                          <input
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-400 focus:outline-none"
                            placeholder="Ücret"
                            value={
                              activePricingModel === "daily"
                                ? currentRoom.pricing.dailyRate ?? ""
                                : currentRoom.pricing.hourlyRate ?? ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? {
                                              ...r,
                                              pricing: {
                                                ...r.pricing,
                                                model: activePricingModel,
                                                dailyRate:
                                                  (activePricingModel === "daily" ? val : r.pricing.dailyRate) ?? "",
                                                hourlyRate:
                                                  (activePricingModel === "hourly" ? val : r.pricing.hourlyRate) ?? "",
                                                flatRate: "",
                                                minRate: "",
                                              },
                                            }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              );
                            }}
                          />
                        </div>
                        {happyHourActive && (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-900">
                            <label className="flex items-center gap-2">
                              <HappyHourIcon className="h-5 w-5 text-amber-600" />
                              <span>Happy Hour ücretlendirmesi</span>
                            </label>
                            <input
                              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-400 focus:outline-none"
                              placeholder="Ücret"
                              value={currentRoom.pricing.happyHourRate ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                pricing: {
                                                  ...r.pricing,
                                                  happyHourRate: val,
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                );
                              }}
                            />
                            {happyRateInvalid && (
                              <span className="text-xs font-semibold text-red-600">
                                Happy Hour minimum %10 olmalıdır.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button
                    disabled={saving || (happyHourActive && (() => {
                      const activePricingModel =
                        currentRoom.pricing.model === "daily" || currentRoom.pricing.model === "hourly"
                          ? currentRoom.pricing.model
                          : "hourly";
                      const baseRate = parsePriceValue(
                        activePricingModel === "daily"
                          ? currentRoom.pricing.dailyRate ?? currentRoom.pricing.hourlyRate
                          : currentRoom.pricing.hourlyRate ?? currentRoom.pricing.dailyRate,
                      );
                      const happyRate = parsePriceValue(currentRoom.pricing.happyHourRate);
                      return happyRate !== null && baseRate !== null && happyRate >= baseRate * 0.9;
                    })())}
                    onClick={() =>
                      saveRoomBasics(currentRoom.id, {
                        name: currentRoom.name,
                        type: currentRoom.type,
                        color: currentRoom.color,
                        pricing: currentRoom.pricing,
                        extras: currentRoom.extras,
                      })
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 shadow-sm"
                  >
                    {saving ? "Kaydediliyor..." : "Oda bilgisi kaydet"}
                  </button>
                </RoomSection>
                {isRehearsalLike && (
                  <RoomSection
                    className="mt-4"
                    title={rehearsalEquipmentTitle}
                    open={isSectionOpen("equipment")}
                    onToggle={() => toggleSection("equipment")}
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <p className="text-xs font-semibold text-gray-800">Davul var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasDrum: val,
                                                  drumDetail: val ? r.equipment?.drumDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasDrum === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasDrum && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.drumDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, drumDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Mapex Saturn"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kaç gitar amfiniz var?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const next = Math.max(0, (currentRoom.equipment?.guitarAmpCount ?? 0) - 1);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevDetails = r.equipment?.guitarAmpDetails ?? [];
                                        const nextDetails =
                                          next === 0
                                            ? []
                                            : Array.from({ length: next }, (_, i) => prevDetails[i] ?? "Örn: Fender Hot Rod");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarAmpCount: next, guitarAmpDetails: nextDetails },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {currentRoom.equipment?.guitarAmpCount ?? 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const next = (currentRoom.equipment?.guitarAmpCount ?? 0) + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevDetails = r.equipment?.guitarAmpDetails ?? [];
                                      const nextDetails = Array.from({ length: next }, (_, i) => prevDetails[i] ?? "Örn: Fender Hot Rod");
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, guitarAmpCount: next, guitarAmpDetails: nextDetails },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {(currentRoom.equipment?.guitarAmpCount ?? 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          {(currentRoom.equipment?.guitarAmpDetails ?? []).map((val, idx) => (
                            <input
                              key={idx}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                              value={val}
                              placeholder={`Amfi ${idx + 1} (örn: Marshall DSL)`}
                              onChange={(e) =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  guitarAmpDetails: (r.equipment?.guitarAmpDetails ?? []).map(
                                                    (d, i) => (i === idx ? e.target.value : d),
                                                  ),
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Bas amfisi var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasBassAmp: val,
                                                  bassDetail: val ? r.equipment?.bassDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasBassAmp === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasBassAmp && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.bassDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, bassDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Ampeg BA-115"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kaç adet mikrofon var?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const next = Math.max(0, (currentRoom.equipment?.micCount ?? 0) - 1);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevDetails = r.equipment?.micDetails ?? [];
                                        const nextDetails =
                                          next === 0
                                            ? []
                                            : Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {currentRoom.equipment?.micCount ?? 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const next = (currentRoom.equipment?.micCount ?? 0) + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevDetails = r.equipment?.micDetails ?? [];
                                      const nextDetails = Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {(currentRoom.equipment?.micCount ?? 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          {(currentRoom.equipment?.micDetails ?? []).map((detail, idx) => (
                            <input
                              key={idx}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                              value={detail}
                              placeholder={`Mikrofon ${idx + 1} (örn: SM58)`}
                              onChange={(e) =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  micDetails: (r.equipment?.micDetails ?? []).map((m, i) =>
                                                    i === idx ? e.target.value : m,
                                                  ),
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">DI Box var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? { ...r, equipment: { ...r.equipment, hasDiBox: val } }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasDiBox === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Klavye var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasKeyboard: val,
                                                  keyboardDetail: val ? r.equipment?.keyboardDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasKeyboard === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasKeyboard && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.keyboardDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, keyboardDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Roland FP-30"
                        />
                      )}
                      {!currentRoom.equipment?.hasKeyboard && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-800">Klavye sehpası var mı?</p>
                          <div className="mt-1 flex gap-2">
                            {["Evet", "Hayır"].map((label, idx) => {
                              const val = idx === 0;
                              return (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() =>
                                    setStudio((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            rooms: prev.rooms.map((r) =>
                                              r.id === currentRoom.id
                                                ? { ...r, equipment: { ...r.equipment, hasKeyboardStand: val } }
                                                : r,
                                            ),
                                          }
                                        : prev,
                                    )
                                  }
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                    currentRoom.equipment?.hasKeyboardStand === val
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kullanıma hazır ekstra gitar var mı?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const currentList = guitarList(currentRoom.equipment?.guitarUseDetail);
                              const count = Math.max(0, currentList.length - 1);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevList = guitarList(r.equipment?.guitarUseDetail);
                                        const next = Array.from(
                                          { length: count },
                                          (_, i) => prevList[i] ?? "Örn: Telecaster (takım)",
                                        );
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarUseDetail: next.join("|") },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {guitarList(currentRoom.equipment?.guitarUseDetail).length || 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const count = guitarList(currentRoom.equipment?.guitarUseDetail).length + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevList = guitarList(r.equipment?.guitarUseDetail);
                                      const next = Array.from(
                                        { length: count },
                                        (_, i) => prevList[i] ?? "Örn: Telecaster (takım)",
                                      );
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, guitarUseDetail: next.join("|") },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {guitarList(currentRoom.equipment?.guitarUseDetail).map((detail, idx) => (
                          <input
                            key={idx}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                            value={detail}
                            placeholder={`Gitar ${idx + 1} (örn: Telecaster)`}
                            onChange={(e) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const parts = guitarList(r.equipment?.guitarUseDetail);
                                        parts[idx] = e.target.value;
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarUseDetail: parts.join("|") },
                                        };
                                      }),
                                    }
                                  : prev,
                              )
                            }
                          />
                        ))}
                    </div>
                  </div>
                  <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            saveRoomBasics(currentRoom.id, {
                              name: currentRoom.name,
                              type: currentRoom.type,
                              color: currentRoom.color,
                              pricing: currentRoom.pricing,
                              equipment: currentRoom.equipment,
                            })
                          }
                          className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {saving ? "Kaydediliyor..." : "Ekipman bilgisi kaydet"}
                  </button>
                  </RoomSection>
                )}
                {hasRoomType("Vokal kabini") && (
                  <>
                    <RoomSection
                      className="mt-4"
                      title="Vokal kabini ekipmanları"
                      open={isSectionOpen("vocal-info")}
                      onToggle={() => toggleSection("vocal-info")}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Mikrofonlar</p>
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                              onClick={() => {
                                const next = Math.max(0, (currentRoom.equipment?.micCount ?? 0) - 1);
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) => {
                                          if (r.id !== currentRoom.id) return r;
                                          const prevDetails = r.equipment?.micDetails ?? [];
                                          const nextDetails =
                                            next === 0 ? [] : Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                          return {
                                            ...r,
                                            equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                          };
                                        }),
                                      }
                                    : prev,
                                );
                              }}
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold text-gray-900">
                              {currentRoom.equipment?.micCount ?? 0} adet
                            </span>
                          </div>
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const next = (currentRoom.equipment?.micCount ?? 0) + 1;
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevDetails = r.equipment?.micDetails ?? [];
                                        const nextDetails = Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            +
                          </button>
                        </div>
                        {(currentRoom.equipment?.micCount ?? 0) > 0 && (
                          <div className="mt-2 space-y-2">
                            {(currentRoom.equipment?.micDetails ?? []).map((detail, idx) => (
                              <input
                                key={idx}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                                value={detail}
                                placeholder={`Mikrofon ${idx + 1} (örn: SM58)`}
                                onChange={(e) =>
                                  setStudio((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          rooms: prev.rooms.map((r) =>
                                            r.id === currentRoom.id
                                              ? {
                                                  ...r,
                                                  equipment: {
                                                    ...r.equipment,
                                                    micDetails: (r.equipment?.micDetails ?? []).map((m, i) =>
                                                      i === idx ? e.target.value : m,
                                                    ),
                                                  },
                                                }
                                              : r,
                                          ),
                                        }
                                      : prev,
                                  )
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          {
                            label: "Kayıt teknisyeni var mı?",
                            value: currentRoom.extras?.vocalHasEngineer ?? false,
                            set: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? { ...r, extras: { ...r.extras, vocalHasEngineer: val } }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                          {
                            label: "Müzisyen kendi mikrofonunu getirebilir mi?",
                            value: currentRoom.features?.musicianMicAllowed ?? false,
                            set: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? { ...r, features: { ...r.features, musicianMicAllowed: val } }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                          {
                            label: "Canlı autotune hizmeti sağlanıyor mu?",
                            value: currentRoom.extras?.vocalLiveAutotune ?? false,
                            set: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? { ...r, extras: { ...r.extras, vocalLiveAutotune: val } }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                          {
                            label: "RAW kayıt ücrete dahil mi?",
                            value: currentRoom.extras?.vocalRawIncluded ?? false,
                            set: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? { ...r, extras: { ...r.extras, vocalRawIncluded: val } }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                        ].map((item) => (
                          <div key={item.label} className="space-y-1 rounded-lg border border-gray-200 bg-white p-3">
                            <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                            <div className="flex gap-2">
                              {["Evet", "Hayır"].map((label, idx) => {
                                const val = idx === 0;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => item.set(val)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      item.value === val ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          saveRoomBasics(currentRoom.id, {
                            name: currentRoom.name,
                            type: currentRoom.type,
                            color: currentRoom.color,
                            pricing: currentRoom.pricing,
                            equipment: currentRoom.equipment,
                            features: currentRoom.features,
                            extras: currentRoom.extras,
                          })
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? "Kaydediliyor..." : "Vokal bilgisi kaydet"}
                      </button>
                    </RoomSection>
                  </>
                )}
                {hasRoomType("Davul kabini") && (
                  <>
                    <RoomSection
                      className="mt-4"
                      title="Davul ekipmanı"
                      description="Detayları doldurmak zorunda değilsiniz. Ama davulcuları bilirsiniz."
                      open={isSectionOpen("drum-equipment")}
                      onToggle={() => toggleSection("drum-equipment")}
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        {(
                          [
                            { flag: "hasDrumKick", detail: "drumKickDetail", label: "Kick" },
                            { flag: "hasDrumSnare", detail: "drumSnareDetail", label: "Snare" },
                            { flag: "hasDrumToms", detail: "drumTomsDetail", label: "Tomlar" },
                            { flag: "hasDrumFloorTom", detail: "drumFloorTomDetail", label: "Floor tom" },
                            { flag: "hasDrumHihat", detail: "drumHihatDetail", label: "Hihat" },
                            { flag: "hasDrumRide", detail: "drumRideDetail", label: "Ride" },
                            { flag: "hasDrumCrash1", detail: "drumCrash1Detail", label: "Crash 1" },
                            { flag: "hasDrumCrash2", detail: "drumCrash2Detail", label: "Crash 2" },
                            { flag: "hasDrumCrash3", detail: "drumCrash3Detail", label: "Crash 3" },
                            { flag: "hasDrumCrash4", detail: "drumCrash4Detail", label: "Crash 4" },
                            { flag: "hasDrumChina", detail: "drumChinaDetail", label: "China" },
                            { flag: "hasDrumSplash", detail: "drumSplashDetail", label: "Splash" },
                            { flag: "hasDrumCowbell", detail: "drumCowbellDetail", label: "Cowbell" },
                            { flag: "hasTwinPedal", detail: "twinPedalDetail", label: "Twin pedal" },
                          ] as const
                        ).map((item) => (
                          <label
                            key={item.flag}
                            className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-800"
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4"
                              checked={Boolean(currentRoom.equipment[item.flag])}
                              onChange={(e) =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) => {
                                          if (r.id !== currentRoom.id) return r;
                                          const eq: Equipment = { ...r.equipment, [item.flag]: e.target.checked };
                                          const detailKey = item.detail;
                                          if (!detailKey) {
                                            return { ...r, equipment: eq };
                                          }
                                          const nextDetail =
                                            e.target.checked && typeof r.equipment[detailKey] === "string"
                                              ? (r.equipment[detailKey] as string)
                                              : "";
                                          return { ...r, equipment: { ...eq, [detailKey]: nextDetail } };
                                        }),
                                      }
                                    : prev,
                                )
                              }
                            />
                            <div className="flex-1 space-y-2">
                              <span>{item.label}</span>
                              {item.detail && currentRoom.equipment[item.flag] && (
                                <input
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                                  value={(currentRoom.equipment[item.detail] as string) ?? ""}
                                  onChange={(e) =>
                                    setStudio((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            rooms: prev.rooms.map((r) =>
                                              r.id === currentRoom.id
                                                ? {
                                                    ...r,
                                                    equipment: { ...r.equipment, [item.detail]: e.target.value },
                                                  }
                                                : r,
                                            ),
                                          }
                                        : prev,
                                    )
                                  }
                                  placeholder="Marka/Model"
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          saveRoomBasics(currentRoom.id, {
                            name: currentRoom.name,
                            type: currentRoom.type,
                            color: currentRoom.color,
                            pricing: currentRoom.pricing,
                            equipment: currentRoom.equipment,
                          })
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? "Kaydediliyor..." : "Ekipmanları kaydet"}
                      </button>
                    </RoomSection>
                  </>
                )}
                {hasRoomType("Etüt odası") && (
                  <>
                    <RoomSection
                      className="mt-4"
                      title="Etüt odası bilgileri"
                      description="Lütfen odanızı, amacını ve ekipmanları tanımlayın."
                      open={isSectionOpen("etut-info")}
                      onToggle={() => toggleSection("etut-info")}
                    >
                      <textarea
                        className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                        value={currentRoom.extras?.practiceDescription ?? ""}
                        onChange={(e) =>
                          setStudio((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === currentRoom.id
                                      ? { ...r, extras: { ...r.extras, practiceDescription: e.target.value } }
                                      : r,
                                  ),
                                }
                              : prev,
                          )
                        }
                        placeholder="Odanın amacı ve ekipmanları"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          saveRoomBasics(currentRoom.id, {
                            name: currentRoom.name,
                            type: currentRoom.type,
                            color: currentRoom.color,
                            pricing: currentRoom.pricing,
                            extras: currentRoom.extras,
                          })
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? "Kaydediliyor..." : "Etüt bilgisi kaydet"}
                      </button>
                    </RoomSection>
                  </>
                )}
                {hasRoomType("Kayıt kabini") && (
                  <>
                    <RoomSection
                      className="mt-4"
                      title="DAW ve kayıt bilgileri"
                      open={isSectionOpen("recording-info")}
                      onToggle={() => toggleSection("recording-info")}
                    >
                      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-xs font-semibold text-gray-800">Mevcut olan DAW&apos;ları seçin:</p>
                        <div className="flex flex-wrap gap-2">
                          {["Logic Pro", "Ableton", "FL Studio", "Pro Tools", "Studio One", "Reaper", "Reason"].map(
                            (daw) => {
                              const active = currentRoom.features?.dawList?.includes(daw);
                              return (
                                <button
                                  key={daw}
                                  type="button"
                                  onClick={() =>
                                    setStudio((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            rooms: prev.rooms.map((r) => {
                                              if (r.id !== currentRoom.id) return r;
                                              const list = new Set(r.features?.dawList ?? []);
                                              if (active) {
                                                list.delete(daw);
                                              } else {
                                                list.add(daw);
                                              }
                                              return { ...r, features: { ...r.features, dawList: Array.from(list) } };
                                            }),
                                          }
                                        : prev,
                                    )
                                  }
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                    active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {daw}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          {
                            label: "Fiyata kayıt teknisyeni dahil mi?",
                            value: currentRoom.features?.recordingEngineerIncluded ?? false,
                            setter: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id
                                          ? { ...r, features: { ...r.features, recordingEngineerIncluded: val } }
                                          : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                          {
                            label: "Control Room var mı?",
                            value: currentRoom.features?.hasControlRoom ?? false,
                            setter: (val: boolean) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) =>
                                        r.id === currentRoom.id ? { ...r, features: { ...r.features, hasControlRoom: val } } : r,
                                      ),
                                    }
                                  : prev,
                              ),
                          },
                        ].map((item) => (
                          <div key={item.label} className="space-y-1 rounded-lg border border-gray-200 bg-white p-3">
                            <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                            <div className="flex gap-2">
                              {["Evet", "Hayır"].map((label, idx) => {
                                const val = idx === 0;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => item.setter(val)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      item.value === val ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          saveRoomBasics(currentRoom.id, {
                            name: currentRoom.name,
                            type: currentRoom.type,
                            color: currentRoom.color,
                            pricing: currentRoom.pricing,
                            equipment: currentRoom.equipment,
                            features: currentRoom.features,
                          })
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? "Kaydediliyor..." : "Kayıt bilgisi kaydet"}
                      </button>
                    </RoomSection>
                  </>
                )}
                {showExtras && (
                  <RoomSection
                    className="mt-4"
                    title="Ekstralar"
                    open={isSectionOpen("extras")}
                    onToggle={() => toggleSection("extras")}
                  >
                    <div className="space-y-4">
                      {hasRoomType("Vokal kabini") && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-900">Vokal kabini</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {(
                              [
                                { label: "Edit hizmeti", key: "vocalEditService" },
                                { label: "Mix / Mastering hizmeti", key: "vocalMixService" },
                                { label: "Prodüksiyon hizmeti", key: "vocalProductionService" },
                              ] as {
                                label: string;
                                key: "vocalEditService" | "vocalMixService" | "vocalProductionService";
                              }[]
                            ).map((item) => {
                              const currentVal = (currentRoom.extras?.[item.key] as string | undefined) ?? "none";
                              return (
                                <div key={item.key} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {(["none", "included", "extra"] as const).map((val) => (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() =>
                                          setStudio((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  rooms: prev.rooms.map((r) =>
                                                    r.id === currentRoom.id
                                                      ? { ...r, extras: { ...r.extras, [item.key]: val } }
                                                      : r,
                                                  ),
                                                }
                                              : prev,
                                          )
                                        }
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                          currentVal === val
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-800"
                                        }`}
                                      >
                                        {val === "none" ? "Yok" : val === "included" ? "Dahil" : "Ekstra"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {hasRoomType("Davul kabini") && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-900">Davul kabini</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {(
                              [
                                { label: "Profesyonel davul kaydı imkanı", key: "drumProRecording", values: ["none", "included", "extra"] },
                                { label: "Video çekimi", key: "drumVideo", values: ["none", "included", "extra"] },
                                { label: "Davul prodüksiyonu", key: "drumProduction", values: ["none", "extra"] },
                                { label: "Davul mix/mastering", key: "drumMix", values: ["none", "extra"] },
                              ] as {
                                label: string;
                                key: "drumProRecording" | "drumVideo" | "drumProduction" | "drumMix";
                                values: ("none" | "included" | "extra")[];
                              }[]
                            ).map((item) => {
                              const currentVal = (currentRoom.extras?.[item.key] as string | undefined) ?? "none";
                              return (
                                <div key={item.key} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.values.map((val) => (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() =>
                                          setStudio((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  rooms: prev.rooms.map((r) =>
                                                    r.id === currentRoom.id
                                                      ? { ...r, extras: { ...r.extras, [item.key]: val } }
                                                      : r,
                                                  ),
                                                }
                                              : prev,
                                          )
                                        }
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                          currentVal === val
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-800"
                                        }`}
                                      >
                                        {val === "none" ? "Yok" : val === "included" ? "Dahil" : "Ekstra"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {hasRoomType("Kayıt kabini") && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-900">Kayıt kabini</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                              <p className="text-xs font-semibold text-gray-800">Edit / Mix / Mastering hizmeti</p>
                              <div className="flex gap-2">
                                {(["none", "extra"] as const).map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() =>
                                      setStudio((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              rooms: prev.rooms.map((r) =>
                                                r.id === currentRoom.id
                                                  ? { ...r, extras: { ...r.extras, recordingMixService: val } }
                                                  : r,
                                              ),
                                            }
                                          : prev,
                                      )
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      (currentRoom.extras?.recordingMixService ?? "none") === val
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {val === "none" ? "Yok" : "Ekstra"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                              <p className="text-xs font-semibold text-gray-800">Prodüksiyon hizmeti</p>
                              <div className="flex gap-2">
                                {(["none", "extra"] as const).map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() =>
                                      setStudio((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              rooms: prev.rooms.map((r) =>
                                                r.id === currentRoom.id
                                                  ? {
                                                      ...r,
                                                      extras: { ...r.extras, recordingProduction: val, recordingProductionAreas: [] },
                                                    }
                                                  : r,
                                              ),
                                            }
                                          : prev,
                                      )
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      (currentRoom.extras?.recordingProduction ?? "none") === val
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {val === "none" ? "Yok" : "Ekstra"}
                                  </button>
                                ))}
                              </div>
                              {(currentRoom.extras?.recordingProduction ?? "none") === "extra" && (
                                <div className="mt-2 space-y-2">
                                  {recordingProductionOptions.map((label) => {
                                    const active = currentRoom.extras?.recordingProductionAreas?.includes(label);
                                    return (
                                      <label key={label} className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={active}
                                          onChange={(e) =>
                                            setStudio((prev) =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    rooms: prev.rooms.map((r) => {
                                                      if (r.id !== currentRoom.id) return r;
                                                      const set = new Set(r.extras?.recordingProductionAreas ?? []);
                                                      if (e.target.checked) set.add(label);
                                                      else set.delete(label);
                                                      return {
                                                        ...r,
                                                        extras: { ...r.extras, recordingProductionAreas: Array.from(set) },
                                                      };
                                                    }),
                                                  }
                                                : prev,
                                            )
                                          }
                                        />
                                        {label}
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        saveRoomBasics(currentRoom.id, {
                          name: currentRoom.name,
                          type: currentRoom.type,
                          color: currentRoom.color,
                          pricing: currentRoom.pricing,
                          extras: currentRoom.extras,
                        })
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Kaydediliyor..." : "Ekstraları kaydet"}
                    </button>
                  </RoomSection>
                )}
                <RoomSection
                  className="mt-4"
                  title="Görseller"
                  description="Max 5 MB, ilk görsel kapak olur. Yatay (landscape) görseller daha iyi görünür."
                  open={isSectionOpen("images")}
                  onToggle={() => toggleSection("images")}
                >
                  <ImagesBlock />
                </RoomSection>
                {showCourses && (
                  <RoomSection
                    className="mt-4"
                    title={coursesTitle}
                    description={coursesDescription}
                    open={isSectionOpen("courses")}
                    onToggle={() => toggleSection("courses")}
                  >
                    <CoursesBlock />
                  </RoomSection>
                )}
                <button
                  disabled={saving || orderedRooms.length <= 1}
                  onClick={() => {
                    if (!currentRoom) return;
                    if (!emailVerified) {
                      setStatus("Odayı silmek için e-posta doğrulaması gerekiyor.");
                      return;
                    }
                    if (!window.confirm("Bu odayı silmek istediğine emin misin?")) return;
                    setSaving(true);
                    fetch("/api/studio", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rooms: [{ id: currentRoom.id, _delete: true }],
                      }),
                    })
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.studio) {
                          const normalized = normalizeStudio(json.studio);
                          setStudio(normalized);
                          if (normalized?.rooms?.length) {
                            setSelectedRoomId(normalized.rooms[0].id);
                            setActiveTab(`room-${normalized.rooms[0].id}`);
                          }
                          setStatus("Oda silindi");
                        } else {
                          setStatus(json.error || "Oda silinemedi");
                        }
                      })
                      .catch(() => setStatus("Oda silinemedi"))
                      .finally(() => setSaving(false));
                  }}
                  className="mt-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:opacity-50"
                >
                  Odayı sil
                </button>
              </div>

            </div>
          </section>
        )}
        </div>
      </div>

      {showRatings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Yorumlar</h3>
              <button
                onClick={() => setShowRatings(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm"
              >
                Kapat
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {studio?.ratings.length ? (
                studio.ratings.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <span className="mt-1 h-6 w-6 rounded-full bg-green-100 text-center text-sm font-semibold text-green-800">
                      {r.toFixed(1)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Yorum {i + 1}</p>
                      <p className="text-xs text-gray-700">Yorum detayı bulunmuyor.</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">Henüz puan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white"
            >
              Kapat
            </button>
            <img
              src={previewImage}
              alt="Görsel önizleme"
              className="block max-h-[90vh] w-full object-contain bg-black"
            />
          </div>
        </div>
      )}

    </>
  );
}
