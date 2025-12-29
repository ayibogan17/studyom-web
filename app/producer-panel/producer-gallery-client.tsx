"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

type Props = {
  initialUrls?: string[];
};

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function ProducerGalleryClient({ initialUrls = [] }: Props) {
  const [photos, setPhotos] = useState<string[]>(initialUrls);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const saveGallery = async (next: string[]) => {
    const res = await fetch("/api/producer-panel/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ galleryUrls: next }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || "Kaydedilemedi");
    }
  };

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleRemove = async (idx: number) => {
    const next = photos.filter((_, i) => i !== idx);
    setLoading(true);
    setStatus(null);
    try {
      await saveGallery(next);
      setPhotos(next);
      setStatus("Fotoğraf kaldırıldı.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (files: FileList | null) => {
    if (!files?.length) return;
    setStatus(null);
    const incoming = Array.from(files);
    if (photos.length + incoming.length > MAX_FILES) {
      setStatus(`En fazla ${MAX_FILES} fotoğraf ekleyebilirsiniz.`);
      return;
    }
    const validFiles: File[] = [];
    for (const file of incoming) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_SIZE_BYTES) {
        setStatus(`Bir veya daha fazla dosya ${MAX_SIZE_MB} MB üstünde.`);
        return;
      }
      validFiles.push(file);
    }
    if (!validFiles.length) {
      setStatus("Geçerli bir görsel seçin.");
      return;
    }
    setLoading(true);
    try {
      const uploaded: string[] = [];
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.publicUrl) {
          throw new Error("Görsel yüklenemedi.");
        }
        uploaded.push(uploadJson.publicUrl as string);
      }
      const next = [...photos, ...uploaded].slice(0, MAX_FILES);
      await saveGallery(next);
      setPhotos(next);
      setStatus("Fotoğraflar güncellendi.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Görsel yüklenemedi.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Fotoğraf ekle</p>
          <p className="text-xs text-[var(--color-muted)]">
            En fazla {MAX_FILES} fotoğraf, her biri en fazla {MAX_SIZE_MB} MB.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handlePick} disabled={loading || photos.length >= MAX_FILES}>
          Fotoğraf ekle
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleAdd(e.target.files)}
        />
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        Üretim ekipmanların, stüdyon veya projelerinden görseller ekleyebilirsin.
      </p>
      <p className="text-xs text-[var(--color-muted)]">
        Eklenen fotoğraflar, Üretim sayfasındaki profilinde görünebilir.
      </p>

      {photos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {photos.map((url, idx) => (
            <div key={`${url}-${idx}`} className="space-y-2">
              <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]">
                <img src={url} alt="Üretici fotoğrafı" className="h-full w-full object-cover" />
              </div>
              <Button size="sm" variant="ghost" full onClick={() => handleRemove(idx)} disabled={loading}>
                Kaldır
              </Button>
            </div>
          ))}
        </div>
      )}

      {status && <p className="text-xs text-[var(--color-muted)]">{status}</p>}
    </Card>
  );
}
