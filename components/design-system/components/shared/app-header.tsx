"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { cn } from "../../lib/cn";

const links = [
  { href: "/studyo", label: "Stüdyolar" },
  { href: "/studyo", label: "Fiyatlar" },
  { href: "/hakkinda", label: "Hakkında" },
  { href: "/iletisim", label: "İletişim" },
];

export function AppHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--color-primary)]">
            Stüdyom
          </Link>
          <ThemeToggle />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-primary)] md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[var(--color-accent)]">
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/studio-signup">Stüdyo Ekle</Link>
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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 hover:bg-[var(--color-secondary)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild full size="sm">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          <Button asChild full size="sm" variant="secondary">
            <Link href="/studio-signup">Stüdyo Ekle</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
