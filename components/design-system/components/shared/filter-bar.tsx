import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export type FilterState = {
  city?: string;
  district?: string;
  type?: string;
  maxPrice?: number;
};

type FilterBarProps = {
  cities: string[];
  districts: string[];
  types: string[];
  value: FilterState;
  onChange: (next: FilterState) => void;
};

export function FilterBar({ cities, districts, types, value, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const setField = <K extends keyof FilterState>(key: K, v: FilterState[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="sticky top-20 z-10">
      <Card className="hidden items-center gap-4 md:flex">
        <FilterFields
          cities={cities}
          districts={districts}
          types={types}
          value={value}
          onChange={onChange}
          compact
          setField={setField}
        />
      </Card>
      <Card className="md:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--color-primary)]"
          onClick={() => setOpen((v) => !v)}
        >
          Filtrele
          <SlidersHorizontal size={16} />
        </button>
        {open ? (
          <div className="mt-4 space-y-3">
            <FilterFields
              cities={cities}
              districts={districts}
              types={types}
              value={value}
              onChange={onChange}
              setField={setField}
            />
            <Button variant="primary" full onClick={() => setOpen(false)}>
              Uygula
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

type FieldsProps = FilterBarProps & {
  compact?: boolean;
  setField: <K extends keyof FilterState>(key: K, v: FilterState[K]) => void;
};

function FilterFields({ cities, districts, types, value, compact, setField }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="city">Şehir</Label>
        <select
          id="city"
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={value.city || ""}
          onChange={(e) => setField("city", e.target.value || undefined)}
        >
          <option value="">Hepsi</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="district">İlçe</Label>
        <select
          id="district"
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={value.district || ""}
          onChange={(e) => setField("district", e.target.value || undefined)}
        >
          <option value="">Hepsi</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Oda türü</Label>
        <select
          id="type"
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={value.type || ""}
          onChange={(e) => setField("type", e.target.value || undefined)}
        >
          <option value="">Hepsi</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Maksimum fiyat</Label>
        <div className="flex items-center gap-3">
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            placeholder="₺"
            value={value.maxPrice ?? ""}
            onChange={(e) => setField("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
          {!compact && <span className="text-xs text-[var(--color-muted)]">saatlik</span>}
        </div>
      </div>
    </div>
  );
}
