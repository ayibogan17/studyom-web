"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/design-system/components/ui/button";
import { Label } from "@/components/design-system/components/ui/label";

const cityOptions = [
  "İstanbul",
  "İzmir",
  "Ankara",
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkâri",
  "Hatay",
  "Iğdır",
  "Isparta",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

const intentOptions = [
  { value: "find-studio", label: "Stüdyo bul / rezervasyon" },
  { value: "production", label: "Prodüksiyon hizmeti al / ver (mix, davul, prodüksiyon)" },
  { value: "lessons", label: "Ders al / ver" },
  { value: "run-studio", label: "Stüdyo işletiyorum" },
];

const schema = z.object({
  fullName: z.string().min(2, "Ad Soyad gerekli"),
  city: z.string().min(2, "Şehir seçin"),
  intent: z.array(z.string()).min(1, "En az bir tercih seçin"),
});

export function CompleteProfileForm({
  defaultFullName,
  defaultCity,
  defaultIntent,
}: {
  defaultFullName: string;
  defaultCity: string;
  defaultIntent: string[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<{ fullName: string; city: string; intent: string[] }>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: defaultFullName,
      city: defaultCity,
      intent: defaultIntent,
    },
  });

  const selectedIntent = watch("intent");

  const toggleIntent = (value: string, checked: boolean) => {
    const next = checked ? [...selectedIntent, value] : selectedIntent.filter((v) => v !== value);
    setValue("intent", next, { shouldValidate: true });
  };

  const onSubmit = async (values: { fullName: string; city: string; intent: string[] }) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Güncellenemedi");
        return;
      }
      router.replace("/profile");
    } catch (err) {
      console.error(err);
      setStatus("Beklenmedik hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {status ? (
        <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
          {status}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="fullName">Ad Soyad</Label>
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
          <UserIcon size={16} className="text-[var(--color-muted)]" />
          <input
            id="fullName"
            type="text"
            aria-label="Ad Soyad"
            className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] focus:outline-none"
            {...register("fullName")}
          />
        </div>
        {errors.fullName ? (
          <span className="text-xs text-[var(--color-danger)]">{errors.fullName.message}</span>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Şehir</Label>
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
          <MapPin size={16} className="text-[var(--color-muted)]" />
          <select
            id="city"
            aria-label="Şehir"
            className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] focus:outline-none"
            {...register("city")}
          >
            <option value="">Şehir seç</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        {errors.city ? (
          <span className="text-xs text-[var(--color-danger)]">{errors.city.message}</span>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Kullanım tercihi (en az birini seç)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {intentOptions.map((option) => {
            const checked = selectedIntent.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-start gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-primary)]"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  checked={checked}
                  onChange={(e) => toggleIntent(option.value, e.target.checked)}
                  aria-label={option.label}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        {errors.intent ? (
          <span className="text-xs text-[var(--color-danger)]">{errors.intent.message}</span>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || loading} className="flex items-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Kaydet ve devam et
        </Button>
      </div>
    </form>
  );
}
