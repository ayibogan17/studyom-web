"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Menu, MessageSquare, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/cn";

const links = [{ href: "/hocalar", label: "Hocalar" }];

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
  const [indicators, setIndicators] = useState({
    notifications: false,
    messages: false,
    teacherPanel: false,
    producerPanel: false,
    studioPanel: false,
  });
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
    image?: string | null;
    teacherStatus?: "approved" | "pending" | "none";
    producerStatus?: "approved" | "pending" | "none";
    studioStatus?: "approved" | "pending" | "none";
  };
  const profile = session?.user as HeaderUser | undefined;
  const showTeacherPanel = profile?.teacherStatus === "approved";
  const showProducerPanel = profile?.producerStatus === "approved";
  const showStudioPanel = profile?.studioStatus !== "none";

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

  useEffect(() => {
    if (!session) {
      setIndicators({
        notifications: false,
        messages: false,
        teacherPanel: false,
        producerPanel: false,
        studioPanel: false,
      });
      return;
    }
    let active = true;
    fetch("/api/nav/indicators")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setIndicators({
          notifications: Boolean(json?.notificationsUnread),
          messages: Boolean(json?.messagesUnread),
          teacherPanel: Boolean(json?.teacherPanelUnread),
          producerPanel: Boolean(json?.producerPanelUnread),
          studioPanel: Boolean(json?.studioPanelUnread),
        });
      })
      .catch(() => {
        if (!active) return;
        setIndicators({
          notifications: false,
          messages: false,
          teacherPanel: false,
          producerPanel: false,
          studioPanel: false,
        });
      });
    return () => {
      active = false;
    };
  }, [session]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[var(--color-primary)]">
            <img src="/logo.svg" alt="Studyom" className="h-3 w-3 shrink-0 object-contain" />
            Studyom
          </Link>
        </div>
        <nav className="relative hidden min-w-0 items-center gap-4 text-sm font-medium text-[var(--color-primary)] whitespace-nowrap md:flex md:flex-nowrap">
          <Button asChild size="sm" className="shrink-0">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          <div className="relative" onMouseEnter={handleProdOpen} onMouseLeave={handleProdClose}>
            <Link
              href="/uretim"
              className="flex items-center gap-1 rounded-xl px-3 py-2 transition hover:bg-[var(--color-secondary)]"
              aria-haspopup="true"
              aria-expanded={showProd}
              onFocus={handleProdOpen}
              onBlur={handleProdClose}
            >
              Üretim
              <span className="text-[10px] text-[var(--color-muted)]">▼</span>
            </Link>
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
          {links.map((link) => (
            <div key={`${link.href}-${link.label}`} className="flex items-center gap-2">
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
          {session && showTeacherPanel && (
            <Link
              href="/teacher-panel"
              className="relative flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            >
              Hoca Paneli
              {indicators.teacherPanel && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
              )}
            </Link>
          )}
          {session && showProducerPanel && (
            <Link
              href="/producer-panel"
              className="relative flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            >
              Üretici Paneli
              {indicators.producerPanel && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
              )}
            </Link>
          )}
          {session && showStudioPanel && (
            <Link
              href="/dashboard?as=studio&tab=calendar"
              className="relative flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            >
              Stüdyo Paneli
              {indicators.studioPanel && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
              )}
            </Link>
          )}
          {session && (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                aria-label="Profil"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] text-xs font-semibold text-[var(--color-primary)]"
              >
                {profile?.image ? (
                  <img src={profile.image} alt="Profil fotoğrafı" className="h-full w-full object-cover" />
                ) : (
                  <span>
                    {(profile?.fullName || profile?.name || session.user?.email || "U")
                      .split(" ")
                      .map((part) => part.trim())
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                aria-label="Mesajlar"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                {indicators.messages && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yellow-400" />
                )}
              </Link>
              <Link
                href="/notifications"
                aria-label="Bildirimler"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
              >
                <Bell className="h-4 w-4" aria-hidden />
                {indicators.notifications && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yellow-400" />
                )}
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
          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
            <Link
              href="/uretim"
              className="text-sm font-semibold text-[var(--color-primary)]"
              onClick={() => setOpen(false)}
            >
              Üretim
            </Link>
            <div className="space-y-2">
              {productionItems.map((item) => (
                <div key={item.title} className="rounded-xl bg-[var(--color-surface)] p-2">
                  <p className="text-xs font-semibold text-[var(--color-primary)]">{item.title}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-xl px-3 py-2 hover:bg-[var(--color-secondary)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
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
              <Link href="/teacher-panel" onClick={() => setOpen(false)} className="relative">
                Hoca Paneli
                {indicators.teacherPanel && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                )}
              </Link>
            </Button>
          )}
          {session && showProducerPanel && (
            <Button asChild full size="sm" variant="secondary">
              <Link href="/producer-panel" onClick={() => setOpen(false)} className="relative">
                Üretici Paneli
                {indicators.producerPanel && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                )}
              </Link>
            </Button>
          )}
          {session && showStudioPanel && (
            <Button asChild full size="sm" variant="secondary">
              <Link
                href="/dashboard?as=studio&tab=calendar"
                onClick={() => setOpen(false)}
                className="relative"
              >
                Stüdyo Paneli
                {indicators.studioPanel && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                )}
              </Link>
            </Button>
          )}
          {session && (
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                onClick={() => setOpen(false)}
                aria-label="Mesajlar"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                {indicators.messages && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yellow-400" />
                )}
              </Link>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                aria-label="Bildirimler"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]"
              >
                <Bell className="h-4 w-4" aria-hidden />
                {indicators.notifications && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yellow-400" />
                )}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Çıkış yap"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
