"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { X } from "lucide-react";

type Props = {
  urls?: string[];
};

const MAX_PREVIEW = 8;

export function Gallery({ urls = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const images = urls.filter(Boolean);
  const visible = useMemo(() => (showAll ? images : images.slice(0, MAX_PREVIEW)), [images, showAll]);
  const hiddenCount = images.length - visible.length;

  const close = () => setActiveIndex(null);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Görseller</p>
        {images.length > MAX_PREVIEW && !showAll ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => setShowAll(true)}>
            Hepsini gör
          </Button>
        ) : null}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Henüz görsel eklenmemiş.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((url, index) => {
            const showOverlay = !showAll && hiddenCount > 0 && index === visible.length - 1;
            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] text-left"
              >
                <div className="aspect-[4/3] w-full">
                  <img src={url} alt="Üretici görseli" className="h-full w-full object-cover" />
                </div>
                {showOverlay ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                    +{hiddenCount} daha
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {activeIndex !== null && images[activeIndex] ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div className="relative max-h-[90vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={close}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-900 shadow"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={images[activeIndex]}
              alt="Üretici görseli"
              className="h-full max-h-[90vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
