"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Section } from "@/components/design-system/components/shared/section";
import { EmptyState } from "@/components/design-system/components/shared/empty-state";

type JamItem = {
  id: string;
  title: string;
  note: string | null;
  genre: string | null;
  playlistLink: string | null;
  creatorLevel: string | null;
  startAt: Date | string;
  durationMinutes: number;
  neededInstruments: string[];
  capacity: number;
  createdByUser: { name: string | null; fullName: string | null; image: string | null };
  studio: { name: string; city: string | null; district: string | null };
  _count: { participants: number };
};

export default function OpenJamMineClient({ jams }: { jams: JamItem[] }) {
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryJamId, setMemoryJamId] = useState<string | null>(null);
  const [memoryJamTitle, setMemoryJamTitle] = useState<string | null>(null);
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<File | null>(null);
  const [memoryError, setMemoryError] = useState("");
  const [memorySuccess, setMemorySuccess] = useState("");
  const [memorySaving, setMemorySaving] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryMode, setMemoryMode] = useState<"create" | "update">("create");

  const resetMemory = () => {
    setMemoryText("");
    setMemoryFile(null);
    setMemoryError("");
    setMemorySuccess("");
  };

  const handleOpenMemory = async (jamId: string, title: string) => {
    resetMemory();
    setMemoryJamId(jamId);
    setMemoryJamTitle(title);
    setMemoryOpen(true);
    setMemoryLoading(true);
    try {
      const res = await fetch(`/api/openjam/memories?jamId=${jamId}&mine=1`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.memory) {
        setMemoryMode("update");
        setMemoryText(json.memory.text || "");
        if (json.memory.photoUrl) {
          setMemorySuccess("Mevcut hatıranı düzenleyebilirsin.");
        }
      } else {
        setMemoryMode("create");
      }
    } catch {
      setMemoryMode("create");
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setMemoryFile(null);
      setMemoryError("");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMemoryError("Fotoğraf 5MB’dan küçük olmalı.");
      return;
    }
    setMemoryError("");
    setMemoryFile(file);
  };

  const handleSubmitMemory = async () => {
    if (!memoryText.trim()) {
      setMemoryError("Hatıranı yazmalısın.");
      return;
    }
    if (memoryText.trim().length > 400) {
      setMemoryError("Hatıra 400 karakteri geçemez.");
      return;
    }
    if (!memoryJamId) {
      setMemoryError("Jam bulunamadı.");
      return;
    }
    setMemoryError("");
    setMemorySaving(true);
    try {
      let photoUrl: string | null = null;
      if (memoryFile) {
        const form = new FormData();
        form.append("file", memoryFile);
        const uploadRes = await fetch("/api/uploads", { method: "POST", body: form });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.publicUrl) {
          throw new Error(uploadJson.error || "Fotoğraf yüklenemedi.");
        }
        photoUrl = uploadJson.publicUrl as string;
      }
      const res = await fetch("/api/openjam/memories", {
        method: memoryMode === "update" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jamId: memoryJamId,
          text: memoryText.trim(),
          photoUrl,
          mode: memoryMode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Hatıra kaydedilemedi.");
      }
      setMemorySuccess("Hatıra alındı. Teşekkürler!");
      setTimeout(() => {
        setMemoryOpen(false);
      }, 800);
    } catch (err) {
      setMemoryError(err instanceof Error ? err.message : "Hatıra kaydedilemedi.");
    } finally {
      setMemorySaving(false);
    }
  };

  const handleDeleteMemory = async () => {
    if (!memoryJamId) return;
    if (!confirm("Hatıran silinsin mi?")) return;
    setMemorySaving(true);
    try {
      const res = await fetch(`/api/openjam/memories?jamId=${memoryJamId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Hatıra silinemedi.");
      setMemorySuccess("Hatıra silindi.");
      setTimeout(() => {
        setMemoryOpen(false);
      }, 600);
    } catch (err) {
      setMemoryError(err instanceof Error ? err.message : "Hatıra silinemedi.");
    } finally {
      setMemorySaving(false);
    }
  };

  return (
    <Section>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div className="space-y-2 text-center text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">OpenJam</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Jam’lerim</h1>
          <p className="text-sm text-white/80">Eklediğin ve katıldığın jam’ler burada.</p>
        </div>

        {jams.length === 0 ? (
          <EmptyState
            title="Henüz jam yok"
            description="Bir jam oluştur veya mevcut jam’lere katıl."
            actionLabel="Jam oluştur"
            onAction={() => {
              window.location.href = "/openjam/new";
            }}
            actionClassName="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jams.map((jam) => {
              const location = jam.studio.district || jam.studio.city || "Stüdyo";
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
              const modeText = jam.genre || jam.playlistLink || "";
              const isFull = jam._count.participants >= jam.capacity;
              return (
                <Card
                  key={jam.id}
                  className="relative flex h-full flex-col gap-3 p-4 transition hover:border-[var(--color-accent)]"
                >
                  <Link href={`/openjam/${jam.id}`} className="absolute inset-0 z-0">
                    <span className="sr-only">{jam.title}</span>
                  </Link>
                  <div className="relative z-10 flex h-full flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--color-primary)]">{jam.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">
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
                      <div className="text-xs text-[var(--color-muted)]">
                        {jam.genre ? "Genre: " : "Liste: "}
                        {modeText}
                      </div>
                    ) : null}
                    <div className="text-xs text-[var(--color-muted)]">
                      Seviyesi: {jam.creatorLevel || "-"}
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
                    {isFull ? (
                      <div className="mt-auto flex justify-end">
                        <Button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleOpenMemory(jam.id, jam.title);
                          }}
                          className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
                        >
                          Jam hatırası bırak
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {memoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                Yeni arkadaşlarınla Jam nasıl geçti? Eğlendiniz mi? Herkesin görmesi için Studyom'a bir imza bırak.
              </h2>
              {memoryJamTitle ? (
                <p className="text-sm text-[var(--color-muted)]">Jam: {memoryJamTitle}</p>
              ) : null}
              <p className="text-sm text-[var(--color-muted)]">
                Daha buluşmadıysanız Jam'den sonra hatıranı bırakabilirsin.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Hatıran</label>
              <textarea
                value={memoryText}
                onChange={(event) => setMemoryText(event.target.value)}
                maxLength={400}
                rows={5}
                className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)]"
                placeholder="Jam nasıl geçti?"
                disabled={memoryLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-muted)]">Fotoğraf yükle (max 1 foto, 5MB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                className="block w-full text-sm text-[var(--color-muted)]"
                disabled={memoryLoading}
              />
              <p className="text-xs text-[var(--color-muted)]">
                Yüklenilen fotoğraf /openjam sayfasında yukarıdaki galeride sergilenecektir.
              </p>
            </div>
            {memoryError ? <p className="text-sm text-[var(--color-danger)]">{memoryError}</p> : null}
            {memorySuccess ? <p className="text-sm text-emerald-400">{memorySuccess}</p> : null}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMemoryOpen(false)}
                className="border border-[var(--color-border)]"
              >
                Vazgeç
              </Button>
              {memoryMode === "update" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDeleteMemory}
                  disabled={memorySaving}
                  className="border-0 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white hover:from-rose-400 hover:via-red-400 hover:to-orange-400"
                >
                  Sil
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleSubmitMemory}
                disabled={memorySaving}
                className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
              >
                {memorySaving ? "Yükleniyor..." : memoryMode === "update" ? "Hatıranı güncelle" : "Hatıra bırak"}
              </Button>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Sıkıntı mı var? Bize /iletisim sayfasından bildir.
            </p>
          </Card>
        </div>
      ) : null}
    </Section>
  );
}
