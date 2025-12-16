"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Section } from "@/components/design-system/components/shared/section";
import { FilterBar } from "@/components/design-system/components/shared/filter-bar";
import { StudioCard } from "@/components/design-system/components/shared/studio-card";
import { EmptyState } from "@/components/design-system/components/shared/empty-state";
import { loadGeo, slugify, type TRGeo } from "@/lib/geo";
import { buildQueryString, parseFiltersFromSearchParams, type StudioFilters } from "@/lib/filters";

type Studio = {
  name: string;
  address: {
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
    neighborhoodId?: string;
  };
  roomTypes: string[];
  pricePerHour?: number;
  badges?: string[];
  imageUrl?: string;
};

function pickAddress(geo: TRGeo, provinceName: string, districtName: string) {
  const provinceSlug = slugify(provinceName);
  const province = geo.find((p) => p.id === provinceSlug || slugify(p.name) === provinceSlug);
  if (!province) return null;

  const districtSlug = `${province.id}-${slugify(districtName)}`;
  const district =
    province.districts.find((d) => d.id === districtSlug || slugify(d.name) === slugify(districtName)) ??
    province.districts[0];

  if (!district) return null;
  const neighborhood = district.neighborhoods?.[0]?.id;

  return {
    provinceId: province.id,
    provinceName: province.name,
    districtId: district.id,
    districtName: district.name,
    neighborhoodId: neighborhood,
  };
}

function buildMockStudios(geo: TRGeo): Studio[] {
  const baseStudios: Array<{
    name: string;
    province: string;
    district: string;
    roomTypes: string[];
    price: number;
    badges: string[];
    imageUrl?: string;
  }> = [
    {
      name: "Kadıköy Sound Lab",
      province: "İstanbul",
      district: "Kadıköy",
      roomTypes: ["prova", "vokal-kabini"],
      price: 450,
      badges: ["Mikrofon", "Amfi"],
      imageUrl: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Boğaz Sessions",
      province: "İstanbul",
      district: "Beşiktaş",
      roomTypes: ["kayit", "kontrol-odasi"],
      price: 700,
      badges: ["Kayıt teknisyeni", "Analog miks"],
      imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ankara Echo",
      province: "Ankara",
      district: "Çankaya",
      roomTypes: ["prova", "kayit-kabini"],
      price: 380,
      badges: ["Backline", "Park yeri"],
      imageUrl: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ege Tonem",
      province: "İzmir",
      district: "Konak",
      roomTypes: ["prova", "davul-odasi"],
      price: 320,
      badges: ["Davul seti", "PA sistemi"],
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Nilüfer Sessions",
      province: "Bursa",
      district: "Nilüfer",
      roomTypes: ["prova"],
      price: 300,
      badges: ["Genç müzisyen indirimi", "24/7"],
      imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return baseStudios
    .map((studio) => {
      const address = pickAddress(geo, studio.province, studio.district);
      if (!address) return null;
      return {
        name: studio.name,
        address,
        roomTypes: studio.roomTypes,
        pricePerHour: studio.price,
        badges: studio.badges,
        imageUrl: studio.imageUrl,
      } satisfies Studio;
    })
    .filter(Boolean) as Studio[];
}

export default function StudioListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const geo = useMemo(() => loadGeo(), []);
  const studios = useMemo(() => buildMockStudios(geo), [geo]);
  const [filters, setFilters] = useState<StudioFilters>(() => parseFiltersFromSearchParams(searchParams));

  useEffect(() => {
    const next = parseFiltersFromSearchParams(searchParams);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((prev) =>
      prev.province === next.province &&
      prev.district === next.district &&
      prev.neighborhood === next.neighborhood
        ? prev
        : next,
    );
  }, [searchParamsString, searchParams]);

  const filteredStudios = useMemo(() => {
    if (!filters.province || !filters.district) return [];

    return studios.filter((studio) => {
      if (studio.address.provinceId !== filters.province) return false;
      if (studio.address.districtId !== filters.district) return false;
      if (filters.neighborhood && studio.address.neighborhoodId !== filters.neighborhood) return false;
      return true;
    });
  }, [filters, studios]);

  const showPrompt = !filters.province || !filters.district;

  const handleFiltersChange = (next: StudioFilters) => {
    setFilters(next);
    const query = buildQueryString(next);
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
    const target = query ? `${pathname}?${query}` : pathname;
    if (current === target) return;
    router.replace(target, { scroll: false });
  };

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
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-24">
            <FilterBar geo={geo} defaults={filters} onChange={handleFiltersChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {showPrompt ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState title="Önce il ve ilçe seçin" description="Şehir ve ilçe seçerek listeyi görüntüleyin." />
              </div>
            ) : filteredStudios.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState title="Eşleşen stüdyo bulunamadı" description="Filtreleri değiştirerek yeniden deneyin." />
              </div>
            ) : (
              filteredStudios.map((studio) => (
                <StudioCard
                  key={`${studio.address.provinceId}-${studio.address.districtId}-${studio.name}`}
                  name={studio.name}
                  city={studio.address.provinceName}
                  district={studio.address.districtName}
                  price={studio.pricePerHour ? `₺${studio.pricePerHour}/saat` : undefined}
                  badges={studio.badges}
                  imageUrl={studio.imageUrl}
                />
              ))
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
