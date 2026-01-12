import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import ProductionPageClient from "./production-client";
import { getProducerListings } from "@/lib/producer-db";

export const metadata: Metadata = {
  title: "Üretim | Studyom",
  description: "Şarkın için doğru üreticiyi bul.",
};

export const dynamic = "force-dynamic";

const getCachedProducers = unstable_cache(
  async () => getProducerListings(),
  ["producers-approved"],
  { revalidate: 60 },
);

export default async function ProductionPage() {
  const producers = await getCachedProducers();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <ProductionPageClient initialProducers={producers} />
    </Suspense>
  );
}
