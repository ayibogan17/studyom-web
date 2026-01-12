"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";
import { Input } from "@/components/design-system/components/ui/input";
import { Textarea } from "@/components/design-system/components/ui/textarea";
import { Section } from "@/components/design-system/components/shared/section";

const instruments = [
  "Vokal",
  "Gitar",
  "Gitar/Vokal",
  "Bas/Vokal",
  "Bas",
  "Davul",
  "Klavye",
];

const durations = [60, 120, 180];

type StudioOption = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
};

type Props = {
  studios: StudioOption[];
};

export default function OpenJamNewClient({ studios }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [studioId, setStudioId] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [playerInstrument, setPlayerInstrument] = useState("");
  const [playerLevel, setPlayerLevel] = useState("");
  const [note, setNote] = useState("");
  const [jamMode, setJamMode] = useState<"hangout" | "playlist" | "">("");
  const [genre, setGenre] = useState("");
  const [playlistLink, setPlaylistLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredStudios = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return studios;
    return studios.filter((studio) =>
      `${studio.name} ${studio.city ?? ""} ${studio.district ?? ""}`.toLowerCase().includes(needle),
    );
  }, [search, studios]);

  const toggleInstrument = (name: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!studioId || selectedInstruments.length === 0) {
      setError("Lütfen stüdyo ve enstrüman seçin.");
      return;
    }
    if (!playerInstrument) {
      setError("Lütfen çaldığın enstrümanı seçin.");
      return;
    }
    if (jamMode === "hangout" && genre.trim().length > 20) {
      setError("Genre en fazla 20 karakter olabilir.");
      return;
    }
    const now = new Date();
    const startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    if (Number.isNaN(startAt.getTime())) {
      setError("Tarih veya saat geçersiz.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/openjam/jams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId,
          startAt: startAt.toISOString(),
          durationMinutes: duration,
          neededInstruments: selectedInstruments,
          note: note.trim() ? note.trim().slice(0, 200) : null,
          genre: jamMode === "hangout" && genre.trim() ? genre.trim().slice(0, 20) : null,
          playlistLink: jamMode === "playlist" && playlistLink.trim() ? playlistLink.trim() : null,
          creatorLevel: playerLevel.trim() || null,
          creatorInstrument: playerInstrument.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.id) {
        throw new Error(json.error || "Jam oluşturulamadı.");
      }
      router.push(`/openjam/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Jam oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">OpenJam</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Jam oluştur</h1>
          <p className="text-sm text-[var(--color-muted)]">
            1 dakikada jam oluştur. Stüdyo, saat ve enstrümanları seçmen yeterli.
          </p>
        </div>

        <Card className="space-y-5 p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Stüdyo</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Stüdyo ara..."
              />
              <select
                value={studioId}
                onChange={(e) => setStudioId(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
              >
                <option value="">Stüdyo seç</option>
                {filteredStudios.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name} · {studio.district || studio.city || ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Jam modu</label>
              <div className="relative flex h-12 w-full max-w-md rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] p-1 mx-auto">
                <div
                  className={`absolute left-1 top-1 h-10 w-[calc(50%-4px)] rounded-full bg-[var(--color-surface)] transition-transform ${
                    jamMode === "playlist" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setJamMode("hangout")}
                  className={`relative z-10 flex-1 rounded-full text-sm font-semibold transition ${
                    jamMode === "hangout"
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  Takılalım
                </button>
                <button
                  type="button"
                  onClick={() => setJamMode("playlist")}
                  className={`relative z-10 flex-1 rounded-full text-sm font-semibold transition ${
                    jamMode === "playlist"
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  Bu listeyi çalalım
                </button>
              </div>
              {jamMode === "hangout" && (
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Genre (max 20 karakter)"
                  maxLength={20}
                />
              )}
              {jamMode === "playlist" && (
                <Input
                  value={playlistLink}
                  onChange={(e) => setPlaylistLink(e.target.value)}
                  placeholder="Liste linki"
                />
              )}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-3 text-center text-sm text-white">
              Tarih esnektir, beraber karar verirsiniz.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Süre</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
              >
                {durations.map((item) => (
                  <option key={item} value={item}>
                    {item} dk
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Senin çaldığın enstrüman</label>
              <select
                value={playerInstrument}
                onChange={(e) => {
                  setPlayerInstrument(e.target.value);
                  setPlayerLevel("");
                }}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
              >
                <option value="">Seç</option>
                {instruments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            {playerInstrument && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-muted)]">Seviyen</label>
                <select
                  value={playerLevel}
                  onChange={(e) => setPlayerLevel(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                >
                  <option value="">Seç</option>
                  <option value="enstrümanı tutmayı biliyorum">enstrümanı tutmayı biliyorum</option>
                  <option value="takılacak kadar biliyorum">takılacak kadar biliyorum</option>
                  <option value="iyiyim ya bence">iyiyim ya bence</option>
                  <option value="öttürürüm">öttürürüm</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">İhtiyaç duyulan enstrümanlar</label>
              <div className="flex flex-wrap gap-2">
                {instruments.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInstrument(item)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      selectedInstruments.includes(item)
                        ? "border-[var(--color-accent)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-muted)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Kısa not (opsiyonel)</label>
              <Textarea
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jam için kısa bir not..."
              />
              <p className="text-[11px] text-[var(--color-muted)]">{note.length}/200</p>
            </div>

            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
              >
                {saving ? "Kaydediliyor..." : "Jam oluştur"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Section>
  );
}
