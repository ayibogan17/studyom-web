import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { ProducerRequestsClient, type ProducerMessageRequestItem } from "./requests-client";
import { ProducerProfileEditor } from "./producer-profile-editor";
import { ProducerGalleryClient } from "./producer-gallery-client";
import { TeacherPanelSection } from "@/app/teacher-panel/teacher-panel-section";
import { ProducerWhatsAppSettings } from "./producer-whatsapp-settings";
import { ProducerStudioLinksClient } from "./producer-studio-links-client";

export const metadata: Metadata = {
  title: "Üretici Paneli | Studyom",
  description: "Onaylanan üretici başvurunun özetini görüntüleyin.",
  robots: { index: false, follow: false },
};

type ProducerApplicationData = {
  areas?: string[];
  workTypes?: string[];
  modes?: string[];
  city?: string | null;
  genres?: string[];
  statement?: string | null;
  bio?: string | null;
  links?: string[];
  galleryUrls?: string[];
  projects?: string | null;
  years?: string | null;
  price?: string | null;
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseData(value: unknown): ProducerApplicationData {
  if (value && typeof value === "object") return value as ProducerApplicationData;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ProducerApplicationData;
    } catch {
      return {};
    }
  }
  return {};
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function ProducerPanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as { id?: string; email?: string | null };
  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  if (!dbUser) {
    redirect("/login");
  }

  const rows = await prisma.$queryRaw<
    { id: number; data: unknown; status: string; createdAt: Date | string }[]
  >`
    SELECT id, data, status, "createdAt"
    FROM "ProducerApplication"
    WHERE "userId" = ${dbUser.id} AND status IN ('approved', 'pending')
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  const application = rows[0];

  if (!application) {
    redirect("/profile");
  }

  const isApproved = application.status === "approved";

  const [messageRequests, totalRequestCount, activeThreadCount, studioLinks] = await Promise.all([
    prisma.producerMessageRequest.findMany({
      where: { producerUserId: dbUser.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        createdAt: true,
        fromUser: { select: { fullName: true, email: true } },
      },
    }),
    prisma.producerMessageRequest.count({ where: { producerUserId: dbUser.id } }),
    prisma.producerThread.count({ where: { producerUserId: dbUser.id } }),
    prisma.producerStudioLink.findMany({
      where: { producerUserId: dbUser.id },
      include: { studio: { select: { id: true, name: true, city: true, district: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const requestItems: ProducerMessageRequestItem[] = messageRequests.map((row) => ({
    id: row.id,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    fromUser: row.fromUser || {},
  }));

  const studioLinkItems = studioLinks.map((link) => ({
    id: link.id,
    status: link.status as "pending" | "approved" | "rejected",
    createdAt: link.createdAt.toISOString(),
    studio: link.studio,
  }));

  const data = parseData(application.data);
  const areas = normalizeArray(data.areas);
  const workTypes = normalizeArray(data.workTypes);
  const modes = normalizeArray(data.modes);
  const genres = normalizeArray(data.genres);
  const links = normalizeArray(data.links).filter(isHttpUrl);
  const galleryUrls = normalizeArray(data.galleryUrls).filter(isHttpUrl).slice(0, 5);
  const city = typeof data.city === "string" ? data.city : dbUser.city || null;
  const price = typeof data.price === "string" && data.price.trim() ? data.price : "Belirtilmedi";
  const statement =
    typeof data.statement === "string" && data.statement.trim() ? data.statement.trim() : "Belirtilmedi";
  const bio = typeof data.bio === "string" && data.bio.trim() ? data.bio.trim() : "";
  const years = typeof data.years === "string" && data.years.trim() ? data.years : "Belirtilmedi";
  const projects =
    typeof data.projects === "string" && data.projects.trim() ? data.projects : "Belirtilmedi";
  const whatsappNumber = typeof data.whatsappNumber === "string" ? data.whatsappNumber : "";
  const whatsappEnabled = Boolean(data.whatsappEnabled);

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Üretici Paneli</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {isApproved
              ? "Onaylanan başvurunda paylaştığın bilgiler aşağıdadır. Güncellemeler için destek ekibimizle iletişime geçebilirsin."
              : "Başvurun incelemede. Paylaştığın bilgiler aşağıdadır; değişiklik için destek ekibine yazabilirsin."}
          </p>
        </header>

        <TeacherPanelSection
          title="Mesajlar"
          description="Yeni mesaj taleplerini ve iletişimi buradan yönetebilirsin."
          defaultOpen
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-muted)]">Sohbetleri görüntülemek için mesajlar sayfasına geç.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/producer-panel/messages">Mesajları aç</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Bekleyen talepler</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">{messageRequests.length}</p>
              <p className="text-xs text-[var(--color-muted)]">Yanıtladığında sohbet açılır.</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Aktif sohbetler</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">{activeThreadCount}</p>
              <p className="text-xs text-[var(--color-muted)]">Konuşmaların açık olanları.</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Toplam talepler</p>
              <p className="text-2xl font-semibold text-[var(--color-primary)]">{totalRequestCount}</p>
              <p className="text-xs text-[var(--color-muted)]">Geçmiş ve bekleyen istekler.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Mesaj talepleri</p>
            <div className="mt-3">
              <ProducerRequestsClient initial={requestItems} />
            </div>
          </div>
        </TeacherPanelSection>

        <TeacherPanelSection title="Başvuru bilgileri" defaultOpen>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Başvuru durumu</p>
              <p className="text-xs text-[var(--color-muted)]">Onay tarihi: {formatDate(application.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              {dbUser.image && (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]">
                  <img src={dbUser.image} alt="Profil fotoğrafı" className="h-full w-full object-cover" />
                </div>
              )}
              <Badge variant={isApproved ? "default" : "muted"}>
                {isApproved ? "Onaylandı" : "İncelemede"}
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ad Soyad</p>
              <p className="text-sm text-[var(--color-primary)]">{dbUser.fullName || dbUser.name || "—"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">E-posta</p>
              <p className="text-sm text-[var(--color-primary)]">{dbUser.email}</p>
            </div>
          </div>
        </TeacherPanelSection>

        <TeacherPanelSection title="Üretim bilgileri" defaultOpen>
          <ProducerProfileEditor
            initial={{
              areas,
              workTypes,
              modes,
              city: city || "",
              genres,
              price: price === "Belirtilmedi" ? "" : price,
              years: years === "Belirtilmedi" ? "" : years,
              projects: projects === "Belirtilmedi" ? "" : projects,
              statement: statement === "Belirtilmedi" ? "" : statement,
              bio,
            }}
          />
        </TeacherPanelSection>

        <TeacherPanelSection title="Çalıştığı stüdyolar" defaultOpen>
          <ProducerStudioLinksClient initialLinks={studioLinkItems} />
        </TeacherPanelSection>

        <TeacherPanelSection
          title="WhatsApp ayarları"
          description="Kullanıcılarla WhatsApp üzerinden devam etmeyi burada açıp kapatabilirsin."
        >
          <ProducerWhatsAppSettings initialNumber={whatsappNumber} initialEnabled={whatsappEnabled} />
        </TeacherPanelSection>

        <TeacherPanelSection title="Görseller" defaultOpen>
          <ProducerGalleryClient initialUrls={galleryUrls} />
        </TeacherPanelSection>

        <TeacherPanelSection title="Bağlantılar" defaultOpen>
          <div className="flex items-center justify-between gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/profile">Profilime dön</Link>
            </Button>
          </div>
          {links.length ? (
            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                >
                  {link}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Belirtilmedi</p>
          )}
        </TeacherPanelSection>
      </Section>
    </main>
  );
}
