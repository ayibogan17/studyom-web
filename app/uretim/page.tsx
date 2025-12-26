import type { Metadata } from "next";
import { Suspense } from "react";
import ProductionPageClient from "./production-client";
import { getProducerListings } from "@/lib/producer-db";

export const metadata: Metadata = {
  title: "Üretim | Studyom",
  description: "Şarkın için doğru üreticiyi bul.",
};

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const producers = await getProducerListings();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <ProductionPageClient initialProducers={producers} />
    </Suspense>
  );
}
