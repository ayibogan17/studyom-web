import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Section } from "@/components/design-system/components/shared/section";
import { ProducerMessageSection } from "./producer-message-section";
import { ProducerStudioLinksSection } from "./producer-studio-links-section";
import { ProducerProfileSectionsClient } from "./producer-profile-sections-client";
import { ProducerPanelHeaderClient } from "./producer-panel-header-client";

export const metadata: Metadata = {
  title: "Üretici Paneli | Studyom",
  description: "Onaylanan üretici başvurunun özetini görüntüleyin.",
  robots: { index: false, follow: false },
};

export default async function ProducerPanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <ProducerPanelHeaderClient />

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Mesajlar yükleniyor...
            </div>
          }
        >
          <ProducerMessageSection />
        </Suspense>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Başvuru bilgileri yükleniyor...
            </div>
          }
        >
          <ProducerPanelHeaderClient showApplication />
        </Suspense>

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
