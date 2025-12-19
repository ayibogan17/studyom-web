"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Menu, X } from "lucide-react";
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
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const { data: session } = useSession();
  const handleProdOpen = () => setShowProd(true);
  const handleProdClose = () => setShowProd(false);
  type HeaderUser = {
    name?: string | null;
    email?: string | null;
    city?: string | null;
    intent?: string[];
    fullName?: string | null;
    emailVerified?: Date | string | null;
    teacherStatus?: "approved" | "pending" | "none";
    producerStatus?: "approved" | "pending" | "none";
    studioStatus?: "approved" | "pending" | "none";
  };
  const profile = session?.user as HeaderUser | undefined;
  const showTeacherPanel = profile?.teacherStatus === "approved";
  const showProducerPanel = profile?.producerStatus === "approved";
  const showStudioPanel = profile?.studioStatus === "approved";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!showProfile) return;
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfile]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--color-primary)]">
            Stüdyom
          </Link>
        </div>
        <nav className="relative hidden min-w-0 items-center gap-4 text-sm font-medium text-[var(--color-primary)] whitespace-nowrap md:flex md:flex-nowrap">
          {session && (
            <span className="max-w-[180px] truncate text-sm font-semibold text-[var(--color-primary)]">
              Hoş geldin, {profile?.fullName || profile?.name || session.user?.email}
            </span>
          )}
          <Button asChild size="sm" className="shrink-0">
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
          {!session && (
            <Button asChild size="sm" variant="secondary">
              <Link href="/login">Giriş</Link>
            </Button>
          )}
          {session && (
            <div className="relative" ref={profileRef}>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
              >
                Profilim
              </Link>
            </div>
          )}
          {session && showTeacherPanel && (
            <Link
              href="/teacher-panel"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            >
              Hoca Paneli
            </Link>
          )}
          {session && showProducerPanel && (
            <Link
              href="/producer-panel"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            >
              Üretici Paneli
            </Link>
          )}
          {session && showStudioPanel && (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard?as=studio"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
              >
                Stüdyo Paneli
              </Link>
              <Link
                href="/notifications"
                aria-label="Bildirimler"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
              >
                <Bell className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Çıkış yap"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
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
          {session && (
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Hoş geldin, {profile?.fullName || profile?.name || session.user?.email}
            </span>
          )}
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
          {!session && (
            <Button asChild full size="sm" variant="secondary">
              <Link href="/login">Giriş</Link>
            </Button>
          )}
          {session && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-primary)]">
              <p className="font-semibold">
                {profile?.fullName || session.user?.name || session.user?.email}
              </p>
              <p className="text-[var(--color-muted)]">{session.user?.email}</p>
              {profile?.city && <p className="mt-1">Şehir: {profile.city}</p>}
              {profile?.intent && profile.intent.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.intent.map((i) => (
                    <span key={i} className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-[12px]">
                      {i}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {profile?.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulaması bekleniyor"}
              </p>
            </div>
          )}
          {session && showTeacherPanel && (
            <Button asChild full size="sm" variant="secondary">
              <Link href="/teacher-panel" onClick={() => setOpen(false)}>
                Hoca Paneli
              </Link>
            </Button>
          )}
          {session && showProducerPanel && (
            <Button asChild full size="sm" variant="secondary">
              <Link href="/producer-panel" onClick={() => setOpen(false)}>
                Üretici Paneli
              </Link>
            </Button>
          )}
          {session && showStudioPanel && (
            <Button asChild full size="sm" variant="secondary">
              <Link href="/dashboard?as=studio" onClick={() => setOpen(false)}>
                Stüdyo Paneli
              </Link>
            </Button>
          )}
          {session && showStudioPanel && (
            <Button asChild variant="secondary" size="sm" className="w-fit px-3">
              <Link href="/notifications" onClick={() => setOpen(false)} aria-label="Bildirimler">
                <Bell className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
