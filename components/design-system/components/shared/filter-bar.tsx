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

  useEffect(() => {
    setProvince(defaults.province ?? "");
    setDistrict(defaults.district ?? "");
  }, [defaults.province, defaults.district]);

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

  const updateFilters = (next: { province?: string; district?: string }) => {
    const nextProvince = next.province ?? province;
    const nextDistrict = next.district ?? district;
    onChange({
      province: nextProvince,
      district: nextDistrict,
    });
  };

  return (
    <div className="sticky top-20 z-10">
      <Card className="hidden flex-col gap-4 md:flex">
        <FilterFields
          province={province}
          district={district}
          provinces={provinces}
          districts={districts}
          onChange={(next) => {
            if (next.province !== undefined) {
              setProvince(next.province);
              setDistrict("");
              updateFilters({ province: next.province, district: "" });
              return;
            }
            if (next.district !== undefined) {
              setDistrict(next.district);
              updateFilters({ district: next.district });
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
            provinces={provinces}
            districts={districts}
            isMobile
            onChange={(next) => {
              if (next.province !== undefined) {
                setProvince(next.province);
                setDistrict("");
                updateFilters({ province: next.province, district: "" });
                return;
              }
              if (next.district !== undefined) {
                setDistrict(next.district);
                updateFilters({ district: next.district });
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
  provinces: TRGeo;
  districts: TRGeo[number]["districts"];
  isMobile?: boolean;
  onChange: (next: { province?: string; district?: string }) => void;
};

function FilterFields({
  province,
  district,
  provinces,
  districts,
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
    </div>
  );
}
