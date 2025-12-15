"use client";

import { Section } from "@/components/design-system/components/shared/section";
import { FilterBar, type FilterState } from "@/components/design-system/components/shared/filter-bar";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { useState } from "react";

const cities = ["İstanbul", "Ankara", "İzmir"];
const districts = ["Kadıköy", "Beşiktaş", "Çankaya", "Konak"];
const types = ["Prova odası", "Vokal kabini", "Kayıt kabini", "Davul kabini", "Etüt odası"];

export default function StudioListPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const studios = Array.from({ length: 12 }).map((_, i) => ({
    name: `Stüdyo ${i + 1}`,
    city: "İstanbul",
    district: districts[i % districts.length],
    price: "₺400/saat",
    badges: ["Mikrofon", "Amfi"],
  }));

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Stüdyolar</p>
            <p className="text-sm text-[var(--color-muted)]">Filtreleri kullanarak daralt.</p>
          </div>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-24">
            <FilterBar
              cities={cities}
              districts={districts}
              types={types}
              value={filters}
              onChange={setFilters}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {studios.map((studio) => (
              <StudioCard key={studio.name} {...studio} />
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
