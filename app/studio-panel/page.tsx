import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stüdyo Paneli | Studyom",
  description: "Onaylanan stüdyo başvurunuzun özetini görüntüleyin.",
};

type NotificationItem = { message: string };

type ParsedDetails = {
  applicationStatus?: string | null;
  contactMethods?: string | null;
  bookingMode?: string | null;
  roomInfo?: string | null;
  equipmentSignal?: string | null;
  equipmentHighlight?: string | null;
  mapsUrl?: string | null;
  contactHours?: string | null;
  priceRange?: string | null;
  manualReview?: string | null;
  other: string[];
};

function parseNotifications(notifications: NotificationItem[]): ParsedDetails {
  const details: ParsedDetails = { other: [] };
  notifications.forEach((note) => {
    const msg = note.message || "";
    if (msg.startsWith("Başvuru durumu:")) {
      details.applicationStatus = msg.replace("Başvuru durumu:", "").trim();
      return;
    }
    if (msg.startsWith("İletişim tercihleri:")) {
      details.contactMethods = msg.replace("İletişim tercihleri:", "").trim();
      return;
    }
    if (msg.startsWith("Booking modu:")) {
      details.bookingMode = msg.replace("Booking modu:", "").trim();
      return;
    }
    if (msg.startsWith("Oda sayısı:")) {
      details.roomInfo = msg.replace("Oda sayısı:", "").trim();
      return;
    }
    if (msg.startsWith("Ekipman sinyali:")) {
      details.equipmentSignal = msg.replace("Ekipman sinyali:", "").trim();
      return;
    }
    if (msg.startsWith("Öne çıkan ekipman:")) {
      details.equipmentHighlight = msg.replace("Öne çıkan ekipman:", "").trim();
      return;
    }
    if (msg.startsWith("Maps:")) {
      details.mapsUrl = msg.replace("Maps:", "").trim();
      return;
    }
    if (msg.startsWith("İletişim saatleri:")) {
      details.contactHours = msg.replace("İletişim saatleri:", "").trim();
      return;
    }
    if (msg.startsWith("Fiyat aralığı:")) {
      details.priceRange = msg.replace("Fiyat aralığı:", "").trim();
      return;
    }
    if (msg.startsWith("Manuel inceleme:")) {
      details.manualReview = msg.replace("Manuel inceleme:", "").trim();
      return;
    }
    if (msg) details.other.push(msg);
  });
  return details;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function formatHours(hours?: unknown) {
  if (!Array.isArray(hours)) return "Belirtilmedi";
  const entries = hours
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { open?: boolean; openTime?: string; closeTime?: string };
      const openTime = row.openTime || "—";
      const closeTime = row.closeTime || "—";
      return row.open === false ? "Kapalı" : `${openTime} - ${closeTime}`;
    })
    .filter(Boolean) as string[];
  if (!entries.length) return "Belirtilmedi";
  if (entries.length === 1) return entries[0];
  return `Hafta içi: ${entries[0]} · Hafta sonu: ${entries[1] ?? "Belirtilmedi"}`;
}

function isHttpUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function StudioPanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const ownerEmail = session.user.email.toLowerCase();
  const studio = await prisma.studio.findFirst({
    where: { ownerEmail, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!studio) {
    redirect("/profile");
  }

  const details = parseNotifications(studio.notifications);

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Stüdyo Paneli</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Onaylanan stüdyo başvurunda paylaştığın bilgiler aşağıdadır. Düzenleme için stüdyo paneline
            devam edebilirsin.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Başvuru durumu</p>
              <p className="text-xs text-[var(--color-muted)]">Onay tarihi: {formatDate(studio.createdAt)}</p>
            </div>
            <Badge variant="default">Onaylandı</Badge>
          </div>
          {details.applicationStatus ? (
            <p className="text-xs text-[var(--color-muted)]">Başvuru notu: {details.applicationStatus}</p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Temel bilgiler</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Stüdyo adı</p>
              <p className="text-sm text-[var(--color-primary)]">{studio.name}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Şehir / İlçe</p>
              <p className="text-sm text-[var(--color-primary)]">
                {[studio.city, studio.district].filter(Boolean).join(" · ") || "Belirtilmedi"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Açık adres</p>
              <p className="text-sm text-[var(--color-primary)]">{studio.address || "Belirtilmedi"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Telefon</p>
              <p className="text-sm text-[var(--color-primary)]">{studio.phone || "Belirtilmedi"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Açılış saatleri</p>
              <p className="text-sm text-[var(--color-primary)]">{formatHours(studio.openingHours)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Harita linki</p>
              {isHttpUrl(details.mapsUrl) ? (
                <a
                  href={details.mapsUrl as string}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Haritada aç
                </a>
              ) : (
                <p className="text-sm text-[var(--color-primary)]">Belirtilmedi</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Başvuru detayları</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">İletişim tercihleri</p>
              <p className="text-sm text-[var(--color-primary)]">{details.contactMethods || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">İletişim saatleri</p>
              <p className="text-sm text-[var(--color-primary)]">{details.contactHours || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Booking modu</p>
              <p className="text-sm text-[var(--color-primary)]">{details.bookingMode || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Oda bilgisi</p>
              <p className="text-sm text-[var(--color-primary)]">{details.roomInfo || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ekipman setleri</p>
              <p className="text-sm text-[var(--color-primary)]">{details.equipmentSignal || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Öne çıkan ekipman</p>
              <p className="text-sm text-[var(--color-primary)]">{details.equipmentHighlight || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Fiyat aralığı</p>
              <p className="text-sm text-[var(--color-primary)]">{details.priceRange || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Manuel inceleme</p>
              <p className="text-sm text-[var(--color-primary)]">{details.manualReview || "Belirtilmedi"}</p>
            </div>
          </div>
          {details.other.length ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-primary)]">
              <p className="mb-2 text-sm font-semibold text-[var(--color-primary)]">Diğer notlar</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--color-muted)]">
                {details.other.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Stüdyo yönetimi</p>
            <p className="text-xs text-[var(--color-muted)]">Oda ve fiyat düzenlemeleri için yönetim paneli.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard?as=studio&tab=calendar">Yönetim paneline git</Link>
          </Button>
        </Card>
      </Section>
    </main>
  );
}
