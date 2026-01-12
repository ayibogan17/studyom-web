import type { Metadata } from "next";

const PRODUCTION_SEO_ENV = "NEXT_PUBLIC_PRODUCTION_SEO_INDEXING";

export function isProductionIndexingOn(): boolean {
  return (process.env[PRODUCTION_SEO_ENV] ?? "on") === "on";
}

export function productionRobots(): Metadata["robots"] {
  return isProductionIndexingOn() ? { index: true, follow: true } : { index: false, follow: true };
}

/*
  Toggle production SEO landing page indexing:
  - OFF: set NEXT_PUBLIC_PRODUCTION_SEO_INDEXING=off
  - ON:  set NEXT_PUBLIC_PRODUCTION_SEO_INDEXING=on (default)
  Note: This helper is used only by Production SEO landing pages.
*/
