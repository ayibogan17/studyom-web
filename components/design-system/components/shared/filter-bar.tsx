"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import type { TRGeo } from "@/lib/geo";
import type { StudioAdvancedFilters, StudioFilters } from "@/lib/filters";

const roomTypeOptions = [
  { value: "prova-odasi", label: "Prova odası" },
  { value: "vokal-kabini", label: "Vokal kabini" },
  { value: "kayit-kabini", label: "Kayıt kabini" },
  { value: "davul-kabini", label: "Davul kabini" },
  { value: "etut-odasi", label: "Etüt odası" },
];

const yesNoAnyOptions = [
  { value: "", label: "Farketmez" },
  { value: "yes", label: "Var" },
  { value: "no", label: "Yok" },
];

const serviceLevelOptions = [
  { value: "", label: "Farketmez" },
  { value: "none", label: "Yok" },
  { value: "included", label: "Dahil" },
  { value: "extra", label: "Ekstra" },
];

const serviceLevelExtraOptions = [
  { value: "", label: "Farketmez" },
  { value: "none", label: "Yok" },
  { value: "extra", label: "Ekstra" },
];

const dawOptions = ["Logic Pro", "Ableton", "FL Studio", "Pro Tools", "Studio One", "Reaper", "Reason"];

const productionAreaOptions = ["Beat yapımı", "Enstrüman ekleme"];

type FilterBarProps = {
  geo: TRGeo;
  defaults: StudioFilters;
  onChange: (next: StudioFilters) => void;
};

export function FilterBar({ geo, defaults, onChange }: FilterBarProps) {
  const [province, setProvince] = useState(defaults.province ?? "");
  const [district, setDistrict] = useState(defaults.district ?? "");
  const [roomType, setRoomType] = useState(defaults.roomType ?? "");
  const [sort, setSort] = useState(defaults.sort ?? "");
  const [advanced, setAdvanced] = useState<StudioAdvancedFilters>(defaults.advanced ?? {});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setProvince(defaults.province ?? "");
    setDistrict(defaults.district ?? "");
    setRoomType(defaults.roomType ?? "");
    setSort(defaults.sort ?? "");
    setAdvanced(defaults.advanced ?? {});
  }, [defaults.advanced, defaults.district, defaults.province, defaults.roomType, defaults.sort]);

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

  const updateFilters = (next: {
    province?: string;
    district?: string;
    roomType?: string;
    sort?: StudioFilters["sort"];
    advanced?: StudioAdvancedFilters;
  }) => {
    const nextProvince = next.province ?? province;
    const nextDistrict = next.district ?? district;
    const nextRoomType = next.roomType ?? roomType;
    const nextSort = next.sort ?? sort;
    const nextAdvanced = next.advanced ?? advanced;
    onChange({
      province: nextProvince,
      district: nextDistrict,
      roomType: nextRoomType,
      sort: nextSort,
      advanced: nextAdvanced,
    });
  };

  return (
    <div className="sticky top-20 z-10">
      <Card className="hidden flex-col gap-4 md:flex">
        <FilterFields
          province={province}
          district={district}
          roomType={roomType}
          sort={sort}
          provinces={provinces}
          districts={districts}
          roomTypes={roomTypeOptions}
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
              return;
            }
            if (next.roomType !== undefined) {
              setRoomType(next.roomType);
              updateFilters({ roomType: next.roomType });
              return;
            }
            if (next.sort !== undefined) {
              setSort(next.sort);
              updateFilters({ sort: next.sort });
            }
          }}
        />
        <div className="border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold text-[var(--color-primary)]"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            Gelişmiş arama
            <ChevronDown size={16} className={`transition ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
          {showAdvanced ? (
            <div className="mt-3 space-y-4">
              <AdvancedFields
                value={advanced}
                onChange={(next) => {
                  setAdvanced(next);
                  updateFilters({ advanced: next });
                }}
              />
            </div>
          ) : null}
        </div>
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
            roomType={roomType}
            sort={sort}
            provinces={provinces}
            districts={districts}
            roomTypes={roomTypeOptions}
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
                return;
              }
              if (next.roomType !== undefined) {
                setRoomType(next.roomType);
                updateFilters({ roomType: next.roomType });
                return;
              }
              if (next.sort !== undefined) {
                setSort(next.sort);
                updateFilters({ sort: next.sort });
              }
            }}
          />
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold text-[var(--color-primary)]"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            Gelişmiş arama
            <ChevronDown size={16} className={`transition ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
          {showAdvanced ? (
            <div className="space-y-4">
              <AdvancedFields
                value={advanced}
                isMobile
                onChange={(next) => {
                  setAdvanced(next);
                  updateFilters({ advanced: next });
                }}
              />
            </div>
          ) : null}
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
  roomType: string;
  sort: StudioFilters["sort"];
  provinces: TRGeo;
  districts: TRGeo[number]["districts"];
  roomTypes: Array<{ value: string; label: string }>;
  isMobile?: boolean;
  onChange: (next: { province?: string; district?: string; roomType?: string; sort?: StudioFilters["sort"] }) => void;
};

function FilterFields({
  province,
  district,
  roomType,
  sort,
  provinces,
  districts,
  roomTypes,
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
        <Label htmlFor={`roomtype-${isMobile ? "mobile" : "desktop"}`}>Oda türü</Label>
        <select
          aria-label="Oda türü"
          id={`roomtype-${isMobile ? "mobile" : "desktop"}`}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={roomType}
          onChange={(e) => onChange({ roomType: e.target.value })}
        >
          <option value="">Tüm odalar</option>
          {roomTypes.map((room) => (
            <option key={room.value} value={room.value}>
              {room.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`sort-${isMobile ? "mobile" : "desktop"}`}>Fiyat sıralama</Label>
        <select
          aria-label="Fiyat sıralama"
          id={`sort-${isMobile ? "mobile" : "desktop"}`}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          value={sort ?? ""}
          onChange={(e) => onChange({ sort: e.target.value as StudioFilters["sort"] })}
        >
          <option value="">Varsayılan</option>
          <option value="price-asc">Önce en düşük</option>
          <option value="price-desc">Önce en yüksek</option>
        </select>
      </div>
    </div>
  );
}

type AdvancedFieldsProps = {
  value: StudioAdvancedFilters;
  isMobile?: boolean;
  onChange: (next: StudioAdvancedFilters) => void;
};

type SelectOption = { value: string; label: string };

function AdvancedFields({ value, isMobile, onChange }: AdvancedFieldsProps) {
  const update = (patch: Partial<StudioAdvancedFilters>) => {
    onChange({ ...value, ...patch });
  };

  const toggleArrayValue = (key: "dawList" | "recordingProductionAreas", item: string) => {
    const current = value[key] ?? [];
    const exists = current.includes(item);
    const next = exists ? current.filter((v) => v !== item) : [...current, item];
    update({ [key]: next } as Partial<StudioAdvancedFilters>);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionTitle>Genel</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`pricing-model-${isMobile ? "mobile" : "desktop"}`}
            label="Ücret tipi"
            value={value.pricingModel ?? ""}
            onChange={(next) => update({ pricingModel: next as StudioAdvancedFilters["pricingModel"] })}
            options={[
              { value: "", label: "Farketmez" },
              { value: "hourly", label: "Saatlik" },
              { value: "daily", label: "Günlük" },
            ]}
          />
          <InputField
            id={`price-max-${isMobile ? "mobile" : "desktop"}`}
            label="Maksimum ücret"
            value={value.priceMax ?? ""}
            onChange={(next) => update({ priceMax: next })}
            placeholder="Örn: 600"
            type="number"
          />
          <SelectField
            id={`courses-${isMobile ? "mobile" : "desktop"}`}
            label="Kurslara açık mı?"
            value={value.courses ?? ""}
            onChange={(next) => update({ courses: next as StudioAdvancedFilters["courses"] })}
            options={[
              { value: "", label: "Farketmez" },
              { value: "yes", label: "Açık" },
              { value: "no", label: "Kapalı" },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Prova / Kayıt ekipmanları</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`has-drum-${isMobile ? "mobile" : "desktop"}`}
            label="Davul var mı?"
            value={value.hasDrum ?? ""}
            onChange={(next) => update({ hasDrum: next as StudioAdvancedFilters["hasDrum"] })}
            options={yesNoAnyOptions}
          />
          <InputField
            id={`guitar-amp-min-${isMobile ? "mobile" : "desktop"}`}
            label="Gitar amfi (min adet)"
            value={value.guitarAmpMin ?? ""}
            onChange={(next) => update({ guitarAmpMin: next })}
            type="number"
          />
          <SelectField
            id={`has-bass-${isMobile ? "mobile" : "desktop"}`}
            label="Bas amfisi var mı?"
            value={value.hasBassAmp ?? ""}
            onChange={(next) => update({ hasBassAmp: next as StudioAdvancedFilters["hasBassAmp"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`has-di-${isMobile ? "mobile" : "desktop"}`}
            label="DI Box var mı?"
            value={value.hasDiBox ?? ""}
            onChange={(next) => update({ hasDiBox: next as StudioAdvancedFilters["hasDiBox"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`has-keyboard-${isMobile ? "mobile" : "desktop"}`}
            label="Klavye var mı?"
            value={value.hasKeyboard ?? ""}
            onChange={(next) => update({ hasKeyboard: next as StudioAdvancedFilters["hasKeyboard"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`has-stand-${isMobile ? "mobile" : "desktop"}`}
            label="Klavye sehpası var mı?"
            value={value.hasKeyboardStand ?? ""}
            onChange={(next) => update({ hasKeyboardStand: next as StudioAdvancedFilters["hasKeyboardStand"] })}
            options={yesNoAnyOptions}
          />
          <InputField
            id={`extra-guitar-min-${isMobile ? "mobile" : "desktop"}`}
            label="Ekstra gitar (min adet)"
            value={value.extraGuitarMin ?? ""}
            onChange={(next) => update({ extraGuitarMin: next })}
            type="number"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Vokal kabini</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`vocal-engineer-${isMobile ? "mobile" : "desktop"}`}
            label="Kayıt teknisyeni var mı?"
            value={value.vocalHasEngineer ?? ""}
            onChange={(next) => update({ vocalHasEngineer: next as StudioAdvancedFilters["vocalHasEngineer"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`musician-mic-${isMobile ? "mobile" : "desktop"}`}
            label="Müzisyen kendi mikrofonunu getirebilir mi?"
            value={value.musicianMicAllowed ?? ""}
            onChange={(next) => update({ musicianMicAllowed: next as StudioAdvancedFilters["musicianMicAllowed"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`vocal-autotune-${isMobile ? "mobile" : "desktop"}`}
            label="Canlı autotune hizmeti var mı?"
            value={value.vocalLiveAutotune ?? ""}
            onChange={(next) => update({ vocalLiveAutotune: next as StudioAdvancedFilters["vocalLiveAutotune"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`vocal-raw-${isMobile ? "mobile" : "desktop"}`}
            label="RAW kayıt dahil mi?"
            value={value.vocalRawIncluded ?? ""}
            onChange={(next) => update({ vocalRawIncluded: next as StudioAdvancedFilters["vocalRawIncluded"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`vocal-edit-${isMobile ? "mobile" : "desktop"}`}
            label="Edit hizmeti"
            value={value.vocalEditService ?? ""}
            onChange={(next) => update({ vocalEditService: next as StudioAdvancedFilters["vocalEditService"] })}
            options={serviceLevelOptions}
          />
          <SelectField
            id={`vocal-mix-${isMobile ? "mobile" : "desktop"}`}
            label="Mix / Mastering hizmeti"
            value={value.vocalMixService ?? ""}
            onChange={(next) => update({ vocalMixService: next as StudioAdvancedFilters["vocalMixService"] })}
            options={serviceLevelOptions}
          />
          <SelectField
            id={`vocal-production-${isMobile ? "mobile" : "desktop"}`}
            label="Prodüksiyon hizmeti"
            value={value.vocalProductionService ?? ""}
            onChange={(next) => update({ vocalProductionService: next as StudioAdvancedFilters["vocalProductionService"] })}
            options={serviceLevelOptions}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Davul kabini ekipmanı</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`drum-kick-${isMobile ? "mobile" : "desktop"}`}
            label="Kick var mı?"
            value={value.drumKick ?? ""}
            onChange={(next) => update({ drumKick: next as StudioAdvancedFilters["drumKick"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-snare-${isMobile ? "mobile" : "desktop"}`}
            label="Snare var mı?"
            value={value.drumSnare ?? ""}
            onChange={(next) => update({ drumSnare: next as StudioAdvancedFilters["drumSnare"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-toms-${isMobile ? "mobile" : "desktop"}`}
            label="Tomlar var mı?"
            value={value.drumToms ?? ""}
            onChange={(next) => update({ drumToms: next as StudioAdvancedFilters["drumToms"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-floor-${isMobile ? "mobile" : "desktop"}`}
            label="Floor tom var mı?"
            value={value.drumFloorTom ?? ""}
            onChange={(next) => update({ drumFloorTom: next as StudioAdvancedFilters["drumFloorTom"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-hihat-${isMobile ? "mobile" : "desktop"}`}
            label="Hihat var mı?"
            value={value.drumHihat ?? ""}
            onChange={(next) => update({ drumHihat: next as StudioAdvancedFilters["drumHihat"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-ride-${isMobile ? "mobile" : "desktop"}`}
            label="Ride var mı?"
            value={value.drumRide ?? ""}
            onChange={(next) => update({ drumRide: next as StudioAdvancedFilters["drumRide"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-crash1-${isMobile ? "mobile" : "desktop"}`}
            label="Crash 1 var mı?"
            value={value.drumCrash1 ?? ""}
            onChange={(next) => update({ drumCrash1: next as StudioAdvancedFilters["drumCrash1"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-crash2-${isMobile ? "mobile" : "desktop"}`}
            label="Crash 2 var mı?"
            value={value.drumCrash2 ?? ""}
            onChange={(next) => update({ drumCrash2: next as StudioAdvancedFilters["drumCrash2"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-crash3-${isMobile ? "mobile" : "desktop"}`}
            label="Crash 3 var mı?"
            value={value.drumCrash3 ?? ""}
            onChange={(next) => update({ drumCrash3: next as StudioAdvancedFilters["drumCrash3"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-crash4-${isMobile ? "mobile" : "desktop"}`}
            label="Crash 4 var mı?"
            value={value.drumCrash4 ?? ""}
            onChange={(next) => update({ drumCrash4: next as StudioAdvancedFilters["drumCrash4"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-china-${isMobile ? "mobile" : "desktop"}`}
            label="China var mı?"
            value={value.drumChina ?? ""}
            onChange={(next) => update({ drumChina: next as StudioAdvancedFilters["drumChina"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-splash-${isMobile ? "mobile" : "desktop"}`}
            label="Splash var mı?"
            value={value.drumSplash ?? ""}
            onChange={(next) => update({ drumSplash: next as StudioAdvancedFilters["drumSplash"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`drum-cowbell-${isMobile ? "mobile" : "desktop"}`}
            label="Cowbell var mı?"
            value={value.hasCowbell ?? ""}
            onChange={(next) => update({ hasCowbell: next as StudioAdvancedFilters["hasCowbell"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`twin-pedal-${isMobile ? "mobile" : "desktop"}`}
            label="Twin pedal"
            value={value.hasTwinPedal ?? ""}
            onChange={(next) => update({ hasTwinPedal: next as StudioAdvancedFilters["hasTwinPedal"] })}
            options={yesNoAnyOptions}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Davul kabini ekstraları</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`drum-pro-${isMobile ? "mobile" : "desktop"}`}
            label="Profesyonel davul kaydı"
            value={value.drumProRecording ?? ""}
            onChange={(next) => update({ drumProRecording: next as StudioAdvancedFilters["drumProRecording"] })}
            options={serviceLevelOptions}
          />
          <SelectField
            id={`drum-video-${isMobile ? "mobile" : "desktop"}`}
            label="Video çekimi"
            value={value.drumVideo ?? ""}
            onChange={(next) => update({ drumVideo: next as StudioAdvancedFilters["drumVideo"] })}
            options={serviceLevelOptions}
          />
          <SelectField
            id={`drum-production-${isMobile ? "mobile" : "desktop"}`}
            label="Davul prodüksiyonu"
            value={value.drumProduction ?? ""}
            onChange={(next) => update({ drumProduction: next as StudioAdvancedFilters["drumProduction"] })}
            options={serviceLevelExtraOptions}
          />
          <SelectField
            id={`drum-mix-${isMobile ? "mobile" : "desktop"}`}
            label="Davul mix/mastering"
            value={value.drumMix ?? ""}
            onChange={(next) => update({ drumMix: next as StudioAdvancedFilters["drumMix"] })}
            options={serviceLevelExtraOptions}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Kayıt kabini</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            id={`rec-engineer-${isMobile ? "mobile" : "desktop"}`}
            label="Kayıt teknisyeni dahil mi?"
            value={value.recordingEngineerIncluded ?? ""}
            onChange={(next) => update({ recordingEngineerIncluded: next as StudioAdvancedFilters["recordingEngineerIncluded"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`rec-control-${isMobile ? "mobile" : "desktop"}`}
            label="Control Room var mı?"
            value={value.hasControlRoom ?? ""}
            onChange={(next) => update({ hasControlRoom: next as StudioAdvancedFilters["hasControlRoom"] })}
            options={yesNoAnyOptions}
          />
          <SelectField
            id={`rec-mix-${isMobile ? "mobile" : "desktop"}`}
            label="Edit / Mix / Mastering"
            value={value.recordingMixService ?? ""}
            onChange={(next) => update({ recordingMixService: next as StudioAdvancedFilters["recordingMixService"] })}
            options={serviceLevelExtraOptions}
          />
          <SelectField
            id={`rec-production-${isMobile ? "mobile" : "desktop"}`}
            label="Prodüksiyon hizmeti"
            value={value.recordingProduction ?? ""}
            onChange={(next) => update({ recordingProduction: next as StudioAdvancedFilters["recordingProduction"] })}
            options={serviceLevelExtraOptions}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-primary)]">DAW</p>
          <div className="flex flex-wrap gap-2">
            {dawOptions.map((daw) => {
              const active = (value.dawList ?? []).includes(daw);
              return (
                <button
                  key={daw}
                  type="button"
                  onClick={() => toggleArrayValue("dawList", daw)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-secondary)] text-[var(--color-primary)]"
                  }`}
                >
                  {daw}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-primary)]">Prodüksiyon alanları</p>
          <div className="flex flex-wrap gap-2">
            {productionAreaOptions.map((label) => {
              const active = (value.recordingProductionAreas ?? []).includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleArrayValue("recordingProductionAreas", label)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-secondary)] text-[var(--color-primary)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="text-sm font-semibold text-[var(--color-primary)]">{children}</p>;
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="space-y-1 text-sm text-[var(--color-primary)]" htmlFor={id}>
      <span className="text-xs font-semibold">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
}) {
  return (
    <label className="space-y-1 text-sm text-[var(--color-primary)]" htmlFor={id}>
      <span className="text-xs font-semibold">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
