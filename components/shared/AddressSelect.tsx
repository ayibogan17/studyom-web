"use client";

import { useMemo } from "react";
import { loadGeo, type TRGeo } from "@/lib/geo";

type AddressValue = {
  province: string;
  district: string;
  neighborhood?: string;
};

type AddressSelectProps = {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  geo?: TRGeo;
  disabled?: boolean;
};

export function AddressSelect({ value, onChange, geo, disabled }: AddressSelectProps) {
  const geoData = useMemo(() => geo ?? loadGeo(), [geo]);

  const selectedProvince = geoData.find((p) => p.id === value.province);
  const districts = selectedProvince?.districts ?? [];
  const selectedDistrict = districts.find((d) => d.id === value.district);
  const neighborhoods = selectedDistrict?.neighborhoods ?? [];

  const handleProvinceChange = (province: string) => {
    onChange({
      province,
      district: "",
      neighborhood: "",
    });
  };

  const handleDistrictChange = (district: string) => {
    onChange({
      province: value.province,
      district,
      neighborhood: "",
    });
  };

  const handleNeighborhoodChange = (neighborhood: string) => {
    onChange({
      province: value.province,
      district: value.district,
      neighborhood: neighborhood || undefined,
    });
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
        Şehir
        <select
          aria-label="Şehir"
          className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
          value={value.province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Şehir seç</option>
          {geoData.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
        İlçe
        <select
          aria-label="İlçe"
          className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
          value={value.district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!value.province || disabled}
        >
          <option value="">{value.province ? "İlçe seç" : "Önce il seçin"}</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
        Mahalle / Köy
        <select
          aria-label="Mahalle / Köy"
          className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)]"
          value={value.neighborhood ?? ""}
          onChange={(e) => handleNeighborhoodChange(e.target.value)}
          disabled={!value.district || disabled}
        >
          <option value="">{value.district ? "Mahalle (opsiyonel)" : "Önce ilçe seçin"}</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
