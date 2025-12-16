"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/cn";

const links = [
  { href: "/hocalar", label: "Hocalar" },
  { href: "/hakkinda", label: "Hakkında" },
  { href: "/iletisim", label: "İletişim" },
];

const productionItems = [
  {
    title: "Mix & Mastering",
    desc: "Şarkını son haline getiren teknisyenler",
  },
  {
    title: "Edit & Temizlik",
    desc: "Vokal, timing, pitch, düzenleme",
  },
  {
    title: "Enstrüman Kayıtları",
    desc: "Gitar, bas, bateri, yaylı, üflemeli",
  },
  {
    title: "Aranje & Prodüksiyon",
    desc: "Şarkıyı baştan sona inşa eden prodüktörler",
  },
];

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const [showProd, setShowProd] = useState(false);
  const handleProdOpen = () => setShowProd(true);
  const handleProdClose = () => setShowProd(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--color-primary)]">
            Stüdyom
          </Link>
        </div>
        <nav className="relative hidden items-center gap-6 text-sm font-medium text-[var(--color-primary)] md:flex">
          <Button asChild size="sm">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          {links.map((link) => (
            <div key={`${link.href}-${link.label}`} className="flex items-center gap-2">
              {link.label === "Hakkında" && (
                <div
                  className="relative"
                  onMouseEnter={handleProdOpen}
                  onMouseLeave={handleProdClose}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl px-3 py-2 transition hover:bg-[var(--color-secondary)]"
                    aria-haspopup="true"
                    aria-expanded={showProd}
                    onFocus={handleProdOpen}
                    onBlur={handleProdClose}
                  >
                    Üretim
                    <span className="text-[10px] text-[var(--color-muted)]">▼</span>
                  </button>
                  {showProd && (
                    <div
                      className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg"
                      onMouseEnter={handleProdOpen}
                      onMouseLeave={handleProdClose}
                    >
                      <div className="space-y-3 text-left">
                        {productionItems.map((item) => (
                          <div key={item.title} className="rounded-xl bg-[var(--color-secondary)] p-3">
                            <p className="text-sm font-semibold text-[var(--color-primary)]">{item.title}</p>
                            <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Link
                href={link.href}
                className="transition hover:text-[var(--color-accent)]"
              >
                {link.label}
              </Link>
            </div>
          ))}
          <Button asChild size="sm" variant="secondary">
            <Link href="/login">Giriş</Link>
          </Button>
        </nav>
        <button
          className="md:hidden"
          aria-label="Menüyü aç"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <div
        className={cn(
          "md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 pb-4 pt-2 transition-all",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-3 text-sm font-medium text-[var(--color-primary)]">
          <Button asChild full size="sm">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          {links.map((link) => (
            <div key={`${link.href}-${link.label}`} className="flex flex-col gap-1">
              {link.label === "Hakkında" && (
                <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
                  <p className="text-sm font-semibold text-[var(--color-primary)]">Üretim</p>
                  <div className="space-y-2">
                    {productionItems.map((item) => (
                      <div key={item.title} className="rounded-xl bg-[var(--color-surface)] p-2">
                        <p className="text-xs font-semibold text-[var(--color-primary)]">{item.title}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Link
                href={link.href}
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-secondary)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </div>
          ))}
          <Button asChild full size="sm" variant="secondary">
            <Link href="/login">Giriş</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
