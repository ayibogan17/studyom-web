"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  items: { src: string; roomName: string }[];
};

export function StudioGalleryCarousel({ items }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const showPrev = () => {
    if (activeIndex === null || activeIndex <= 0) return;
    setActiveIndex(activeIndex - 1);
  };

  const showNext = () => {
    if (activeIndex === null || activeIndex >= items.length - 1) return;
    setActiveIndex(activeIndex + 1);
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={scrollerRef}
        className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 py-4"
      >
        {items.map((item, idx) => (
          <div
            key={`${item.src}-${idx}`}
            className="h-full w-[70%] shrink-0 snap-start overflow-hidden rounded-xl bg-[var(--color-secondary)] sm:w-[45%] lg:w-[38%]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <button type="button" onClick={() => setActiveIndex(idx)} className="relative h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="Stüdyo görseli" className="h-full w-full object-cover" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                {item.roomName}
              </span>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollByAmount("left")}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/70 p-2 text-gray-900 shadow-sm backdrop-blur hover:bg-white"
        aria-label="Sola kaydır"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => scrollByAmount("right")}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/70 p-2 text-gray-900 shadow-sm backdrop-blur hover:bg-white"
        aria-label="Sağa kaydır"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
      {activeIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute inset-0 h-full w-full"
            aria-label="Önizlemeyi kapat"
          />
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-black shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[activeIndex]?.src}
              alt="Stüdyo görseli"
              className="h-auto max-h-[90vh] w-auto max-w-[90vw]"
            />
          </div>
          {activeIndex > 0 ? (
            <button
              type="button"
              onClick={showPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/80 p-2 text-gray-900 shadow-sm backdrop-blur hover:bg-white"
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          {activeIndex < items.length - 1 ? (
            <button
              type="button"
              onClick={showNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/80 p-2 text-gray-900 shadow-sm backdrop-blur hover:bg-white"
              aria-label="Sonraki görsel"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
