"use client";

import { useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail, MapPin, Link as LinkIcon, Phone, User, Building2 } from "lucide-react";
import { AddressSelect } from "@/components/shared/AddressSelect";
import { OAuthButtons } from "@/components/shared/OAuthButtons";
import { loadGeo, type TRGeo } from "@/lib/geo";

const phoneDigits = (value: string) => value.replace(/\D/g, "");
const normalizeHttpUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const schema = z
  .object({
    method: z.enum(["email", "google"]),
    email: z.string().email("Geçerli bir e-posta girin").optional(),
    password: z.string().min(8, "En az 8 karakter").optional(),
    confirm: z.string().optional(),
    fullName: z.string().min(2, "Ad Soyad zorunlu"),
    studioName: z.string().min(2, "Stüdyo adı zorunlu"),
    phone: z
      .string()
      .refine((v) => /^(?:90)?5\d{9}$/.test(phoneDigits(v)), {
        message: "Format: +90 5xx xxx xx xx",
      }),
    province: z.string().min(1, "Şehir seçin"),
    district: z.string().min(1, "İlçe seçin"),
    neighborhood: z.string().optional(),
    mapsUrl: z.string().min(1, "Google Maps linki gerekli").url("Geçerli bir link girin"),
    address: z.string().min(10, "Adres en az 10 karakter olmalı"),
    website: z.preprocess(
      (value) => (typeof value === "string" ? normalizeHttpUrl(value) : value),
      z.string().url("Geçerli bir URL girin").optional().or(z.literal("")),
    ),
    extraInfo: z.string().max(1000, "En fazla 1000 karakter").optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.method === "email") {
      if (!val.email) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "E-posta zorunlu" });
      }
      if (!val.password) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Şifre zorunlu" });
      }
      if (!val.confirm) {
        ctx.addIssue({ code: "custom", path: ["confirm"], message: "Şifreyi doğrulayın" });
      }
      if (val.password && val.confirm && val.password !== val.confirm) {
        ctx.addIssue({ code: "custom", path: ["confirm"], message: "Şifreler eşleşmiyor" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type MapsPreview = { lat: number; lng: number } | null;

const formatPhone = (value: string) => {
  const digits = phoneDigits(value);
  let d = digits;
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return "";
  const parts = ["+90 "];
  if (d.length >= 1) parts.push(d.slice(0, 1));
  if (d.length >= 3) {
    parts.push(d.slice(1, 3));
  } else if (d.length > 1) {
    parts.push(d.slice(1));
  }
  if (d.length >= 6) {
    parts.push(d.slice(3, 6));
  } else if (d.length > 3) {
    parts.push(d.slice(3));
  }
  if (d.length >= 8) parts.push(d.slice(6, 8));
  if (d.length >= 10) parts.push(d.slice(8, 10));
  return parts.join(" ");
};

function parseMapsCoords(url: string): MapsPreview {
  const link = url.trim();
  if (!link) return null;
  const lower = link.toLowerCase();
  if (!lower.includes("map")) return null;

  const dMatch = link.match(/!3d([+-]?\d+\.\d+)!4d([+-]?\d+\.\d+)/);
  if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };

  const qMatch = link.match(/[?&]q=([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  const atMatch = link.match(/@([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const generic = link.match(/([+-]?\d+\.\d+)[ ,]+([+-]?\d+\.\d+)/);
  if (generic) return { lat: parseFloat(generic[1]), lng: parseFloat(generic[2]) };

  return null;
}

export function StudioSignupForm() {
  const geo = useMemo<TRGeo>(() => loadGeo(), []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mapsPreview, setMapsPreview] = useState<MapsPreview>(null);
  const [mapsMessage, setMapsMessage] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: {
      method: "email",
      email: "",
      password: "",
      confirm: "",
      fullName: "",
      studioName: "",
      phone: "",
      province: "",
      district: "",
      neighborhood: "",
      mapsUrl: "",
      address: "",
      website: "",
      extraInfo: "",
    },
  });

  const method = watch("method");
  const province = watch("province");
  const district = watch("district");
  const neighborhood = watch("neighborhood");

  const selectedProvince = geo.find((p) => p.id === province);
  const provinceName = selectedProvince?.name ?? province;
  const selectedDistrict = selectedProvince?.districts.find((d) => d.id === district);
  const districtName = selectedDistrict?.name ?? district;
  const neighborhoodName =
    selectedDistrict?.neighborhoods.find((n) => n.id === neighborhood)?.name ?? neighborhood;

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    setSubmitting(true);
    try {
      const coords = mapsPreview ?? parseMapsCoords(values.mapsUrl);
      const payload = {
        signupMethod: values.method,
        ownerName: values.fullName.trim(),
        studioName: values.studioName.trim(),
        phone: phoneDigits(values.phone),
        city: provinceName,
        district: districtName,
        neighborhood: neighborhoodName,
        address: values.address.trim(),
        googleMapsUrl: values.mapsUrl.trim(),
        email: values.method === "email" ? values.email?.trim() : undefined,
        website: values.website?.trim() || undefined,
        verificationNote: values.extraInfo?.trim() || undefined,
        coords: coords ?? undefined,
      };

      const res = await fetch("/api/signup/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("Formunuz alındı, ekibimize iletildi.");
      } else {
        setStatus(json.error || "Gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMapsPreview = () => {
    const url = getValues("mapsUrl");
    const coords = parseMapsCoords(url);
    if (coords) {
      setMapsPreview(coords);
      setMapsMessage("Google Maps linkinden koordinat bulundu.");
    } else {
      setMapsPreview(null);
      setMapsMessage("Linkten koordinat çıkarılamadı. Paylaş > Kopyala linkini deneyin.");
    }
  };

  const handleMapsVerify = () => {
    if (mapsPreview) {
      setMapsMessage("Harita doğrulandı.");
    } else {
      setMapsMessage("Önce geçerli bir Google Maps linki gösterin.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-secondary)] px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg md:p-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              STÜDYO SAHİBİ ÜYELİK
            </p>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyonu Studyom’a ekle</h1>
            <p className="text-sm text-[var(--color-muted)]">
              Bu form yalnızca stüdyo sahipleri içindir. Kullanıcı kayıt adımları farklıdır.
            </p>
          </header>

          {status ? (
            <div className="mt-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
              {status}
            </div>
          ) : null}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Section title="Giriş yöntemi">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] transition hover:border-[var(--color-accent)]">
                  <input
                    type="radio"
                    value="email"
                    checked={method === "email"}
                    onChange={(e) => setValue("method", e.target.value as FormValues["method"], { shouldValidate: true })}
                  />
                  E-posta ile üye ol
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] transition hover:border-[var(--color-accent)]">
                  <input
                    type="radio"
                    value="google"
                    checked={method === "google"}
                    onChange={(e) => setValue("method", e.target.value as FormValues["method"], { shouldValidate: true })}
                  />
                  Google ile üye ol
                </label>
              </div>
              {method === "google" ? (
                <div className="mt-3 space-y-2">
                  <OAuthButtons label="Google ile üye ol" callbackUrl="/studio-signup" />
                  <p className="text-xs text-[var(--color-muted)]">
                    Google ile doğruladıktan sonra formu doldurup Üyeliği Tamamla butonuna basın.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                    E-posta (kullanıcı adı)
                    <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                      <Mail size={16} className="text-[var(--color-muted)]" />
                      <input
                        type="email"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                        placeholder="ornek@mail.com"
                        {...register("email")}
                      />
                    </div>
                    {errors.email ? (
                      <span className="block text-xs text-[var(--color-danger)]">{errors.email.message}</span>
                    ) : null}
                  </label>

                  <div className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                    Şifre
                    <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                      <Lock size={16} className="text-[var(--color-muted)]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                        placeholder="••••••••"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-pressed={showPassword}
                        aria-label="Şifre görünürlüğünü değiştir"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password ? (
                      <span className="block text-xs text-[var(--color-danger)]">{errors.password.message}</span>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                    Şifreyi doğrula
                    <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                      <Lock size={16} className="text-[var(--color-muted)]" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirm}
                        className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                        placeholder="••••••••"
                        {...register("confirm")}
                      />
                      <button
                        type="button"
                        className="text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-pressed={showConfirm}
                        aria-label="Şifre görünürlüğünü değiştir"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirm ? (
                      <span className="block text-xs text-[var(--color-danger)]">{errors.confirm.message}</span>
                    ) : null}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Sahip bilgileri">
              <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                Ad Soyad
                <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                  <User size={16} className="text-[var(--color-muted)]" />
                  <input
                    type="text"
                    aria-invalid={!!errors.fullName}
                    className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                    placeholder="Adınızı ve soyadınızı yazın"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName ? (
                  <span className="block text-xs text-[var(--color-danger)]">{errors.fullName.message}</span>
                ) : null}
              </label>
            </Section>

            <Section title="Stüdyo bilgileri">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                  Stüdyo Adı
                  <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                    <Building2 size={16} className="text-[var(--color-muted)]" />
                    <input
                      type="text"
                      aria-invalid={!!errors.studioName}
                      className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                      placeholder="Örn: Blue Note Studio"
                      {...register("studioName")}
                    />
                  </div>
                  {errors.studioName ? (
                    <span className="block text-xs text-[var(--color-danger)]">{errors.studioName.message}</span>
                  ) : null}
                </label>

                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                      İletişim Numarası
                      <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                        <Phone size={16} className="text-[var(--color-muted)]" />
                        <input
                          type="tel"
                          aria-invalid={!!errors.phone}
                          className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                          placeholder="+90 5xx xxx xx xx"
                          value={formatPhone(field.value)}
                          onChange={(e) => field.onChange(phoneDigits(e.target.value))}
                        />
                      </div>
                      {errors.phone ? (
                        <span className="block text-xs text-[var(--color-danger)]">{errors.phone.message}</span>
                      ) : null}
                    </label>
                  )}
                />
              </div>

              <AddressSelect
                value={{ province, district, neighborhood }}
                onChange={(next) => {
                  setValue("province", next.province, { shouldValidate: true });
                  setValue("district", next.district, { shouldValidate: true });
                  setValue("neighborhood", next.neighborhood ?? "", { shouldValidate: true });
                }}
                geo={geo}
              />
              {(errors.province || errors.district || errors.neighborhood) && (
                <p className="text-xs text-[var(--color-danger)]">
                  {errors.province?.message || errors.district?.message || errors.neighborhood?.message}
                </p>
              )}

              <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                Google Maps linki (kesin konum)
                <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                  <LinkIcon size={16} className="text-[var(--color-muted)]" />
                  <input
                    type="url"
                    aria-invalid={!!errors.mapsUrl}
                    className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                    placeholder="https://www.google.com/maps/place/.../@41.0,29.0,18z"
                    {...register("mapsUrl")}
                  />
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Paylaş &gt; Kopyala veya adres çubuğundan aldığınız linkte @41.xx,29.xx gibi koordinat olmalı. Haritada
                  göster butonu önce bu linkten pini alır.
                </p>
                {errors.mapsUrl ? (
                  <span className="block text-xs text-[var(--color-danger)]">{errors.mapsUrl.message}</span>
                ) : null}
              </label>

              <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                Açık Adres
                <textarea
                  rows={4}
                  aria-invalid={!!errors.address}
                  className="mt-1 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="Mahalle, cadde, bina ve numara bilgilerini eksiksiz yazın."
                  {...register("address")}
                />
                {errors.address ? (
                  <span className="block text-xs text-[var(--color-danger)]">{errors.address.message}</span>
                ) : null}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                  Stüdyonuzun web sitesi (opsiyonel)
                  <input
                    type="text"
                    className="mt-1 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="https://example.com"
                    {...register("website")}
                  />
                  {errors.website ? (
                    <span className="block text-xs text-[var(--color-danger)]">{errors.website.message}</span>
                  ) : null}
                </label>

                <label className="space-y-1 text-sm font-medium text-[var(--color-primary)]">
                  Stüdyonuzu onaylayabilmemiz için ek bilgi (opsiyonel)
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="Instagram adresiniz, Google işletme sayfanız gibi destekleyici içerikler"
                    {...register("extraInfo")}
                  />
                  {errors.extraInfo ? (
                    <span className="block text-xs text-[var(--color-danger)]">{errors.extraInfo.message}</span>
                  ) : null}
                </label>
              </div>
            </Section>

            <Section title="Haritada doğrula">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-[var(--color-muted)]">
                  Linkten konum alırız; Haritada göster ile koordinatı kontrol edebilir, Haritada doğrula ile onaylayabilirsiniz.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleMapsPreview}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
                  >
                    <MapPin size={16} />
                    Haritada göster
                  </button>
                  <button
                    type="button"
                    onClick={handleMapsVerify}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
                  >
                    Haritada doğrula
                  </button>
                </div>
              </div>
              {mapsMessage && <p className="text-xs text-[var(--color-muted)]">{mapsMessage}</p>}
              {mapsPreview ? (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-4 py-3 text-sm text-[var(--color-primary)]">
                  <div>
                    <p className="font-semibold">Koordinatlar</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {mapsPreview.lat.toFixed(5)}, {mapsPreview.lng.toFixed(5)}
                    </p>
                  </div>
                  <a
                    href={getValues("mapsUrl")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
                  >
                    Haritada aç
                  </a>
                </div>
              ) : null}
            </Section>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Üyeliği Tamamla
              </button>
              <p className="text-center text-xs text-[var(--color-muted)]">
                Formunuz ekibimiz tarafından incelenip onaylanacaktır.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4">
      <p className="text-sm font-semibold text-[var(--color-primary)]">{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
