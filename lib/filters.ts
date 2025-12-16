import { slugify } from "./geo";

export type StudioFilters = {
  province: string;
  district: string;
  neighborhood?: string;
};

export const defaultFilters: StudioFilters = {
  province: "",
  district: "",
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
  const neighborhoodRaw = getParamValue(params, "mahalle") || undefined;

  const province = provinceRaw ? slugify(provinceRaw) : "";
  const district = districtRaw ? slugify(districtRaw) : "";
  const neighborhood = neighborhoodRaw ? slugify(neighborhoodRaw) : undefined;

  return {
    province,
    district,
    neighborhood,
  };
}

export function buildQueryString(filters: StudioFilters): string {
  const params = new URLSearchParams();

  if (filters.province) params.set("il", filters.province);
  if (filters.district) params.set("ilce", filters.district);
  if (filters.neighborhood) params.set("mahalle", filters.neighborhood);

  return params.toString();
}
