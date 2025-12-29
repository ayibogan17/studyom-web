"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { TRGeo } from "@/lib/geo";

type Props = {
  provinces: TRGeo;
  instruments: string[];
  levels: string[];
};

export function TeacherFilterBar({ provinces, instruments, levels }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const current = {
    city: searchParams.get("city") || "",
    instrument: searchParams.get("instrument") || "",
    lessonType: searchParams.get("lessonType") || "",
    level: searchParams.get("level") || "",
    q: searchParams.get("q") || "",
  };

  const [cityValue, setCityValue] = useState(current.city);

  useEffect(() => {
    setCityValue(current.city);
  }, [current.city, current.instrument, current.lessonType, current.level, current.q]);

  const handleSubmit = (formData: FormData) => {
    const params = new URLSearchParams();
    const city = cityValue || "";
    const instrument = (formData.get("instrument") as string) || "";
    const lessonType = (formData.get("lessonType") as string) || "";
    const level = (formData.get("level") as string) || "";
    const q = (formData.get("q") as string) || "";

    if (city) params.set("city", city);
    if (instrument) params.set("instrument", instrument);
    if (lessonType) params.set("lessonType", lessonType);
    if (level) params.set("level", level);
    if (q) params.set("q", q);

    const qs = params.toString();
    router.replace(qs ? `/hocalar?${qs}` : "/hocalar");
    router.refresh();
  };

  const clear = () => {
    router.replace("/hocalar");
    router.refresh();
  };

  return (
    <form
      className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="city">Şehir</Label>
          <select
            id="city"
            name="city"
            value={cityValue}
            onChange={(e) => {
              setCityValue(e.target.value);
            }}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">Tümü</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="instrument">Enstrüman</Label>
          <select
            id="instrument"
            name="instrument"
            defaultValue={current.instrument}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">Tümü</option>
            {instruments.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="lessonType">Ders tipi</Label>
          <select
            id="lessonType"
            name="lessonType"
            defaultValue={current.lessonType}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">Tümü</option>
            <option value="online">Online</option>
            <option value="in-person">Yüzyüze</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="level">Seviye</Label>
          <select
            id="level"
            name="level"
            defaultValue={current.level}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">Tümü</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-2 lg:col-span-3">
          <Label htmlFor="q">Arama</Label>
          <Input id="q" name="q" placeholder="İsim, enstrüman veya tarz ara" defaultValue={current.q} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm">
          Filtrele
        </Button>
        <Button type="button" onClick={clear} variant="secondary" size="sm">
          Temizle
        </Button>
      </div>
    </form>
  );
}
