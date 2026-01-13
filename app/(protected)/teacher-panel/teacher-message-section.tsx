import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/design-system/components/ui/button";
import { TeacherPanelSection } from "./teacher-panel-section";

export async function TeacherMessageSection({ userId }: { userId: string }) {
  const [pendingRequestCount, threadCount] = await Promise.all([
    prisma.teacherMessageRequest.count({
      where: { teacherUserId: userId, status: "pending" },
    }),
    prisma.teacherThread.count({ where: { teacherUserId: userId } }),
  ]);

  return (
    <TeacherPanelSection
      title="Mesajlar"
      description="Öğrencilerden gelen yeni talepleri ve aktif sohbetleri buradan takip edebilirsin."
      defaultOpen
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Bekleyen talepler</p>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">{pendingRequestCount}</p>
          <p className="text-xs text-[var(--color-muted)]">Yanıtladığında sohbet açılır.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Aktif sohbetler</p>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">{threadCount}</p>
          <p className="text-xs text-[var(--color-muted)]">Devam eden mesajlaşmalar.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button asChild size="sm" variant="secondary">
          <Link href="/teacher-panel/messages">Mesajlara git</Link>
        </Button>
      </div>
    </TeacherPanelSection>
  );
}
