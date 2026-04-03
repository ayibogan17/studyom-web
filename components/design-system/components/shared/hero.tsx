"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Section } from "./section";

export type HeroSlide = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc?: string;
  theme?: "blue" | "orange" | "teal" | "openjam";
};

type HeroProps = {
  slides: HeroSlide[];
};

const slideThemes = {
  blue: {
    shell:
      "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.34),_transparent_34%),linear-gradient(135deg,#0b1220_0%,#111827_52%,#1e3a8a_100%)]",
    accent: "bg-blue-400/15 text-blue-100 ring-1 ring-blue-200/20",
    glow: "from-blue-400/20 via-transparent to-cyan-300/10",
  },
  orange: {
    shell:
      "bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_34%),linear-gradient(135deg,#1c1917_0%,#7c2d12_50%,#ea580c_100%)]",
    accent: "bg-orange-300/15 text-orange-50 ring-1 ring-orange-100/20",
    glow: "from-orange-300/25 via-transparent to-amber-200/10",
  },
  teal: {
    shell:
      "bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_34%),linear-gradient(135deg,#0f172a_0%,#134e4a_52%,#0f766e_100%)]",
    accent: "bg-teal-300/15 text-teal-50 ring-1 ring-teal-100/20",
    glow: "from-teal-300/25 via-transparent to-emerald-200/10",
  },
  openjam: {
    shell:
      "bg-[radial-gradient(circle_at_12%_18%,_rgba(251,191,36,0.34),_transparent_24%),radial-gradient(circle_at_32%_78%,_rgba(45,212,191,0.28),_transparent_24%),radial-gradient(circle_at_78%_22%,_rgba(244,114,182,0.34),_transparent_24%),radial-gradient(circle_at_88%_72%,_rgba(96,165,250,0.32),_transparent_22%),linear-gradient(120deg,#ef4444_0%,#f97316_16%,#eab308_30%,#22c55e_48%,#06b6d4_66%,#3b82f6_82%,#a855f7_100%)]",
    accent: "bg-fuchsia-300/15 text-fuchsia-50 ring-1 ring-fuchsia-100/20",
    glow: "from-pink-300/25 via-yellow-200/10 to-cyan-200/15",
  },
} as const;

const defaultThemeOrder = ["blue", "orange", "teal"] as const;

export function Hero({ slides }: HeroProps) {
  const hasMultipleSlides = slides.length > 1;
  const [activeIndex, setActiveIndex] = useState(hasMultipleSlides ? 1 : 0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [autoplayKey, setAutoplayKey] = useState(0);

  useEffect(() => {
    setActiveIndex(slides.length > 1 ? 1 : 0);
  }, [slides.length]);

  useEffect(() => {
    if (!hasMultipleSlides) return;
    const timer = window.setInterval(() => {
      setIsAnimating(true);
      setActiveIndex((current) => current + 1);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [autoplayKey, hasMultipleSlides]);

  useEffect(() => {
    if (isAnimating) return;
    const frame = window.requestAnimationFrame(() => {
      setIsAnimating(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAnimating]);

  const loopedSlides = hasMultipleSlides ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  const visibleIndex = hasMultipleSlides ? (activeIndex - 1 + slides.length) % slides.length : activeIndex;

  const handleTransitionEnd = () => {
    if (!hasMultipleSlides) return;
    if (activeIndex === 0) {
      setIsAnimating(false);
      setActiveIndex(slides.length);
      return;
    }
    if (activeIndex === slides.length + 1) {
      setIsAnimating(false);
      setActiveIndex(1);
    }
  };

  return (
    <Section className="py-4 md:py-6">
      <div className="relative overflow-hidden rounded-[2rem] text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        {hasMultipleSlides ? (
          <div className="absolute right-6 top-6 z-10 flex items-center gap-2 md:right-10 md:top-8">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-dot-${index}`}
                type="button"
                onClick={() => {
                  setIsAnimating(true);
                  setActiveIndex(index + 1);
                  setAutoplayKey((current) => current + 1);
                }}
                aria-label={`Banner ${index + 1}`}
                className={[
                  "h-2.5 rounded-full transition-all",
                  index === visibleIndex ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70",
                ].join(" ")}
              />
            ))}
          </div>
        ) : null}

        <div
          className={isAnimating ? "flex transition-transform duration-700 ease-out" : "flex"}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopedSlides.map((slide, index) => {
            const themeIndex = hasMultipleSlides
              ? index === 0
                ? slides.length - 1
                : index === loopedSlides.length - 1
                  ? 0
                  : index - 1
              : index;
            const themeKey = slide.theme ?? defaultThemeOrder[themeIndex % defaultThemeOrder.length];
            const theme = slideThemes[themeKey];
            const ctaClassName =
              themeKey === "openjam"
                ? "isolate h-11 rounded-full !border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 !text-white shadow-lg shadow-fuchsia-950/25 hover:brightness-110"
                : "isolate h-11 rounded-full !border-0 !bg-white !text-white shadow-lg shadow-black/20 hover:!bg-white/90";
            const ctaTextClassName = "!text-white";

            return (
              <div
                key={`${slide.title}-${index}`}
                className={`relative min-w-full ${theme.shell}`}
                aria-hidden={themeIndex !== visibleIndex}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.glow}`} />
                <div className="relative mx-auto grid min-h-[250px] max-w-7xl gap-6 px-6 py-7 md:min-h-[290px] md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:gap-8 md:px-10 md:py-8">
                  <div className="flex min-h-full flex-col justify-between gap-6">
                    <div className="max-w-3xl space-y-4">
                      <h1 className="max-w-3xl font-[var(--font-display)] text-3xl font-semibold leading-[1.05] md:text-5xl">
                        {slide.title}
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-white/82 md:text-base">
                        {slide.subtitle}
                      </p>
                    </div>

                    {slide.imageSrc ? (
                      <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/8 shadow-xl shadow-black/20 backdrop-blur md:hidden">
                        <Image
                          src={slide.imageSrc}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        asChild
                        size="lg"
                        className={ctaClassName}
                      >
                        <Link href={slide.ctaHref} className={ctaTextClassName}>
                          {slide.ctaLabel}
                        </Link>
                      </Button>

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasMultipleSlides) return;
                            setIsAnimating(true);
                            setActiveIndex((current) => current - 1);
                            setAutoplayKey((current) => current + 1);
                          }}
                          aria-label="Önceki banner"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/15 text-white transition hover:bg-white/10"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasMultipleSlides) return;
                            setIsAnimating(true);
                            setActiveIndex((current) => current + 1);
                            setAutoplayKey((current) => current + 1);
                          }}
                          aria-label="Sonraki banner"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/15 text-white transition hover:bg-white/10"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {slide.imageSrc ? (
                    <div className="relative mx-auto hidden aspect-square w-full max-w-[220px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/8 shadow-2xl shadow-black/20 backdrop-blur md:block">
                      <Image
                        src={slide.imageSrc}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        sizes="220px"
                        priority={themeIndex === visibleIndex}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </Section>
  );
}
