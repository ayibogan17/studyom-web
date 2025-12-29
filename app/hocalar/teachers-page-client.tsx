"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TeacherCard } from "@/components/design-system/components/teachers/teacher-card";
import { TeacherFilterBar } from "@/components/design-system/components/teachers/teacher-filter-bar";
import { Section } from "@/components/design-system/components/shared/section";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";
import { listTeachers, teacherFilterOptions, type TeacherFilters } from "@/lib/teachers";
import { loadGeo, slugify, type TRGeo } from "@/lib/geo";
import type { Teacher } from "@/data/teachers";

function parseFilters(params: URLSearchParams): TeacherFilters {
  const norm = (v: string | null) => v || "";
  const lessonTypeRaw = params.get("lessonType");
  const lessonType =
    lessonTypeRaw === "online" || lessonTypeRaw === "in-person" ? lessonTypeRaw : "";
  return {
    city: norm(params.get("city")),
    district: norm(params.get("district")),
    instrument: norm(params.get("instrument")),
    lessonType: lessonType as TeacherFilters["lessonType"],
    level: norm(params.get("level")),
    q: norm(params.get("q")),
  };
}

export default function TeachersPageClient({
  initialTeachers,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  initialTeachers: Teacher[];
}) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const teachers = useMemo(() => listTeachers(filters, initialTeachers), [filters, initialTeachers]);
  const { instruments, levels } = teacherFilterOptions(initialTeachers);
  const geo = useMemo(() => loadGeo(), []);

  const provincesOrdered: TRGeo = useMemo(() => {
    const priority = ["istanbul", "izmir", "ankara"];
    const prioSet = new Set(priority);
    const rest = geo.filter((p) => !prioSet.has(slugify(p.name))).sort((a, b) => a.name.localeCompare(b.name, "tr"));
    const prioritized = priority
      .map((slug) => geo.find((p) => slugify(p.name) === slug))
      .filter(Boolean) as TRGeo;
    return [...prioritized, ...rest];
  }, [geo]);

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Hocalar</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Eğitmenleri keşfet</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Studyom ders satmaz, stüdyo ayarlamaz. Eğitmenle tanışırsın, planlamayı aranızda yaparsınız.
          </p>
        </div>

        <TeacherFilterBar provinces={provincesOrdered} instruments={instruments} levels={levels} />

        {teachers.length === 0 ? (
          <Card className="flex flex-col items-start gap-3 p-6">
            <p className="text-base font-semibold text-[var(--color-primary)]">Sonuç bulunamadı</p>
            <p className="text-sm text-[var(--color-muted)]">Filtreleri temizleyip tekrar deneyin.</p>
            <Button asChild size="sm">
              <Link href="/hocalar">Filtreleri temizle</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}
