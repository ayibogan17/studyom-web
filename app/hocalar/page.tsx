import type { Metadata } from "next";
import { Suspense } from "react";
import TeachersPageClient from "./teachers-page-client";
import { getTeachersMock } from "@/data/teachers";
import { getApprovedTeachers } from "@/lib/teacher-db";

export const metadata: Metadata = {
  title: "Hocalar | Studyom",
  description: "Enstrüman ve prodüksiyon eğitmenlerini şehir, ders tipi ve seviyeye göre filtrele.",
};

export const dynamic = "force-dynamic";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const approved = await getApprovedTeachers();
  const teachers = [...approved, ...getTeachersMock()];
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <TeachersPageClient searchParams={searchParams} initialTeachers={teachers} />
    </Suspense>
  );
}
