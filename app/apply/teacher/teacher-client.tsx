"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Label } from "@/components/design-system/components/ui/label";
import { Textarea } from "@/components/design-system/components/ui/textarea";
import { Badge } from "@/components/design-system/components/ui/badge";

const instrumentOptions = [
  "Keman",
  "Viyola",
  "Viyolonsel",
  "Kontrbas",
  "Flüt",
  "Yan flüt",
  "Klarnet",
  "Saksafon",
  "Trompet",
  "Trombon",
  "Bağlama (kısa/uzun sap)",
  "Cura",
  "Divan sazı",
  "Ud",
  "Kanun",
  "Ney",
  "Kabak kemane",
  "Gitar (elektro/akustik)",
  "Bas gitar",
  "Davul",
  "Piyano / Klavye",
  "Müzik prodüksiyonu",
  "Beat yapımı",
  "Aranje",
  "Mixing",
  "Mastering",
  "Sound design",
  "Müzik teorisi",
  "Armoni",
  "Solfej",
  "Nota okuma",
  "Ritim & tempo",
  "Ear training (kulak eğitimi)",
  "Beste & söz yazımı",
  "DJ’lik",
] as const;

const levelOptions = ["Başlangıç", "Orta", "İleri"] as const;
const formatOptions = ["Yüz yüze", "Online"] as const;
const languageOptions = ["Türkçe", "İngilizce"] as const;
const priceOptions = ["Saatlik 500–750 TL", "Saatlik 750–1000 TL", "Saatlik 1000 TL+", "Ücreti öğrenciyle konuşurum"] as const;

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

const urlOrEmpty = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || normalizeHttpUrl(value) !== null, "Geçerli bir URL girin");
const yearOptions = ["0-1", "2-4", "5-9", "10+"] as const;
const studentOptions = ["Henüz çalışmadım", "1-5", "6-20", "20+"] as const;

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

const schema = z
  .object({
    instruments: z.array(z.enum(instrumentOptions)).min(1, "En az bir alan seçin").max(10, "En fazla 10 seçim"),
    levels: z.array(z.enum(levelOptions)).min(1, "Seviye seçin"),
    formats: z.array(z.enum(formatOptions)).min(1, "En az bir format seçin"),
    city: z.string().optional(),
    languages: z.array(z.enum(languageOptions)),
    price: z.enum(priceOptions).optional(),
    statement: z.string().min(10, "En az 10 karakter").max(400, "En fazla 400 karakter"),
    links: z.array(urlOrEmpty).max(3, "En fazla 3 bağlantı"),
    years: z.enum(yearOptions).optional(),
    students: z.enum(studentOptions).optional(),
    acknowledge: z.boolean().refine((v) => v === true, "Onay gerekli"),
  })
  .superRefine((data, ctx) => {
    if (data.formats.includes("Yüz yüze") && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
    const linkCount = data.links.filter((l) => l.trim().length > 0).length;
    if (linkCount === 0) {
      if (!data.years) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["years"] });
      if (!data.students) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["students"] });
    }
  });

type FormValues = z.infer<typeof schema>;

export function TeacherApplyClient() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      instruments: [],
      levels: [],
      formats: [],
      city: "",
      languages: [],
      price: undefined,
      statement: "",
      links: [""],
      acknowledge: false,
    },
  });

  const formats = watch("formats");
  const links = watch("links");
  const instruments = watch("instruments");

  const selectedCount = useMemo(() => instruments.length, [instruments.length]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setStatus("Gönderiliyor...");
    setLoading(true);
    try {
      const cleanLinks = (values.links || [])
        .map((link) => normalizeHttpUrl(link) || link.trim())
        .filter((link) => link.length > 0);
      const res = await fetch("/api/apply/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, links: cleanLinks }),
      });
      const raw = await res.text();
      const json = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      if (!res.ok) {
        setStatus(json.error || `Başvuru kaydedilemedi (${res.status})`);
        return;
      }
      setStatus("Başvurun alındı. Profiline yönlendiriliyorsun.");
      router.replace("/profile");
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          if (window.location.pathname.includes("/apply/teacher")) {
            window.location.assign("/profile");
          }
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setStatus("Beklenmedik hata");
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    setStatus("Zorunlu alanları doldurun.");
  };

  const toggleInstrument = (value: (typeof instrumentOptions)[number]) => {
    const current = watch("instruments");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("instruments", next, { shouldValidate: true });
  };

  const toggleLevel = (value: (typeof levelOptions)[number]) => {
    const current = watch("levels");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("levels", next, { shouldValidate: true });
  };

  const toggleFormat = (value: (typeof formatOptions)[number]) => {
    const current = watch("formats");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("formats", next, { shouldValidate: true });
  };

  const toggleLanguage = (value: (typeof languageOptions)[number]) => {
    const current = watch("languages");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("languages", next, { shouldValidate: true });
  };

  const updateLink = (idx: number, val: string) => {
    const next = [...(links || [])];
    next[idx] = val;
    setValue("links", next, { shouldValidate: true });
  };

  const addLinkField = () => {
    const next = [...(links || [])];
    if (next.length >= 3) return;
    next.push("");
    setValue("links", next, { shouldValidate: true });
  };

  const removeLinkField = (idx: number) => {
    const next = [...(links || [])];
    next.splice(idx, 1);
    setValue("links", next, { shouldValidate: true });
  };

  const showAltQuestions = (links || []).filter((l) => l.trim()).length === 0;
  const showCity = formats.includes("Yüz yüze");

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Başvuru</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Öğretmen Başvurusu</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu başvuru bir sınav değildir. Öğrencileri ve platform kalitesini korumak için kısa bir değerlendirmedir.
          </p>
        </div>

        <Card className="space-y-5 p-6">
          {status ? (
            <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
              {status}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onError)}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Öğreteceğin alanlar</Label>
                <span className="text-xs text-[var(--color-muted)]">{selectedCount} / 10 seçildi</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {instrumentOptions.map((opt) => {
                  const active = instruments.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleInstrument(opt)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="text-left">{opt}</span>
                      {active ? <Badge variant="muted">Seçili</Badge> : null}
                    </button>
                  );
                })}
              </div>
              {errors.instruments ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.instruments.message}</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Seviyeler</Label>
              <div className="flex flex-wrap gap-2">
                {levelOptions.map((opt) => {
                  const active = watch("levels").includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLevel(opt)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                      }`}
                      aria-pressed={active}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.levels ? <span className="text-xs text-[var(--color-danger)]">{errors.levels.message}</span> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Format</Label>
              <div className="flex flex-wrap gap-2">
                {formatOptions.map((opt) => {
                  const active = formats.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleFormat(opt)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                      }`}
                      aria-pressed={active}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.formats ? <span className="text-xs text-[var(--color-danger)]">{errors.formats.message}</span> : null}
            </div>

            {showCity ? (
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-semibold text-[var(--color-primary)]">
                  Şehir
                </Label>
                <div className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 focus-within:border-[var(--color-accent)]">
                  <select
                    id="city"
                    className="h-full w-full bg-transparent text-sm text-[var(--color-primary)] focus:outline-none"
                    {...register("city")}
                  >
                    <option value="">Şehir seç</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.city ? <span className="text-xs text-[var(--color-danger)]">{errors.city.message}</span> : null}
                <p className="text-xs text-[var(--color-muted)]">Yüz yüze seçtiysen bu alan zorunlu.</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Ders dili (opsiyonel)</Label>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((opt) => {
                  const active = watch("languages").includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLanguage(opt)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                      }`}
                      aria-pressed={active}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Ücret beklentisi (opsiyonel)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {priceOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-primary)]"
                  >
                    <input
                      type="radio"
                      value={opt}
                      checked={watch("price") === opt}
                      onChange={() => setValue("price", opt, { shouldValidate: true })}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statement" className="text-sm font-semibold text-[var(--color-primary)]">
                Kısa açıklama
              </Label>
              <Textarea
                id="statement"
                maxLength={400}
                rows={4}
                placeholder="Ne öğretiyorum, kimler için uygun, nasıl çalışıyorum?"
                className="resize-none"
                {...register("statement")}
              />
              <p className="text-xs text-[var(--color-muted)]">En fazla 400 karakter.</p>
              {errors.statement ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.statement.message}</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Bağlantılar (opsiyonel)</Label>
              <p className="text-xs text-[var(--color-muted)]">
                YouTube, Instagram, SoundCloud, Spotify, Drive veya kişisel site. En fazla 3 bağlantı.
              </p>
              <div className="space-y-2">
                {(links || []).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => updateLink(idx, e.target.value)}
                      className="h-10 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      placeholder="https://"
                    />
                    {links.length > 1 ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => removeLinkField(idx)}>
                        Sil
                      </Button>
                    ) : null}
                  </div>
                ))}
                {links.length < 3 ? (
                  <Button type="button" size="sm" variant="secondary" onClick={addLinkField}>
                    Bağlantı ekle
                  </Button>
                ) : null}
              </div>
            </div>

            {showAltQuestions ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Kaç yıldır bu alanda çalıyorsun?</Label>
                  <div className="flex flex-col gap-2">
                    {yearOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                        <input
                          type="radio"
                          value={opt}
                          checked={watch("years") === opt}
                          onChange={() => setValue("years", opt, { shouldValidate: true })}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {errors.years ? <span className="text-xs text-[var(--color-danger)]">{errors.years.message}</span> : null}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Daha önce kaç öğrenciyle çalıştın?</Label>
                  <div className="flex flex-col gap-2">
                    {studentOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                        <input
                          type="radio"
                          value={opt}
                          checked={watch("students") === opt}
                          onChange={() => setValue("students", opt, { shouldValidate: true })}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {errors.students ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.students.message}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  {...register("acknowledge")}
                />
                <span>
                  <Link
                    href="/hoca-sartlari"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-[var(--color-accent)]"
                  >
                    Hocalar İçin Kullanım Şartları ve Bilgilendirme Metni
                  </Link>{" "}
                  okudum, kabul ediyorum.
                </span>
              </label>
              {errors.acknowledge ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.acknowledge.message}</span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <span className="animate-spin">⏳</span> : null}
                Başvuruyu Gönder
              </Button>
              {!isValid && !loading ? (
                <p className="text-xs text-[var(--color-muted)]">Zorunlu alanları doldurun.</p>
              ) : null}
              <p className="text-xs text-[var(--color-muted)]">
                Başvurun alındıktan sonra inceleme süresince öğretmen olarak listelenmezsin.
              </p>
            </div>
          </form>
        </Card>
      </Section>
    </main>
  );
}
