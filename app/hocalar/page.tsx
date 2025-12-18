import type { Metadata } from "next";
import { Suspense } from "react";
import TeachersPageClient from "./teachers-page-client";

export const metadata: Metadata = {
  title: "Hocalar | Studyom",
  description: "Enstrüman ve prodüksiyon eğitmenlerini şehir, ders tipi ve seviyeye göre filtrele.",
};

export const dynamic = "force-dynamic";

export default function TeachersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <TeachersPageClient searchParams={searchParams} />
    </Suspense>
  );
}
