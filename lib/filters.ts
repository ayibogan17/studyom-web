import { slugify } from "./geo";

export type StudioFilters = {
  province: string;
  district?: string;
  roomType?: string;
  date?: string;
  time?: string;
  duration?: number;
  happyHourOnly?: boolean;
  sort?: "" | "price-asc" | "price-desc";
  advanced?: StudioAdvancedFilters;
};

export const defaultFilters: StudioFilters = {
  province: "",
  district: "",
  roomType: "",
  date: "",
  time: "",
  duration: 60,
  happyHourOnly: false,
  sort: "",
  advanced: {},
};

export type YesNoAny = "" | "yes" | "no";
export type ServiceLevel = "" | "none" | "included" | "extra";
export type ServiceLevelExtra = "" | "none" | "extra";

export type StudioAdvancedFilters = {
  pricingModel?: "" | "hourly" | "daily";
  priceMax?: string;
  courses?: YesNoAny;
  hasDrum?: YesNoAny;
  guitarAmpMin?: string;
  hasBassAmp?: YesNoAny;
  hasDiBox?: YesNoAny;
  hasKeyboard?: YesNoAny;
  hasKeyboardStand?: YesNoAny;
  extraGuitarMin?: string;
  vocalHasEngineer?: YesNoAny;
  musicianMicAllowed?: YesNoAny;
  vocalLiveAutotune?: YesNoAny;
  vocalRawIncluded?: YesNoAny;
  drumKick?: YesNoAny;
  drumSnare?: YesNoAny;
  drumToms?: YesNoAny;
  drumFloorTom?: YesNoAny;
  drumHihat?: YesNoAny;
  drumRide?: YesNoAny;
  drumCrash1?: YesNoAny;
  drumCrash2?: YesNoAny;
  drumCrash3?: YesNoAny;
  drumCrash4?: YesNoAny;
  drumChina?: YesNoAny;
  drumSplash?: YesNoAny;
  hasCowbell?: YesNoAny;
  hasTwinPedal?: YesNoAny;
  dawList?: string[];
  recordingEngineerIncluded?: YesNoAny;
  hasControlRoom?: YesNoAny;
  vocalEditService?: ServiceLevel;
  vocalMixService?: ServiceLevel;
  vocalProductionService?: ServiceLevel;
  drumProRecording?: ServiceLevel;
  drumVideo?: ServiceLevel;
  drumProduction?: ServiceLevelExtra;
  drumMix?: ServiceLevelExtra;
  recordingMixService?: ServiceLevelExtra;
  recordingProduction?: ServiceLevelExtra;
  recordingProductionAreas?: string[];
};

type SearchParamValue = string | string[] | undefined;

function getParamValue(params: URLSearchParams | Record<string, SearchParamValue>, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams | Record<string, SearchParamValue>,
): StudioFilters {
  const provinceRaw = getParamValue(params, "il") || "";
  const districtRaw = getParamValue(params, "ilce") || "";
  const roomTypeRaw = getParamValue(params, "oda") || "";
  const dateRaw = getParamValue(params, "date") || "";
  const timeRaw = getParamValue(params, "time") || "";
  const durationRaw = getParamValue(params, "duration") || "";
  const sortRaw = getParamValue(params, "sira") || "";
  const happyRaw = getParamValue(params, "happy") || "";

  const province = provinceRaw ? slugify(provinceRaw) : "";
  const district = districtRaw ? slugify(districtRaw) : "";
  const roomType = roomTypeRaw ? slugify(roomTypeRaw) : "";
  const sort = sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "";
  const duration = durationRaw ? Number.parseInt(durationRaw, 10) : 60;
  const normalizedDuration = Number.isFinite(duration) && duration > 0 ? duration : 60;
  const happyHourOnly = ["1", "true", "yes"].includes(happyRaw.toLowerCase());

  return {
    province,
    district,
    roomType,
    date: dateRaw,
    time: timeRaw,
    duration: normalizedDuration,
    happyHourOnly,
    sort,
    advanced: {},
  };
}

export function buildQueryString(filters: StudioFilters): string {
  const params = new URLSearchParams();

  if (filters.province) params.set("il", filters.province);
  if (filters.district) params.set("ilce", filters.district);
  if (filters.roomType) params.set("oda", filters.roomType);
  if (filters.date) params.set("date", filters.date);
  if (filters.time) params.set("time", filters.time);
  if (filters.duration) params.set("duration", String(filters.duration));
  if (filters.happyHourOnly) params.set("happy", "1");
  if (filters.sort) params.set("sira", filters.sort);

  return params.toString();
}
