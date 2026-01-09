"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
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
    linkPortfolio: urlOptional,
    linkGoogle: urlOptional,
    ackAuthority: z.boolean().refine((v) => v === true, "Onay gerekli"),
    ackPlatform: z.boolean().refine((v) => v === true, "Onay gerekli"),
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
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
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
      linkPortfolio: "",
      linkGoogle: "",
      ackAuthority: false,
      ackPlatform: false,
    },
  });

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

  const nextStep = () => setStep((s) => Math.min(2, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["phone", "applicantRole", "studioName", "city", "district", "neighborhood", "address", "mapsUrl"],
    2: ["linkPortfolio", "linkGoogle", "ackAuthority", "ackPlatform"],
  };

  const handleNextStep = async () => {
    const fields = stepFields[step] ?? [];
    const ok = await trigger(fields, { shouldFocus: true });
    if (!ok) return;
    nextStep();
  };

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
            <span className={step === 2 ? "font-semibold text-[var(--color-primary)]" : ""}>2. Doğrulama & Onay</span>
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

            </Card>
          )}

          {step === 2 && (
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
            {step < 2 ? (
              <Button type="button" variant="primary" onClick={handleNextStep}>
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
