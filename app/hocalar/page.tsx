import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import TeachersPageClient from "./teachers-page-client";
import { getTeachersMock } from "@/data/teachers";
import { getApprovedTeachers } from "@/lib/teacher-db";

export const metadata: Metadata = {
  title: "Hocalar | Studyom",
  description: "Enstrüman ve prodüksiyon eğitmenlerini şehir, ders tipi ve seviyeye göre filtrele.",
};

export const dynamic = "force-dynamic";

const getCachedApprovedTeachers = unstable_cache(
  async () => getApprovedTeachers(),
  ["teachers-approved"],
  { revalidate: 60 },
);

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const approved = await getCachedApprovedTeachers();
  const teachers = [...approved, ...getTeachersMock()];
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <TeachersPageClient searchParams={searchParams} initialTeachers={teachers} />
    </Suspense>
  );
}
