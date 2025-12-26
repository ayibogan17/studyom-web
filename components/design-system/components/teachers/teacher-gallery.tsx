"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

type Props = {
  urls: string[];
  title?: string;
};

function filterUrls(urls: string[]) {
  return urls.filter((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  });
}

export function TeacherGallery({ urls, title = "Fotoğraflar" }: Props) {
  const safeUrls = useMemo(() => filterUrls(urls).slice(0, 5), [urls]);
  const [active, setActive] = useState<string | null>(null);

  if (safeUrls.length === 0) return null;

  return (
    <Card className="space-y-3 p-5">
      <p className="text-base font-semibold text-[var(--color-primary)]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {safeUrls.map((url, idx) => (
          <button
            key={`${url}-${idx}`}
            type="button"
            onClick={() => setActive(url)}
            className="group aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <img
              src={url}
              alt="Hoca fotoğrafı"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-3xl bg-black/90">
            <img
              src={active}
              alt="Fotoğraf önizleme"
              className="block max-h-[85vh] max-w-[90vw] object-contain"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3"
            >
              Kapat
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
