"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Section } from "@/components/design-system/components/shared/section";
import { FilterBar } from "@/components/design-system/components/shared/filter-bar";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { EmptyState } from "@/components/design-system/components/shared/empty-state";
import { SkeletonCard } from "@/components/design-system/components/shared/skeleton-card";
import { loadGeo, slugify, type TRGeo } from "@/lib/geo";
import { buildQueryString, parseFiltersFromSearchParams, type StudioFilters } from "@/lib/filters";
import { createStudioSlug } from "@/lib/studio-slug";
import type { Equipment, Extras, Features, OpeningHours, Pricing } from "@/types/panel";

export type ServerStudio = {
  id: string;
  slug: string;
  name: string;
  province: string;
  district: string;
  happyHourEnabled?: boolean;
  openingHours?: OpeningHours[] | null;
  roomTypes: string[];
  rooms: Array<{
    name: string;
    type: string;
    pricingModel: string | null;
    flatRate: string | null;
    minRate: string | null;
    dailyRate: string | null;
    hourlyRate: string | null;
    equipmentJson: unknown;
    featuresJson: unknown;
    extrasJson: unknown;
  }>;
  pricePerHour?: number;
  badges?: string[];
  imageUrl?: string;
  interactionCount?: number;
};

type StudioRoom = {
  name: string;
  type: string;
  pricing: Pricing;
  equipment: Equipment;
  features: Features;
  extras: Extras;
};

type Studio = {
  id: string;
  slug: string;
  name: string;
  address: {
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
  };
  roomTypes: string[];
  rooms: StudioRoom[];
  openingHours: OpeningHours[];
  pricePerHour?: number;
  badges?: string[];
  imageUrl?: string;
  happyHourEnabled?: boolean;
  interactionCount?: number;
};

const roomTypeAliases: Record<string, string> = {
  prova: "prova-odasi",
  "prova-odasi": "prova-odasi",
  kayit: "kayit-kabini",
  "kayit-odasi": "kayit-kabini",
  "kayit-kabini": "kayit-kabini",
  "vokal-kabini": "vokal-kabini",
  "davul-odasi": "davul-kabini",
  "davul-kabini": "davul-kabini",
  "etut-odasi": "etut-odasi",
  "kontrol-odasi": "kayit-kabini",
  "produksiyon-odasi": "kayit-kabini",
};

const normalizeRoomType = (value: string) => {
  const slug = slugify(value);
  return roomTypeAliases[slug] ?? slug;
};

const defaultOpeningHours: OpeningHours[] = Array.from({ length: 7 }, () => ({
  open: true,
  openTime: "10:00",
  closeTime: "22:00",
}));

const normalizeOpeningHours = (value?: OpeningHours[] | null) =>
  Array.isArray(value) && value.length === 7 ? value : defaultOpeningHours;

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

const defaultFeatures: Features = {
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

const defaultExtras: Extras = {
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

const normalizeEquipment = (value: unknown): Equipment => ({
  ...defaultEquipment,
  ...(parseJson<Partial<Equipment>>(value, {}) ?? {}),
});

const normalizeFeatures = (value: unknown): Features => ({
  ...defaultFeatures,
  ...(parseJson<Partial<Features>>(value, {}) ?? {}),
});

const normalizeExtras = (value: unknown): Extras => ({
  ...defaultExtras,
  ...(parseJson<Partial<Extras>>(value, {}) ?? {}),
});

const roomTypeSlugs = (room: StudioRoom) => {
  const types = [room.type, ...(room.extras.alsoTypes ?? [])].filter(Boolean);
  return types.map((type) => normalizeRoomType(type));
};

const hasRoomType = (room: StudioRoom, slug: string) => roomTypeSlugs(room).includes(slug);

const guitarList = (val?: string | null) => (val ? val.split("|").map((v) => v.trim()).filter(Boolean) : []);

const parseNumber = (value?: string | null) => {
  if (!value) return undefined;
  const cleaned = value.toString().replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const matchYesNo = (value: boolean | undefined, filter?: string) => {
  if (!filter) return true;
  if (filter === "yes") return Boolean(value);
  if (filter === "no") return !value;
  return true;
};

const matchMin = (value: number | undefined, min?: string) => {
  const parsed = parseNumber(min ?? "");
  if (parsed === undefined) return true;
  return (value ?? 0) >= parsed;
};

const matchService = (value: string | undefined, filter?: string) => {
  if (!filter) return true;
  return (value ?? "none") === filter;
};

function pickAddress(geo: TRGeo, provinceName: string, districtName: string) {
  const provinceSlug = slugify(provinceName);
  const province = geo.find((p) => p.id === provinceSlug || slugify(p.name) === provinceSlug);
  if (!province) return null;

  const districtSlug = `${province.id}-${slugify(districtName)}`;
  const district =
    province.districts.find((d) => d.id === districtSlug || slugify(d.name) === slugify(districtName)) ??
    province.districts[0];

  if (!district) return null;

  return {
    provinceId: province.id,
    provinceName: province.name,
    districtId: district.id,
    districtName: district.name,
  };
}

function buildMockStudios(geo: TRGeo): Studio[] {
  const baseStudios: Array<{
    name: string;
    province: string;
    district: string;
    roomTypes: string[];
    price: number;
    badges: string[];
    imageUrl?: string;
  }> = [
    {
      name: "Kadıköy Sound Lab",
      province: "İstanbul",
      district: "Kadıköy",
      roomTypes: ["prova", "vokal-kabini"],
      price: 450,
      badges: ["Mikrofon", "Amfi"],
      imageUrl: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Boğaz Sessions",
      province: "İstanbul",
      district: "Beşiktaş",
      roomTypes: ["kayit", "kontrol-odasi"],
      price: 700,
      badges: ["Kayıt teknisyeni", "Analog miks"],
      imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ankara Echo",
      province: "Ankara",
      district: "Çankaya",
      roomTypes: ["prova", "kayit-kabini"],
      price: 380,
      badges: ["Backline", "Park yeri"],
      imageUrl: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ege Tonem",
      province: "İzmir",
      district: "Konak",
      roomTypes: ["prova", "davul-odasi"],
      price: 320,
      badges: ["Davul seti", "PA sistemi"],
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Nilüfer Sessions",
      province: "Bursa",
      district: "Nilüfer",
      roomTypes: ["prova"],
      price: 300,
      badges: ["Genç müzisyen indirimi", "24/7"],
      imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return baseStudios
    .map((studio, idx) => {
      const address = pickAddress(geo, studio.province, studio.district);
      if (!address) return null;
      const rooms: StudioRoom[] = studio.roomTypes.map((type, idx) => ({
        name: `${studio.name} Oda ${idx + 1}`,
        type,
        pricing: {
          model: "hourly",
          hourlyRate: studio.price.toString(),
        },
        equipment: { ...defaultEquipment },
        features: { ...defaultFeatures },
        extras: { ...defaultExtras },
      }));
      return {
        id: `mock-${idx + 1}`,
        slug: createStudioSlug(studio.name),
        name: studio.name,
        address,
        roomTypes: studio.roomTypes,
        rooms,
        openingHours: defaultOpeningHours,
        pricePerHour: studio.price,
        badges: studio.badges,
        imageUrl: studio.imageUrl,
        happyHourEnabled: false,
        interactionCount: 0,
      } satisfies Studio;
    })
    .filter(Boolean) as Studio[];
}

export function StudyoClientPage({ serverStudios = [] }: { serverStudios?: ServerStudio[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const geo = useMemo(() => loadGeo(), []);
  const studios = useMemo(() => {
    const mappedServer = serverStudios
      .map((studio) => {
        const address = pickAddress(geo, studio.province, studio.district);
        if (!address) return null;
        const rooms: StudioRoom[] = studio.rooms.map((room) => {
          const modelRaw = (room.pricingModel ?? "").toString().toLowerCase();
          const model: Pricing["model"] =
            modelRaw === "daily" || modelRaw === "hourly" || modelRaw === "flat" || modelRaw === "variable"
              ? modelRaw
              : "hourly";
          return {
            name: room.name,
            type: room.type,
            pricing: {
              model,
              flatRate: room.flatRate ?? "",
              minRate: room.minRate ?? "",
              dailyRate: room.dailyRate ?? "",
              hourlyRate: room.hourlyRate ?? "",
            },
            equipment: normalizeEquipment(room.equipmentJson),
            features: normalizeFeatures(room.featuresJson),
            extras: normalizeExtras(room.extrasJson),
          };
        });
        return {
          id: studio.id,
          slug: studio.slug,
          name: studio.name,
          address,
          roomTypes: studio.roomTypes,
          rooms,
          openingHours: normalizeOpeningHours(studio.openingHours ?? null),
          pricePerHour: studio.pricePerHour,
          badges: studio.badges,
          imageUrl: studio.imageUrl,
          happyHourEnabled: studio.happyHourEnabled ?? false,
          interactionCount: studio.interactionCount ?? 0,
        } satisfies Studio;
      })
      .filter(Boolean) as Studio[];
    return [...buildMockStudios(geo), ...mappedServer];
  }, [geo, serverStudios]);
  const [filters, setFilters] = useState<StudioFilters>(() => parseFiltersFromSearchParams(searchParams));
  const [availableStudioIds, setAvailableStudioIds] = useState<string[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    const next = parseFiltersFromSearchParams(searchParams);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((prev) => ({
      ...prev,
      ...next,
      advanced: prev.advanced ?? {},
    }));
  }, [searchParamsString, searchParams]);

  const hasAdvancedFilters = useMemo(() => {
    const advanced = filters.advanced ?? {};
    return Object.values(advanced).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== "";
    });
  }, [filters.advanced]);

  useEffect(() => {
    if (!filters.date || !filters.time) {
      setAvailableStudioIds(null);
      setAvailabilityLoading(false);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("date", filters.date);
    params.set("time", filters.time);
    params.set("duration", String(filters.duration ?? 60));
    if (filters.province) params.set("il", filters.province);
    if (filters.district) params.set("ilce", filters.district);
    if (filters.roomType) params.set("oda", filters.roomType);

    setAvailabilityLoading(true);
    fetch(`/api/studio/availability?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        const ids = Array.isArray(data?.studioIds) ? data.studioIds : [];
        setAvailableStudioIds(ids);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("availability fetch failed", err);
        setAvailableStudioIds([]);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setAvailabilityLoading(false);
      });

    return () => controller.abort();
  }, [filters.date, filters.time, filters.duration, filters.district, filters.province, filters.roomType]);

  const hasAvailabilityFilter = Boolean(filters.date && filters.time);
  const availabilitySet = useMemo(() => new Set(availableStudioIds ?? []), [availableStudioIds]);
  const availabilityPending = hasAvailabilityFilter && availableStudioIds === null;

  const filteredStudios = useMemo(() => {
    const advanced = filters.advanced ?? {};

    if (hasAvailabilityFilter && availableStudioIds === null) return [];
    if (
      !filters.province &&
      !filters.roomType &&
      !hasAdvancedFilters &&
      !hasAvailabilityFilter &&
      !filters.happyHourOnly
    ) {
      return [];
    }

    return studios.filter((studio) => {
      if (hasAvailabilityFilter && !availabilitySet.has(studio.id)) return false;
      if (filters.province && studio.address.provinceId !== filters.province) return false;
      if (filters.district && studio.address.districtId !== filters.district) return false;
      if (filters.roomType) {
        const normalized = studio.roomTypes.map((type) => normalizeRoomType(type));
        if (!normalized.includes(filters.roomType)) return false;
      }
      if (filters.happyHourOnly && !studio.happyHourEnabled) return false;

      if (!hasAdvancedFilters) return true;

      const rooms = studio.rooms;
      if (!rooms.length) return false;

      const roomsByType = (slug: string) => rooms.filter((room) => hasRoomType(room, slug));
      const roomsForBase = filters.roomType ? roomsByType(filters.roomType) : rooms;

      const needsGeneral = Boolean(advanced.pricingModel || advanced.priceMax);
      if (needsGeneral) {
        const matched = roomsForBase.some((room) => {
          if (advanced.pricingModel && room.pricing.model !== advanced.pricingModel) return false;
          if (advanced.priceMax) {
            const rates = [
              parseNumber(room.pricing.hourlyRate ?? ""),
              parseNumber(room.pricing.dailyRate ?? ""),
              parseNumber(room.pricing.flatRate ?? ""),
              parseNumber(room.pricing.minRate ?? ""),
            ].filter((value): value is number => value !== undefined);
            if (!rates.length) return false;
            const max = parseNumber(advanced.priceMax);
            if (max !== undefined && Math.min(...rates) > max) return false;
          }
          return true;
        });
        if (!matched) return false;
      }

      if (advanced.courses) {
        const courseRooms = rooms.filter((room) =>
          ["prova-odasi", "vokal-kabini", "davul-kabini", "etut-odasi"].some((slug) => hasRoomType(room, slug)),
        );
        const matched = courseRooms.some((room) => matchYesNo(room.extras.acceptsCourses, advanced.courses));
        if (!matched) return false;
      }

      const needsRehearsal = Boolean(
        advanced.hasDrum ||
          advanced.guitarAmpMin ||
          advanced.hasBassAmp ||
          advanced.hasDiBox ||
          advanced.hasKeyboard ||
          advanced.hasKeyboardStand ||
          advanced.extraGuitarMin,
      );
      if (needsRehearsal) {
        const rehearsalRooms = rooms.filter((room) =>
          ["prova-odasi", "kayit-kabini"].some((slug) => hasRoomType(room, slug)),
        );
        const matched = rehearsalRooms.some((room) => {
          const eq = room.equipment;
          if (!matchYesNo(eq.hasDrum, advanced.hasDrum)) return false;
          if (!matchMin(eq.guitarAmpCount, advanced.guitarAmpMin)) return false;
          if (!matchYesNo(eq.hasBassAmp, advanced.hasBassAmp)) return false;
          if (!matchYesNo(eq.hasDiBox, advanced.hasDiBox)) return false;
          if (!matchYesNo(eq.hasKeyboard, advanced.hasKeyboard)) return false;
          if (!matchYesNo(eq.hasKeyboardStand, advanced.hasKeyboardStand)) return false;
          const extraGuitarCount = guitarList(eq.guitarUseDetail).length;
          if (!matchMin(extraGuitarCount, advanced.extraGuitarMin)) return false;
          return true;
        });
        if (!matched) return false;
      }

      const needsVocal = Boolean(
        advanced.vocalHasEngineer ||
          advanced.musicianMicAllowed ||
          advanced.vocalLiveAutotune ||
          advanced.vocalRawIncluded ||
          advanced.vocalEditService ||
          advanced.vocalMixService ||
          advanced.vocalProductionService,
      );
      if (needsVocal) {
        const vocalRooms = roomsByType("vokal-kabini");
        const matched = vocalRooms.some((room) => {
          const features = room.features;
          const ex = room.extras;
          if (!matchYesNo(ex.vocalHasEngineer, advanced.vocalHasEngineer)) return false;
          if (!matchYesNo(features.musicianMicAllowed, advanced.musicianMicAllowed)) return false;
          if (!matchYesNo(ex.vocalLiveAutotune, advanced.vocalLiveAutotune)) return false;
          if (!matchYesNo(ex.vocalRawIncluded, advanced.vocalRawIncluded)) return false;
          if (!matchService(ex.vocalEditService, advanced.vocalEditService)) return false;
          if (!matchService(ex.vocalMixService, advanced.vocalMixService)) return false;
          if (!matchService(ex.vocalProductionService, advanced.vocalProductionService)) return false;
          return true;
        });
        if (!matched) return false;
      }

      const needsDrum = Boolean(
        advanced.drumKick ||
          advanced.drumSnare ||
          advanced.drumToms ||
          advanced.drumFloorTom ||
          advanced.drumHihat ||
          advanced.drumRide ||
          advanced.drumCrash1 ||
          advanced.drumCrash2 ||
          advanced.drumCrash3 ||
          advanced.drumCrash4 ||
          advanced.drumChina ||
          advanced.drumSplash ||
          advanced.hasCowbell ||
          advanced.hasTwinPedal ||
          advanced.drumProRecording ||
          advanced.drumVideo ||
          advanced.drumProduction ||
          advanced.drumMix,
      );
      if (needsDrum) {
        const drumRooms = roomsByType("davul-kabini");
        const matched = drumRooms.some((room) => {
          const eq = room.equipment;
          const ex = room.extras;
          if (!matchYesNo(eq.hasDrumKick, advanced.drumKick)) return false;
          if (!matchYesNo(eq.hasDrumSnare, advanced.drumSnare)) return false;
          if (!matchYesNo(eq.hasDrumToms, advanced.drumToms)) return false;
          if (!matchYesNo(eq.hasDrumFloorTom, advanced.drumFloorTom)) return false;
          if (!matchYesNo(eq.hasDrumHihat, advanced.drumHihat)) return false;
          if (!matchYesNo(eq.hasDrumRide, advanced.drumRide)) return false;
          if (!matchYesNo(eq.hasDrumCrash1, advanced.drumCrash1)) return false;
          if (!matchYesNo(eq.hasDrumCrash2, advanced.drumCrash2)) return false;
          if (!matchYesNo(eq.hasDrumCrash3, advanced.drumCrash3)) return false;
          if (!matchYesNo(eq.hasDrumCrash4, advanced.drumCrash4)) return false;
          if (!matchYesNo(eq.hasDrumChina, advanced.drumChina)) return false;
          if (!matchYesNo(eq.hasDrumSplash, advanced.drumSplash)) return false;
          if (!matchYesNo(eq.hasDrumCowbell, advanced.hasCowbell)) return false;
          if (!matchYesNo(eq.hasTwinPedal, advanced.hasTwinPedal)) return false;
          if (!matchService(ex.drumProRecording, advanced.drumProRecording)) return false;
          if (!matchService(ex.drumVideo, advanced.drumVideo)) return false;
          if (!matchService(ex.drumProduction, advanced.drumProduction)) return false;
          if (!matchService(ex.drumMix, advanced.drumMix)) return false;
          return true;
        });
        if (!matched) return false;
      }

      const needsRecording = Boolean(
        (advanced.dawList ?? []).length ||
          advanced.recordingEngineerIncluded ||
          advanced.hasControlRoom ||
          advanced.recordingMixService ||
          advanced.recordingProduction ||
          (advanced.recordingProductionAreas ?? []).length,
      );
      if (needsRecording) {
        const recordingRooms = roomsByType("kayit-kabini");
        const matched = recordingRooms.some((room) => {
          const features = room.features;
          const ex = room.extras;
          if ((advanced.dawList ?? []).length) {
            const current = features.dawList ?? [];
            if (!advanced.dawList?.every((daw) => current.includes(daw))) return false;
          }
          if (!matchYesNo(features.recordingEngineerIncluded, advanced.recordingEngineerIncluded)) return false;
          if (!matchYesNo(features.hasControlRoom, advanced.hasControlRoom)) return false;
          if (!matchService(ex.recordingMixService, advanced.recordingMixService)) return false;
          if (!matchService(ex.recordingProduction, advanced.recordingProduction)) return false;
          if ((advanced.recordingProductionAreas ?? []).length) {
            const areas = ex.recordingProductionAreas ?? [];
            if (!advanced.recordingProductionAreas?.every((area) => areas.includes(area))) return false;
          }
          return true;
        });
        if (!matched) return false;
      }

      return true;
    });
  }, [availableStudioIds, availabilitySet, filters, hasAdvancedFilters, hasAvailabilityFilter, studios]);

  const sortedStudios = useMemo(() => {
    const list = [...filteredStudios];
    list.sort((a, b) => {
      const aInteractions = a.interactionCount ?? 0;
      const bInteractions = b.interactionCount ?? 0;
      if (aInteractions !== bInteractions) return bInteractions - aInteractions;

      if (!filters.sort) {
        return a.name.localeCompare(b.name, "tr");
      }

      const aVal = a.pricePerHour;
      const bVal = b.pricePerHour;
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return filters.sort === "price-asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [filteredStudios, filters.sort]);

  const showPrompt =
    !filters.province && !filters.roomType && !hasAdvancedFilters && !hasAvailabilityFilter && !filters.happyHourOnly;

  const handleFiltersChange = (next: StudioFilters) => {
    setFilters(next);
    const query = buildQueryString(next);
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
    const target = query ? `${pathname}?${query}` : pathname;
    if (current === target) return;
    router.replace(target, { scroll: false });
  };

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Stüdyolar</p>
            <p className="text-sm text-[var(--color-muted)]">Filtreleri kullanarak daralt.</p>
          </div>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-24">
            <FilterBar geo={geo} defaults={filters} onChange={handleFiltersChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availabilityPending || availabilityLoading ? (
              Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={`studio-skeleton-${idx}`} />)
            ) : showPrompt ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState title="Önce il veya oda türü seçin" description="Filtre seçerek listeyi görüntüleyin." />
              </div>
            ) : sortedStudios.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState title="Eşleşen stüdyo bulunamadı" description="Filtreleri değiştirerek yeniden deneyin." />
              </div>
            ) : (
              sortedStudios.map((studio) => (
                <StudioCard
                  key={studio.id}
                  name={studio.name}
                  city={studio.address.provinceName}
                  district={studio.address.districtName}
                  price={studio.pricePerHour ? `₺${studio.pricePerHour}/saat` : undefined}
                  badges={studio.badges}
                  imageUrl={studio.imageUrl}
                  happyHourActive={studio.happyHourEnabled}
                  href={`/studyo/${studio.slug}`}
                />
              ))
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
