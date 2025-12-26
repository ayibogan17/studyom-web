import { slugify } from "@/lib/geo";

export type ProducerStatus = "approved" | "pending";

export type ProducerProfile = {
  id: string;
  userId: string;
  displayName: string;
  city?: string | null;
  areas: string[];
  workTypes: string[];
  modes: string[];
  genres: string[];
  statement: string;
  links: string[];
  status: ProducerStatus;
};

export type ProducerFilters = {
  q?: string;
  areas?: string[];
  genres?: string[];
  mode?: string;
  city?: string;
};

function normalizeList(value?: string[]): string[] {
  if (!value) return [];
  return value.map((item) => item.trim()).filter(Boolean);
}

export function listProducers(filters: ProducerFilters, source: ProducerProfile[]): ProducerProfile[] {
  const q = filters.q?.toLowerCase().trim() || "";
  const areas = normalizeList(filters.areas);
  const genres = normalizeList(filters.genres);
  const mode = filters.mode?.trim() || "";
  const city = filters.city?.trim() || "";
  const citySlug = city ? slugify(city) : "";

  return source.filter((producer) => {
    if (mode && !producer.modes.includes(mode)) return false;
    if (areas.length > 0 && !areas.some((area) => producer.areas.includes(area))) return false;
    if (genres.length > 0 && !genres.some((genre) => producer.genres.includes(genre))) return false;
    if (citySlug) {
      const producerCity = producer.city ? slugify(producer.city) : "";
      if (!producerCity || producerCity !== citySlug) return false;
    }
    if (q) {
      const haystack = [
        producer.displayName,
        producer.statement,
        producer.city ?? "",
        producer.areas.join(" "),
        producer.genres.join(" "),
        producer.workTypes.join(" "),
        producer.modes.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
