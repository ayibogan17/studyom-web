import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/design-system/components/ui/button";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerRequestsClient, type ProducerMessageRequestItem } from "./requests-client";

export async function ProducerMessageSection({ userId }: { userId: string }) {
  const [messageRequests, totalRequestCount, activeThreadCount] = await Promise.all([
    prisma.producerMessageRequest.findMany({
      where: { producerUserId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        createdAt: true,
        fromUser: { select: { fullName: true, email: true } },
      },
    }),
    prisma.producerMessageRequest.count({ where: { producerUserId: userId } }),
    prisma.producerThread.count({ where: { producerUserId: userId } }),
  ]);

  const requestItems: ProducerMessageRequestItem[] = messageRequests.map((row) => ({
    id: row.id,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    fromUser: row.fromUser || {},
  }));

  return (
    <TeacherPanelSection title="Mesajlar" description="Yeni mesaj taleplerini ve iletişimi buradan yönetebilirsin." defaultOpen>
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
  );
}
