import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { Badge } from "@/components/design-system/components/ui/badge";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerMessageSection } from "./producer-message-section";
import { ProducerStudioLinksSection } from "./producer-studio-links-section";
import { ProducerProfileSectionsClient } from "./producer-profile-sections-client";

export const metadata: Metadata = {
  title: "Üretici Paneli | Studyom",
  description: "Onaylanan üretici başvurunun özetini görüntüleyin.",
  robots: { index: false, follow: false },
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
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

  const rows = await prisma.$queryRaw<{ id: number; status: string; createdAt: Date | string }[]>`
    SELECT id, status, "createdAt"
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

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Mesajlar yükleniyor...
            </div>
          }
        >
          <ProducerMessageSection />
        </Suspense>

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

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Profil bilgileri yükleniyor...
            </div>
          }
        >
          <ProducerProfileSectionsClient />
        </Suspense>
      </Section>
    </main>
  );
}
