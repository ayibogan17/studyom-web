"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Input } from "@/components/design-system/components/ui/input";
import { Label } from "@/components/design-system/components/ui/label";
import { Textarea } from "@/components/design-system/components/ui/textarea";
import { Badge } from "@/components/design-system/components/ui/badge";
import { listProducers, type ProducerFilters, type ProducerProfile } from "@/lib/producers";

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
];

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
];

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

function parseFilters(params: URLSearchParams): ProducerFilters {
  const parseList = (value: string | null) =>
    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
  return {
    q: params.get("q") || "",
    areas: parseList(params.get("areas")),
    genres: parseList(params.get("genres")),
    mode: params.get("mode") || "",
    city: params.get("city") || "",
  };
}

function formatPortfolioLabel(link: string) {
  const url = link.toLowerCase();
  if (url.includes("youtube")) return "YouTube";
  if (url.includes("youtu.be")) return "YouTube";
  if (url.includes("spotify")) return "Spotify";
  if (url.includes("soundcloud")) return "SoundCloud";
  if (url.includes("bandcamp")) return "Bandcamp";
  if (url.includes("drive.google")) return "Google Drive";
  if (url.includes("instagram")) return "Instagram";
  return "Portföy";
}

function containsUrl(value: string) {
  return /(https?:\/\/|www\.)/i.test(value);
}

export default function ProductionPageClient({ initialProducers }: { initialProducers: ProducerProfile[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const producers = useMemo(() => listProducers(filters, initialProducers), [filters, initialProducers]);
  const isAuthenticated = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

  const [activeProducer, setActiveProducer] = useState<ProducerProfile | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const currentQuery = searchParams.toString();
  const returnUrl = currentQuery ? `/uretim?${currentQuery}` : "/uretim";

  const closeModal = () => {
    setActiveProducer(null);
    setMessage("");
    setStatus("idle");
    setError(null);
  };

  const handleSend = async () => {
    if (!activeProducer) return;
    if (sessionStatus !== "authenticated") {
      router.push(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Mesaj yazın.");
      return;
    }
    if (trimmed.length > 300) {
      setError("Mesaj 300 karakteri geçemez.");
      return;
    }
    if (containsUrl(trimmed)) {
      setError("Mesajda link paylaşmayın.");
      return;
    }

    setSending(true);
    setStatus("idle");
    setError(null);
    try {
      const res = await fetch("/api/producer-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producerUserId: activeProducer.userId, message: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gönderilemedi");
      }
      setStatus("success");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Üretim</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Üretim</h1>
          <p className="text-sm text-[var(--color-muted)]">Şarkın için doğru üreticiyi bul.</p>
        </div>

        <ProductionFilterBar
          key={searchParams.toString()}
          initialFilters={filters}
          onSubmit={(next) => {
            const params = new URLSearchParams();
            if (next.q) params.set("q", next.q);
            if (next.areas?.length) params.set("areas", next.areas.join(","));
            if (next.genres?.length) params.set("genres", next.genres.join(","));
            if (next.mode) params.set("mode", next.mode);
            if (next.city) params.set("city", next.city);
            const qs = params.toString();
            router.replace(qs ? `/uretim?${qs}` : "/uretim");
            router.refresh();
          }}
        />

        {producers.length === 0 ? (
          <Card className="flex flex-col items-start gap-3 p-6">
            <p className="text-base font-semibold text-[var(--color-primary)]">Sonuç bulunamadı</p>
            <p className="text-sm text-[var(--color-muted)]">Bu filtrelerle eşleşen üretici yok. Filtreleri gevşet.</p>
            <Button asChild size="sm">
              <Link href="/uretim">Filtreleri temizle</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {producers.map((producer) => (
              <Card key={producer.id} className="space-y-3 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-primary)]">{producer.displayName}</p>
                    {producer.modes.some((mode) => mode !== "Online") && producer.city ? (
                      <p className="text-sm text-[var(--color-muted)]">{producer.city}</p>
                    ) : null}
                  </div>
                  {producer.status === "pending" ? (
                    <Badge variant="muted">İncelemede</Badge>
                  ) : (
                    <Badge variant="outline">Onaylı</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
                  {producer.areas.length ? (
                    producer.areas.map((area) => (
                      <span key={area} className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">Alan belirtilmedi</span>
                  )}
                </div>

                {producer.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
                    {producer.genres.map((genre) => (
                      <span key={genre} className="rounded-full border border-[var(--color-border)] px-3 py-1">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
                  {producer.modes.length ? (
                    producer.modes.map((mode) => (
                      <span key={mode} className="rounded-full border border-[var(--color-border)] px-3 py-1">
                        {mode}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">Mod belirtilmedi</span>
                  )}
                </div>

                <p className="text-sm text-[var(--color-muted)] line-clamp-3">{producer.statement}</p>

                <div id={`portfolio-${producer.id}`} className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-primary)]">Portföy</p>
                  {producer.links.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {producer.links.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                        >
                          {formatPortfolioLabel(link)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    disabled={isSessionLoading}
                    onClick={() => {
                      if (isSessionLoading) return;
                      if (!isAuthenticated) {
                        router.push(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
                        return;
                      }
                      setActiveProducer(producer);
                    }}
                  >
                    Mesaj gönder
                  </Button>
                  <a href={`#portfolio-${producer.id}`} className="text-sm font-semibold text-[var(--color-accent)]">
                    Portföy
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {activeProducer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl bg-[var(--color-surface)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-muted)]">Mesaj gönder</p>
                <h2 className="text-xl font-semibold text-[var(--color-primary)]">{activeProducer.displayName}</h2>
                <p className="text-xs text-[var(--color-muted)]">
                  İlk mesaj kısa tutulur. Üretici yanıt verirse sohbet açılır.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-semibold text-[var(--color-muted)]"
              >
                Kapat
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {activeProducer.areas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setMessage((prev) => {
                        const next = prev ? `${prev} ${area}` : area;
                        return next.length <= 300 ? next : prev;
                      });
                    }}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                  >
                    {area}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <Label htmlFor="producer-message">Mesajın</Label>
                <Textarea
                  id="producer-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                  placeholder="Kısa bir talep yaz. Örn: 1 şarkı için beat arıyorum."
                  aria-invalid={!!error}
                />
                <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                  <span>{message.length} / 300</span>
                  {containsUrl(message) && <span className="text-[var(--color-danger)]">Link kullanma</span>}
                </div>
                {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
                {status === "success" && (
                  <p className="text-xs text-green-600">
                    Mesajın iletildi. Yanıt gelirse burada sohbet açılır.
                  </p>
                )}
                {status === "error" && !error && (
                  <p className="text-xs text-[var(--color-danger)]">Gönderilemedi, tekrar dene.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                İptal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSend}
                disabled={sending || message.trim().length === 0 || containsUrl(message)}
              >
                {sending ? "Gönderiliyor..." : "Mesajı gönder"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ProductionFilterBar({
  initialFilters,
  onSubmit,
}: {
  initialFilters: ProducerFilters;
  onSubmit: (filters: ProducerFilters) => void;
}) {
  const [query, setQuery] = useState(initialFilters.q || "");
  const [mode, setMode] = useState(initialFilters.mode || "");
  const [city, setCity] = useState(initialFilters.city || "");
  const [areas, setAreas] = useState<string[]>(initialFilters.areas || []);
  const [genres, setGenres] = useState<string[]>(initialFilters.genres || []);

  const showCity = mode === "Kendi stüdyomda" || mode === "Müşteri stüdyosunda";

  const toggleList = (value: string, list: string[], setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  return (
    <form
      className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ q: query.trim(), areas, genres, mode, city: showCity ? city : "" });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="producer-q">Arama</Label>
          <Input
            id="producer-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim veya anahtar kelime"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="producer-mode">Çalışma modu</Label>
          <select
            id="producer-mode"
            value={mode}
            onChange={(e) => {
              const next = e.target.value;
              setMode(next);
              if (next === "Online") setCity("");
            }}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">Tümü</option>
            {workingModes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        {showCity ? (
          <div className="space-y-1">
            <Label htmlFor="producer-city">Şehir</Label>
            <select
              id="producer-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Tümü</option>
              {cityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Üretim alanları</Label>
            <span className="text-xs text-[var(--color-muted)]">{areas.length} seçili</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {productionAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleList(area, areas, setAreas)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  areas.includes(area)
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-primary)]"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Türler</Label>
            <span className="text-xs text-[var(--color-muted)]">{genres.length} seçili</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleList(genre, genres, setGenres)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  genres.includes(genre)
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-primary)]"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm">
          Filtrele
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSubmit({})}
        >
          Temizle
        </Button>
      </div>
    </form>
  );
}
