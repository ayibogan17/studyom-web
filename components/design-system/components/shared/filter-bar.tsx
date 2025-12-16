"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import type { TRGeo } from "@/lib/geo";
import type { StudioFilters } from "@/lib/filters";

type FilterBarProps = {
  geo: TRGeo;
  defaults: StudioFilters;
  onChange: (next: StudioFilters) => void;
};

export function FilterBar({ geo, defaults, onChange }: FilterBarProps) {
  const [province, setProvince] = useState(defaults.province ?? "");
  const [district, setDistrict] = useState(defaults.district ?? "");
  const [neighborhood, setNeighborhood] = useState(defaults.neighborhood ?? "");

  useEffect(() => {
    setProvince(defaults.province ?? "");
    setDistrict(defaults.district ?? "");
    setNeighborhood(defaults.neighborhood ?? "");
  }, [defaults.province, defaults.district, defaults.neighborhood]);

  const provinces = useMemo(() => {
    const collator = new Intl.Collator("tr");
    const priority = ["istanbul", "izmir", "ankara"];
    return [...geo].sort((a, b) => {
      const aPri = priority.indexOf(a.slug ?? a.id);
      const bPri = priority.indexOf(b.slug ?? b.id);
      if (aPri !== -1 || bPri !== -1) {
        if (aPri === -1) return 1;
        if (bPri === -1) return -1;
        return aPri - bPri;
      }
      return collator.compare(a.name, b.name);
    });
  }, [geo]);

  const selectedProvince = provinces.find((p) => p.id === province);
  const districts = selectedProvince?.districts ?? [];
  const selectedDistrict = districts.find((d) => d.id === district);
  const neighborhoods = selectedDistrict?.neighborhoods ?? [];

  const updateFilters = (next: { province?: string; district?: string; neighborhood?: string }) => {
    const nextProvince = next.province ?? province;
    const nextDistrict = next.district ?? district;
    const nextNeighborhood = (next.neighborhood ?? neighborhood) || undefined;
    onChange({
      province: nextProvince,
      district: nextDistrict,
      neighborhood: nextNeighborhood,
    });
  };

  return (
    <div className="sticky top-20 z-10">
      <Card className="hidden flex-col gap-4 md:flex">
        <FilterFields
          province={province}
          district={district}
          neighborhood={neighborhood}
          provinces={provinces}
          districts={districts}
          neighborhoods={neighborhoods}
          onChange={(next) => {
            if (next.province !== undefined) {
              setProvince(next.province);
              setDistrict("");
              setNeighborhood("");
              updateFilters({ province: next.province, district: "", neighborhood: "" });
              return;
            }
            if (next.district !== undefined) {
              setDistrict(next.district);
              setNeighborhood("");
              updateFilters({ district: next.district, neighborhood: "" });
              return;
            }
            if (next.neighborhood !== undefined) {
              setNeighborhood(next.neighborhood);
              updateFilters({ neighborhood: next.neighborhood });
            }
          }}
        />
      </Card>
      <Card className="md:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--color-primary)]"
          onClick={() => updateFilters({})}
        >
          Filtrele
          <SlidersHorizontal size={16} />
        </button>
        <div className="mt-4 space-y-3">
          <FilterFields
            province={province}
            district={district}
            neighborhood={neighborhood}
            provinces={provinces}
            districts={districts}
            neighborhoods={neighborhoods}
            isMobile
            onChange={(next) => {
              if (next.province !== undefined) {
                setProvince(next.province);
                setDistrict("");
                setNeighborhood("");
                updateFilters({ province: next.province, district: "", neighborhood: "" });
                return;
              }
              if (next.district !== undefined) {
                setDistrict(next.district);
                setNeighborhood("");
                updateFilters({ district: next.district, neighborhood: "" });
                return;
              }
              if (next.neighborhood !== undefined) {
                setNeighborhood(next.neighborhood);
                updateFilters({ neighborhood: next.neighborhood });
              }
            }}
          />
          <Button variant="primary" full onClick={() => updateFilters({})}>
            Uygula
          </Button>
        </div>
      </Card>
    </div>
  );
}

type FieldsProps = {
  province: string;
  district: string;
  neighborhood: string;
  provinces: TRGeo;
  districts: TRGeo[number]["districts"];
  neighborhoods: TRGeo[number]["districts"][number]["neighborhoods"];
  isMobile?: boolean;
  onChange: (next: { province?: string; district?: string; neighborhood?: string }) => void;
};

function FilterFields({
  province,
  district,
  neighborhood,
  provinces,
  districts,
  neighborhoods,
  isMobile,
  onChange,
}: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="space-y-1">
        <Label htmlFor={`province-${isMobile ? "mobile" : "desktop"}`}>İl</Label>
        <select
          aria-label="İl"
          id={`province-${isMobile ? "mobile" : "desktop"}`}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={province}
          onChange={(e) => onChange({ province: e.target.value })}
        >
          <option value="">{isMobile ? "Şehir seç" : "Şehir seç"}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`district-${isMobile ? "mobile" : "desktop"}`}>İlçe</Label>
        <select
          aria-label="İlçe"
          id={`district-${isMobile ? "mobile" : "desktop"}`}
          disabled={!province}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={district}
          onChange={(e) => onChange({ district: e.target.value })}
        >
          <option value="">{province ? "İlçe seç" : "Önce il seçin"}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`neighborhood-${isMobile ? "mobile" : "desktop"}`}>Mahalle</Label>
        <select
          aria-label="Mahalle"
          id={`neighborhood-${isMobile ? "mobile" : "desktop"}`}
          disabled={!district}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={neighborhood}
          onChange={(e) => onChange({ neighborhood: e.target.value })}
        >
          <option value="">{district ? "Mahalle (opsiyonel)" : "Önce ilçe seçin"}</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
