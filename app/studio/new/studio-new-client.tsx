"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Label } from "@/components/design-system/components/ui/label";
import { Input } from "@/components/design-system/components/ui/input";
import { Textarea } from "@/components/design-system/components/ui/textarea";
import { loadGeo, slugify, type TRGeo } from "@/lib/geo";

const geo = loadGeo();
const provincesOrdered: TRGeo = (() => {
  const priority = ["istanbul", "izmir", "ankara"];
  const prioSet = new Set(priority);
  const rest = geo.filter((p) => !prioSet.has(p.slug)).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const prioritized = priority
    .map((slug) => geo.find((p) => p.slug === slug || slugify(p.name) === slug))
    .filter(Boolean) as TRGeo;
  return [...prioritized, ...rest];
})();

const applicantRoles = ["Sahibiyim", "Ortağım", "Yetkili yöneticiyim"] as const;
const contactMethods = ["Phone", "WhatsApp", "Email"] as const;
const roomTypeOptions = ["Prova odası", "Kayıt odası", "Vokal kabini", "Kontrol odası", "Prodüksiyon odası"] as const;
const bookingModes = ["Onaylı talep (ben onaylarım)", "Direkt rezervasyon (sonra açılabilir)"] as const;
const priceRanges = ["500–750", "750–1000", "1000–1500", "1500+"] as const;

const urlOptional = z.string().trim().optional().or(z.literal(""));

const schema = z
  .object({
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => /^(?:90)?5\d{9}$/.test(v), "Format: +90 5xx xxx xx xx"),
    applicantRole: z.enum(applicantRoles),
    studioName: z.string().trim().min(2, "En az 2 karakter").max(80, "En fazla 80 karakter"),
    city: z.string().min(1, "Şehir seçin"),
    district: z.string().trim().min(1, "İlçe gerekli"),
    neighborhood: z.string().trim().min(1, "Mahalle gerekli"),
    address: z.string().trim().min(10, "Açık adres gerekli"),
    mapsUrl: z.string().trim().url("Geçerli bir link girin"),
    contactMethods: z.array(z.enum(contactMethods)).min(1, "En az bir tercih seçin"),
    contactHours: z.string().trim().max(80, "En fazla 80 karakter").optional(),
    roomsCount: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
      z.number().int().min(1, "En az 1").max(10, "En fazla 10"),
    ),
    roomTypes: z.array(z.enum(roomTypeOptions)).min(1, "En az bir oda tipi seçin"),
    isFlexible: z.boolean(),
    weekdayHours: z.string().trim().max(30, "En fazla 30 karakter").optional(),
    weekendHours: z.string().trim().max(30, "En fazla 30 karakter").optional(),
    bookingMode: z.enum(bookingModes),
    equipment: z.object({
      drum: z.boolean(),
      guitarAmp: z.boolean(),
      bassAmp: z.boolean(),
      pa: z.boolean(),
      mic: z.boolean(),
    }),
    equipmentHighlight: z.string().trim().max(200, "En fazla 200 karakter").optional(),
    priceRange: z.enum(priceRanges),
    priceVaries: z.boolean(),
    linkPortfolio: urlOptional,
    linkGoogle: urlOptional,
    ackAuthority: z.boolean().refine((v) => v === true, "Onay gerekli"),
    ackPlatform: z.boolean().refine((v) => v === true, "Onay gerekli"),
  })
  .superRefine((data, ctx) => {
    if (!data.isFlexible) {
      if (!data.weekdayHours) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hafta içi saat girin veya esnek seçin", path: ["weekdayHours"] });
      }
      if (!data.weekendHours) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hafta sonu saat girin veya esnek seçin", path: ["weekendHours"] });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export function StudioNewClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      phone: "",
      applicantRole: "Sahibiyim",
      studioName: "",
      city: "",
      district: "",
      neighborhood: "",
      address: "",
      mapsUrl: "",
      contactMethods: ["Phone"],
      contactHours: "",
      roomsCount: 1,
      roomTypes: [],
      isFlexible: false,
      weekdayHours: "",
      weekendHours: "",
      bookingMode: "Onaylı talep (ben onaylarım)",
      equipment: {
        drum: false,
        guitarAmp: false,
        bassAmp: false,
        pa: false,
        mic: false,
      },
      equipmentHighlight: "",
      priceRange: "500–750",
      priceVaries: false,
      linkPortfolio: "",
      linkGoogle: "",
      ackAuthority: false,
      ackPlatform: false,
    },
  });

  const isFlexible = watch("isFlexible");

  const selectedProvince = provincesOrdered.find((p) => p.id === selectedProvinceId);
  const districts = selectedProvince?.districts ?? [];
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);
  const neighborhoods = selectedDistrict?.neighborhoods ?? [];

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    setLoading(true);
    try {
      const payload = {
        ...values,
        phone: values.phone.replace(/\D/g, ""),
      };
      const res = await fetch("/api/studio/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Başvuru kaydedilemedi");
        setLoading(false);
        return;
      }
      alert("Stüdyo başvurun alındı. İnceleme süresince stüdyon yayında değildir.");
      router.replace("/profile");
    } catch (err) {
      console.error(err);
      setStatus("Beklenmedik hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const contactMethodsSelected = watch("contactMethods");
  const roomTypesSelected = watch("roomTypes");

  const toggleArray = <T extends string>(name: keyof FormValues, value: T) => {
    const current = (watch(name) as string[]) || [];
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue(name as any, next as any, { shouldValidate: true });
  };

  const equipment = watch("equipment");

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Stüdyo Başvurusu
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Stüdyonu ekle</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu form, stüdyonu yayınlamak için ilk adımlardır. Detayları onaydan sonra panelde düzenleyebilirsin.
          </p>
        </div>

        {status ? (
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {status}
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className={step === 1 ? "font-semibold text-[var(--color-primary)]" : ""}>1. Kimlik & İletişim</span>
            <span>•</span>
            <span className={step === 2 ? "font-semibold text-[var(--color-primary)]" : ""}>2. Odalar & Düzen</span>
            <span>•</span>
            <span className={step === 3 ? "font-semibold text-[var(--color-primary)]" : ""}>3. Doğrulama & Onay</span>
          </div>

          {step === 1 && (
            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Telefon</Label>
                <Input
                  type="tel"
                  placeholder="+90 5xx xxx xx xx"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone ? <span className="text-xs text-[var(--color-danger)]">{errors.phone.message}</span> : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Stüdyodaki rolün</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {applicantRoles.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${
                        watch("applicantRole") === role
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)]"
                      }`}
                    >
                      <input
                        type="radio"
                        value={role}
                        checked={watch("applicantRole") === role}
                        onChange={() => setValue("applicantRole", role, { shouldValidate: true })}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                {errors.applicantRole ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.applicantRole.message}</span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Stüdyo adı</Label>
                  <Input placeholder="Stüdyo adı" {...register("studioName")} />
                  {errors.studioName ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.studioName.message}</span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Şehir</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                    value={selectedProvinceId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSelectedProvinceId(next);
                      setSelectedDistrictId("");
                      setValue("city", next, { shouldValidate: true });
                      setValue("district", "", { shouldValidate: true });
                      setValue("neighborhood", "", { shouldValidate: true });
                    }}
                  >
                    <option value="">Şehir seç</option>
                    {provincesOrdered.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.city ? <span className="text-xs text-[var(--color-danger)]">{errors.city.message}</span> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">İlçe</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                    value={selectedDistrictId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSelectedDistrictId(next);
                      setValue("district", next, { shouldValidate: true });
                      setValue("neighborhood", "", { shouldValidate: true });
                    }}
                    disabled={!selectedProvince}
                  >
                    <option value="">{selectedProvince ? "İlçe seç" : "Önce şehir seçin"}</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors.district ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.district.message}</span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Mahalle</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                    value={watch("neighborhood")}
                    onChange={(e) => setValue("neighborhood", e.target.value, { shouldValidate: true })}
                    disabled={!selectedDistrict}
                  >
                    <option value="">{selectedDistrict ? "Mahalle seç" : "Önce ilçe seçin"}</option>
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                  {errors.neighborhood ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.neighborhood.message}</span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Açık adres</Label>
                <Textarea rows={4} placeholder="Mahalle / cadde / sokak bilgisi" {...register("address")} />
                {errors.address ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.address.message}</span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Google Maps linki</Label>
                <Input placeholder="https://maps.google.com/..." {...register("mapsUrl")} />
                {errors.mapsUrl ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.mapsUrl.message}</span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Tercih edilen iletişim</Label>
                <div className="flex flex-wrap gap-2">
                  {contactMethods.map((method) => {
                    const active = contactMethodsSelected.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => toggleArray("contactMethods", method)}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          active
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                            : "border-[var(--color-border)] text-[var(--color-primary)]"
                        }`}
                        aria-pressed={active}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
                {errors.contactMethods ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.contactMethods.message}</span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">İletişim saatleri (opsiyonel)</Label>
                <Input placeholder="Örn: 10:00 - 22:00" {...register("contactHours")} />
                {errors.contactHours ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.contactHours.message}</span>
                ) : null}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="space-y-4 p-6">
              <div className="rounded-xl bg-[var(--color-secondary)] px-4 py-3 text-xs text-[var(--color-muted)]">
                Buradaki tüm bilgiler başvuru sonrası stüdyo panelinden düzenlenebilir. Daha detaylı bilgiler panelden
                eklenecektir.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Oda sayısı</Label>
                  <Input type="number" min={1} max={10} {...register("roomsCount")} />
                  {errors.roomsCount ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.roomsCount.message as string}</span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Oda tipleri</Label>
                  <div className="flex flex-wrap gap-2">
                    {roomTypeOptions.map((opt) => {
                      const active = roomTypesSelected.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleArray("roomTypes", opt)}
                          className={`rounded-full border px-3 py-1 text-sm ${
                            active
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                              : "border-[var(--color-border)] text-[var(--color-primary)]"
                          }`}
                          aria-pressed={active}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {errors.roomTypes ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.roomTypes.message}</span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Çalışma saatleri</Label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                  <input
                    type="checkbox"
                    checked={isFlexible}
                    onChange={(e) => setValue("isFlexible", e.target.checked, { shouldValidate: true })}
                  />
                  Esnek
                </label>
                {!isFlexible && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Input placeholder="Hafta içi: 10:00 - 22:00" {...register("weekdayHours")} />
                      {errors.weekdayHours ? (
                        <span className="text-xs text-[var(--color-danger)]">{errors.weekdayHours.message}</span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="Hafta sonu: 12:00 - 22:00" {...register("weekendHours")} />
                      {errors.weekendHours ? (
                        <span className="text-xs text-[var(--color-danger)]">{errors.weekendHours.message}</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Rezervasyon modu</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {bookingModes.map((mode) => (
                    <label
                      key={mode}
                      className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${
                        watch("bookingMode") === mode
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)]"
                      }`}
                    >
                      <input
                        type="radio"
                        value={mode}
                        checked={watch("bookingMode") === mode}
                        onChange={() => setValue("bookingMode", mode, { shouldValidate: true })}
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
                {errors.bookingMode ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.bookingMode.message}</span>
                ) : null}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Ekipman setleri</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    { key: "drum", label: "Davul seti" },
                    { key: "guitarAmp", label: "Gitar amfi" },
                    { key: "bassAmp", label: "Bas amfi" },
                    { key: "pa", label: "PA / hoparlör" },
                    { key: "mic", label: "Mikrofon" },
                  ] as const).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 rounded-2xl border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={(equipment as any)[item.key]}
                        onChange={(e) =>
                          setValue("equipment", { ...equipment, [item.key]: e.target.checked }, { shouldValidate: true })
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Öne çıkan 3 ekipman (opsiyonel)</Label>
                <Textarea rows={3} maxLength={200} placeholder="Kısa not" {...register("equipmentHighlight")} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Saatlik fiyat aralığı</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {priceRanges.map((price) => (
                    <label
                      key={price}
                      className={`flex items-center gap-2 rounded-2xl border p-3 text-sm ${
                        watch("priceRange") === price
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)]"
                      }`}
                    >
                      <input
                        type="radio"
                        value={price}
                        checked={watch("priceRange") === price}
                        onChange={() => setValue("priceRange", price, { shouldValidate: true })}
                      />
                      <span>{price} TL</span>
                    </label>
                  ))}
                </div>
                {errors.priceRange ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.priceRange.message}</span>
                ) : null}
                <label className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                  <input
                    type="checkbox"
                    {...register("priceVaries")}
                    checked={watch("priceVaries")}
                    onChange={(e) => setValue("priceVaries", e.target.checked, { shouldValidate: true })}
                  />
                  Fiyatlar odaya göre değişir
                </label>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Instagram / web sitesi (opsiyonel)</Label>
                <Input placeholder="https://instagram.com/..." {...register("linkPortfolio")} />
                {errors.linkPortfolio ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.linkPortfolio.message}</span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Google Business linki (opsiyonel)</Label>
                <Input placeholder="https://maps.google.com/..." {...register("linkGoogle")} />
                {errors.linkGoogle ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.linkGoogle.message}</span>
                ) : null}
              </div>

              {(!watch("linkPortfolio") && !watch("linkGoogle")) ? (
                <div className="rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-4 py-3 text-xs text-[var(--color-primary)]">
                  Doğrulama linki eklemediğin için başvurun manuel incelemeye düşebilir.
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
                  <input
                    type="checkbox"
                    {...register("ackAuthority")}
                    checked={watch("ackAuthority")}
                    onChange={(e) => setValue("ackAuthority", e.target.checked, { shouldValidate: true })}
                  />
                  Bu stüdyoyu temsil etmeye yetkiliyim.
                </label>
                {errors.ackAuthority ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.ackAuthority.message}</span>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
                  <input
                    type="checkbox"
                    {...register("ackPlatform")}
                    checked={watch("ackPlatform")}
                    onChange={(e) => setValue("ackPlatform", e.target.checked, { shouldValidate: true })}
                  />
                  <span>
                    <a
                      href="/studyo-sahibi-sartlari"
                      className="text-[var(--color-accent)] underline underline-offset-4 hover:opacity-80"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Stüdyo Sahipleri İçin Kullanım Şartları ve Bilgilendirme Metni
                    </a>
                    {" "}kabul ediyorum.
                  </span>
                </label>
                {errors.ackPlatform ? (
                  <span className="text-xs text-[var(--color-danger)]">{errors.ackPlatform.message}</span>
                ) : null}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={prevStep}>
                Geri
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button type="button" variant="primary" onClick={nextStep}>
                Sonraki
              </Button>
            ) : (
              <Button type="submit" disabled={!isValid || loading}>
                {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>
            )}
          </div>
        </form>
      </Section>
    </main>
  );
}
