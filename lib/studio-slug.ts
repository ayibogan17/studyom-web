import { slugify } from "@/lib/geo";

const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function createStudioSlug(name: string, suffix?: number): string {
  const base = slugify(name);
  if (typeof suffix === "number" && suffix > 0) {
    return `${base}-${suffix}`;
  }
  return base;
}

export function buildUniqueStudioSlug(name: string, usedSlugs: Set<string>): string {
  let counter = 0;
  let candidate = createStudioSlug(name);
  while (usedSlugs.has(candidate)) {
    counter += 1;
    candidate = createStudioSlug(name, counter);
  }
  return candidate;
}

export function parseStudioIdFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const parts = slug.split("-").filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  return last && CUID_REGEX.test(last) ? last : null;
}
