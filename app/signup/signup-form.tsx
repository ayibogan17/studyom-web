"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon, MapPin } from "lucide-react";
import { signIn } from "next-auth/react";

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

const schema = z
  .object({
    fullName: z.string().min(2, "Ad Soyad gerekli").max(60),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z.string().min(8, "En az 8 karakter").max(72),
    confirm: z.string().min(8, "En az 8 karakter"),
    city: z.string().min(2, "Şehir seçin"),
    intent: z.array(z.string()).min(1, "En az bir seçim yapın"),
    tos: z.boolean().refine((v) => v === true, "Şartları kabul edin"),
    kvkk: z.boolean().refine((v) => v === true, "KVKK metnini kabul edin"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
      city: "",
      intent: [],
      tos: false,
      kvkk: false,
    },
  });

  const selectedIntent = watch("intent");

  const toggleIntent = (value: string, checked: boolean) => {
    const next = checked ? [...selectedIntent, value] : selectedIntent.filter((v) => v !== value);
    setValue("intent", next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          city: values.city,
          intent: values.intent,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          res.status === 409
            ? "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin."
            : json.error || "Kayıt başarısız";
        setStatus(msg);
        return;
      }
      await signIn("credentials", {
        email: values.email,
        password: values.password,
        callbackUrl: "/onboarding",
      });
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-secondary)] px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg md:p-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Üyelik</p>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Tek hesapla Studyom’a katıl</h1>
            <p className="text-sm text-[var(--color-muted)]">Şehrini ve amacını seç, ihtiyacına göre devam et.</p>
          </header>

          {status ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]"
            >
              {status}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Field label="Ad Soyad" error={errors.fullName?.message}>
              <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                <UserIcon size={16} className="text-[var(--color-muted)]" />
                <input
                  type="text"
                  aria-invalid={!!errors.fullName}
                  className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none"
                  placeholder="Ad Soyad"
                  {...register("fullName")}
                />
              </div>
            </Field>

            <Field label="E-posta" error={errors.email?.message}>
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
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Şifre" error={errors.password?.message}>
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
                    aria-label="Şifre görünürlüğünü değiştir"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="Şifreyi doğrula" error={errors.confirm?.message}>
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
                    aria-label="Şifre görünürlüğünü değiştir"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Şehir" error={errors.city?.message}>
              <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                <MapPin size={16} className="text-[var(--color-muted)]" />
                <select
                  aria-invalid={!!errors.city}
                  className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] focus:outline-none"
                  defaultValue=""
                  {...register("city")}
                >
                  <option value="" disabled>
                    Şehir seçin
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Studyom’u ne için kullanacaksın?" error={errors.intent?.message}>
              <div className="mt-2 grid gap-2">
                {intentOptions.map((opt) => (
                  <label key={opt.value} className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                      checked={selectedIntent.includes(opt.value)}
                      onChange={(e) => toggleIntent(opt.value, e.target.checked)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="space-y-2 text-sm text-[var(--color-primary)]">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  {...register("tos")}
                />
                <span>
                  <Link href="/gizlilik" className="font-semibold hover:text-[var(--color-accent)]">
                    Kullanım Şartları
                  </Link>
                  {" / "}
                  <Link href="/kvkk" className="font-semibold hover:text-[var(--color-accent)]">
                    KVKK
                  </Link>{" "}
                  metnini okudum, kabul ediyorum.
                </span>
              </label>
              {errors.tos ? <span className="block text-xs text-[var(--color-danger)]">{errors.tos.message}</span> : null}

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  {...register("kvkk")}
                />
                <span>Veri işleme aydınlatma metnini okudum.</span>
              </label>
              {errors.kvkk ? <span className="block text-xs text-[var(--color-danger)]">{errors.kvkk.message}</span> : null}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Üye Ol
            </button>
          </form>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[var(--color-primary)]">{label}</label>
      {children}
      {error ? <span className="text-xs text-[var(--color-danger)]">{error}</span> : null}
    </div>
  );
}
