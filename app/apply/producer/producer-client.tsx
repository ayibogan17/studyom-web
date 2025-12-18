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

const productionAreas = [
  "Davul yazımı",
  "Bas yazımı",
  "Gitar yazımı",
  "Telli enstrüman yazımı",
  "Üflemeli enstrüman yazımı",
  "Yaylı enstrüman yazımı",
  "Beat yapımı",
  "Aranje",
  "Müzik prodüksiyonu",
  "Mixing",
  "Mastering",
  "Sound design",
  "Beste & söz yazımı",
  "DJ edit / set hazırlama",
] as const;

const workTypes = [
  "Şarkıya ekleme yapma (enstrüman, synth vs)",
  "Var olan projeye katkı",
  "Baştan sona prodüksiyon",
  "Revizyon / edit",
] as const;
const workingModes = ["Online", "Kendi stüdyomda", "Müşteri stüdyosunda"] as const;
const genreOptions = [
  "Rock",
  "Metal",
  "Pop",
  "Hip-hop / Rap",
  "Electronic",
  "Jazz",
  "Folk / Türk halk müziği",
  "Classical",
  "Experimental",
] as const;
const priceOptions = ["Proje bazlı çalışırım", "Saatlik çalışırım", "İşe göre değişir"] as const;
const portfolioCount = { min: 0, max: 5 } as const;
const projectCountOptions = ["1-5", "6-20", "20+"] as const;
const yearsOptions = ["0-1", "2-4", "5-9", "10+"] as const;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const urlOrEmpty = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isHttpUrl(value), "Geçerli bir URL girin");

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
] as const;

const schema = z
  .object({
    areas: z.array(z.enum(productionAreas)).min(1, "En az bir alan seçin").max(10, "En fazla 10 seçim"),
    workTypes: z.array(z.enum(workTypes)).min(1, "En az bir çalışma tipi seçin"),
    modes: z.array(z.enum(workingModes)).min(1, "En az bir çalışma modu seçin"),
    city: z.string().optional(),
    genres: z.array(z.enum(genreOptions)).max(5, "En fazla 5 tür seçin"),
    statement: z.string().min(10, "En az 10 karakter").max(400, "En fazla 400 karakter"),
    links: z.array(urlOrEmpty).max(portfolioCount.max, `En fazla ${portfolioCount.max} bağlantı`),
    projects: z.enum(projectCountOptions).optional(),
    years: z.enum(yearsOptions).optional(),
    price: z.enum(priceOptions).optional(),
    acknowledge: z.boolean().refine((v) => v === true, "Onay gerekli"),
  })
  .superRefine((data, ctx) => {
    if ((data.modes.includes("Kendi stüdyomda") || data.modes.includes("Müşteri stüdyosunda")) && !data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Şehir gerekli", path: ["city"] });
    }
    const linkCount = data.links.filter((l) => l.trim().length > 0).length;
    if (linkCount === 0) {
      if (!data.projects) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["projects"] });
      if (!data.years) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bu alanı doldurun", path: ["years"] });
    }
  });

type FormValues = z.infer<typeof schema>;

export function ProducerApplyClient() {
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
    defaultValues: {
      areas: [],
      workTypes: [],
      modes: [],
      city: "",
      genres: [],
      statement: "",
      links: [""],
      acknowledge: false,
    },
  });

  const areas = watch("areas");
  const modes = watch("modes");
  const links = watch("links");

  const selectedCount = useMemo(() => areas.length, [areas.length]);

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    setLoading(true);
    try {
      const cleanLinks = (values.links || []).filter((l) => l.trim().length > 0);
      const res = await fetch("/api/apply/producer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, links: cleanLinks }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Başvuru kaydedilemedi");
        return;
      }
      setStatus("Başvurun alındı. İnceleme süresince üretici olarak listelenmezsin.");
      router.replace("/profile");
    } catch (err) {
      console.error(err);
      setStatus("Beklenmedik hata");
    } finally {
      setLoading(false);
    }
  };

  const toggleArea = (value: (typeof productionAreas)[number]) => {
    const current = watch("areas");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("areas", next, { shouldValidate: true });
  };

  const toggleWorkType = (value: (typeof workTypes)[number]) => {
    const current = watch("workTypes");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("workTypes", next, { shouldValidate: true });
  };

  const toggleMode = (value: (typeof workingModes)[number]) => {
    const current = watch("modes");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("modes", next, { shouldValidate: true });
  };

  const toggleGenre = (value: (typeof genreOptions)[number]) => {
    const current = watch("genres");
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setValue("genres", next, { shouldValidate: true });
  };

  const updateLink = (idx: number, val: string) => {
    const next = [...(links || [])];
    next[idx] = val;
    setValue("links", next, { shouldValidate: true });
  };

  const addLinkField = () => {
    const next = [...(links || [])];
    if (next.length >= portfolioCount.max) return;
    next.push("");
    setValue("links", next, { shouldValidate: true });
  };

  const removeLinkField = (idx: number) => {
    const next = [...(links || [])];
    next.splice(idx, 1);
    setValue("links", next, { shouldValidate: true });
  };

  const linkCount = (links || []).filter((l) => l.trim()).length;
  const showAltQuestions = linkCount === 0;
  const showCity = modes.includes("Kendi stüdyomda") || modes.includes("Müşteri stüdyosunda");

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Başvuru</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Üretici Başvurusu</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu başvuru bir vitrin değildir. Üretim yapabilme yeterliliğini anlamak için hazırlanmıştır.
          </p>
        </div>

        <Card className="space-y-5 p-6">
          {status ? (
            <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
              {status}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold text-[var(--color-primary)]">Üretim alanların</Label>
                <span className="text-xs text-[var(--color-muted)]">{selectedCount} / 10 seçildi</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {productionAreas.map((opt) => {
                  const active = areas.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleArea(opt)}
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
              {errors.areas ? <span className="text-xs text-[var(--color-danger)]">{errors.areas.message}</span> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Çalışma tipi</Label>
              <div className="flex flex-wrap gap-2">
                {workTypes.map((opt) => {
                  const active = watch("workTypes").includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleWorkType(opt)}
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
              {errors.workTypes ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.workTypes.message}</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Çalışma modu</Label>
              <div className="flex flex-wrap gap-2">
                {workingModes.map((opt) => {
                  const active = modes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMode(opt)}
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
              {errors.modes ? <span className="text-xs text-[var(--color-danger)]">{errors.modes.message}</span> : null}
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
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Türler (opsiyonel)</Label>
              <p className="text-xs text-[var(--color-muted)]">En fazla 5 seçim.</p>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((opt) => {
                  const active = watch("genres").includes(opt);
                  const disabled = !active && watch("genres").length >= 5;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleGenre(opt)}
                      disabled={disabled}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                      }`}
                      aria-pressed={active}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.genres ? <span className="text-xs text-[var(--color-danger)]">{errors.genres.message}</span> : null}
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
                placeholder="Ne tür projelerde çalışıyorum, nasıl bir üretim sürecim var?"
                className="resize-none"
                {...register("statement")}
              />
              <p className="text-xs text-[var(--color-muted)]">En fazla 400 karakter.</p>
              {errors.statement ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.statement.message}</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[var(--color-primary)]">Portfolyo (opsiyonel)</Label>
              <p className="text-xs text-[var(--color-muted)]">
                Spotify, SoundCloud, YouTube, Bandcamp, Drive veya kişisel site. En fazla 5 bağlantı.
              </p>
              <div className="space-y-2">
                {(links || []).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
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
                {links.length < portfolioCount.max ? (
                  <Button type="button" size="sm" variant="secondary" onClick={addLinkField}>
                    Bağlantı ekle
                  </Button>
                ) : null}
              </div>
            </div>

            {showAltQuestions ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Kaç projede aktif olarak yer aldın?</Label>
                  <div className="flex flex-col gap-2">
                    {projectCountOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
                        <input
                          type="radio"
                          value={opt}
                          checked={watch("projects") === opt}
                          onChange={() => setValue("projects", opt, { shouldValidate: true })}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {errors.projects ? (
                    <span className="text-xs text-[var(--color-danger)]">{errors.projects.message}</span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--color-primary)]">Kaç yıldır üretim yapıyorsun?</Label>
                  <div className="flex flex-col gap-2">
                    {yearsOptions.map((opt) => (
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
                    href="/uretici-sartlari"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-[var(--color-accent)]"
                  >
                    Üreticiler İçin Kullanım Şartları ve Bilgilendirme Metni
                  </Link>{" "}
                  okudum, kabul ediyorum.
                </span>
              </label>
              {errors.acknowledge ? (
                <span className="text-xs text-[var(--color-danger)]">{errors.acknowledge.message}</span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!isValid || loading} className="gap-2">
                {loading ? <span className="animate-spin">⏳</span> : null}
                Başvuruyu Gönder
              </Button>
              <p className="text-xs text-[var(--color-muted)]">Başvurun değerlendirilecektir.</p>
            </div>
          </form>
        </Card>
      </Section>
    </main>
  );
}
