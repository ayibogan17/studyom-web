"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Section } from "@/components/design-system/components/shared/section";
import { EmptyState } from "@/components/design-system/components/shared/empty-state";
import { loadGeo } from "@/lib/geo";

const instruments = [
  "Vokal",
  "Gitar",
  "Gitar/Vokal",
  "Bas/Vokal",
  "Bas",
  "Davul",
  "Klavye",
];
const allCities = loadGeo().map((province) => province.name);

type JamItem = {
  id: string;
  title: string;
  note: string | null;
  genre: string | null;
  playlistLink: string | null;
  creatorLevel: string | null;
  startAt: string;
  durationMinutes: number;
  neededInstruments: string[];
  capacity: number;
  createdByUser: { name: string | null; fullName: string | null; image: string | null };
  studio: { name: string; city: string | null; district: string | null };
  _count: { participants: number };
};

type Props = {
  defaultCity: string;
};

export default function OpenJamClient({ defaultCity }: Props) {
  const router = useRouter();
  const [city, setCity] = useState(defaultCity);
  const [instrument, setInstrument] = useState("");
  const dateRange: "today" | "week" = "today";
  const [jams, setJams] = useState<JamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackGallery = [
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_35_17.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_34_06.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_32_56.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_31_32.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_30_14.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_28_31.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_27_41.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_16_00.png",
    "/openjam-gallery/ChatGPT Image 12 Oca 2026 01_14_50.png",
  ];
  const [galleryImages, setGalleryImages] = useState<string[]>(fallbackGallery);

  const activeJams = useMemo(
    () => jams.filter((jam) => jam._count.participants < jam.capacity),
    [jams],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (instrument) params.set("instrument", instrument);
    params.set("date_range", dateRange);
    fetch(`/api/openjam/jams?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const next = Array.isArray(json.jams) ? json.jams : [];
        setJams(next);
        if (!next.length) {
          fetch("/api/openjam/seed", { method: "POST" })
            .then(() => fetch(`/api/openjam/jams?${params.toString()}`))
            .then((res) => res.json())
            .then((seedJson) => {
              if (!active) return;
              const seeded = Array.isArray(seedJson.jams) ? seedJson.jams : [];
              setJams(seeded);
            })
            .catch(() => null);
        }
      })
      .catch(() => {
        if (!active) return;
        setJams([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [city, instrument, dateRange]);

  useEffect(() => {
    let active = true;
    fetch("/api/openjam/gallery")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const urls = Array.isArray(json.images)
          ? json.images.map((img: { photoUrl: string }) => img.photoUrl).filter(Boolean)
          : [];
        if (urls.length) {
          setGalleryImages(urls);
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <Section className="bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-12 text-center">
          <div className="w-full overflow-hidden">
            <div className="openjam-marquee-track flex items-center gap-5">
              {[...galleryImages, ...galleryImages].map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="h-20 w-36 flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-purple-900/30"
                  style={{ backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
              ))}
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">OpenJam</p>
          <h1 className="text-4xl font-semibold md:text-5xl">OpenJam</h1>
          <p className="max-w-3xl text-base text-white/85 md:text-lg">
            Stüdyonu seç. Müzisyenleri bul. Jam’e gir.
            OpenJam, kısa süreli jam buluşmaları için tasarlandı. Bir stüdyo belirle,
            enstrümanları seç, katılmak isteyenlerle hızlıca bağlantı kur.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              variant="secondary"
              className="border-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white hover:from-violet-400 hover:via-purple-400 hover:to-fuchsia-400"
            >
              <Link href="/openjam/memories">Jam hatıraları</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="px-10 py-7 text-xl font-semibold border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
            >
              <Link href="/openjam/new" className="flex items-center gap-3">
                <img
                  src="/icons/guitar_amp.svg"
                  alt=""
                  aria-hidden
                  className="h-7 w-7"
                />
                <img
                  src="/icons/drumkit_stroked.svg"
                  alt=""
                  aria-hidden
                  className="h-7 w-7"
                />
                Jam yarat
                <img
                  src="/icons/guitar.svg"
                  alt=""
                  aria-hidden
                  className="h-7 w-7"
                />
                <img
                  src="/icons/mic.svg"
                  alt=""
                  aria-hidden
                  className="h-7 w-7"
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:from-purple-400 hover:via-indigo-400 hover:to-blue-400"
            >
              <Link href="/openjam/mine">Jam’lerim</Link>
            </Button>
          </div>
        </div>
      </Section>
      <style jsx>{`
        .openjam-marquee-track {
          width: max-content;
          animation: openjam-marquee 13s linear infinite;
        }
        @keyframes openjam-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <Section>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
          <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Şehir</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
              >
                {[defaultCity, ...allCities]
                  .filter((item, idx, arr) => arr.indexOf(item) === idx)
                  .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Enstrüman</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
              >
                <option value="">Hepsi</option>
                {instruments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <div id="openjam-list" className="space-y-4">
            {loading ? (
              <p className="text-sm text-[var(--color-muted)]">Jam’ler yükleniyor...</p>
            ) : activeJams.length === 0 ? (
              <EmptyState
                title="Uygun jam bulunamadı"
                description="Filtreleri genişlet veya yeni bir jam oluştur."
                actionLabel="Jam oluştur"
                onAction={() => router.push("/openjam/new")}
                actionClassName="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeJams.map((jam) => {
                  const location = jam.studio.district || jam.studio.city || "Stüdyo";
                  const level = jam.creatorLevel ?? "";
                  const modeText = jam.genre || jam.playlistLink || "";
                  const creatorName =
                    jam.createdByUser.fullName ||
                    jam.createdByUser.name ||
                    "Kullanıcı";
                  const creatorInitials = creatorName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <Link key={jam.id} href={`/openjam/${jam.id}`} className="block min-w-0">
                      <Card className="flex h-full min-w-0 flex-col gap-3 p-4 transition hover:border-[var(--color-accent)]">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[var(--color-primary)]">{jam.title}</p>
                          <p className="text-xs text-[var(--color-muted)] break-words">
                            {jam.studio.name} · {location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                          {jam.createdByUser.image ? (
                            <img
                              src={jam.createdByUser.image}
                              alt={creatorName}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[10px] font-semibold text-[var(--color-primary)]">
                              {creatorInitials}
                            </span>
                          )}
                          <span>Yaratan: {creatorName}</span>
                        </div>
                        {modeText ? (
                          <div className="text-xs text-[var(--color-muted)] break-words">
                            {jam.genre ? (
                              <>Takılmaç: {modeText}</>
                            ) : (
                              <>
                                Playlist:{" "}
                                <span
                                  role="link"
                                  tabIndex={0}
                                  className="break-all underline hover:text-[var(--color-primary)]"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    window.open(modeText, "_blank", "noreferrer");
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key !== "Enter") return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    window.open(modeText, "_blank", "noreferrer");
                                  }}
                                >
                                  {modeText}
                                </span>
                              </>
                            )}
                          </div>
                        ) : null}
                        <div className="text-xs text-[var(--color-muted)]">
                          Seviyesi: {level || "-"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {jam.neededInstruments.map((item) => (
                            <Badge key={item} variant="muted">
                              {item}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs font-semibold text-[var(--color-primary)]">
                          {jam._count.participants}/{jam.capacity} katılımcı
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>

    </div>
  );
}
