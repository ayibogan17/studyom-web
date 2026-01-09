import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import MessagesClient from "./messages-client";

export const revalidate = 0;

export default async function AdminMessagesPage() {
  await requireAdmin();

  const [studioThreads, teacherThreads, producerThreads] = await Promise.all([
    prisma.studioThread.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        studio: { select: { id: true, name: true } },
        studentUser: { select: { id: true, fullName: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.teacherThread.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        teacherUser: { select: { id: true, fullName: true, name: true, email: true } },
        studentUser: { select: { id: true, fullName: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.producerThread.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        producerUser: { select: { id: true, fullName: true, name: true, email: true } },
        studentUser: { select: { id: true, fullName: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const items = [
    ...studioThreads.map((thread) => ({
      id: thread.id,
      type: "studio" as const,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      locked: thread.locked,
      resolved: thread.resolved,
      complaintsCount: thread.complaintsCount,
      investigationEnabled: thread.investigationEnabled,
      internalNote: thread.internalNote,
      messageCount: thread._count.messages,
      title: thread.studio?.name || "Stüdyo",
      participants: [thread.studentUser?.fullName || thread.studentUser?.name || thread.studentUser?.email || "Öğrenci"],
    })),
    ...teacherThreads.map((thread) => ({
      id: thread.id,
      type: "teacher" as const,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      locked: thread.locked,
      resolved: thread.resolved,
      complaintsCount: thread.complaintsCount,
      investigationEnabled: thread.investigationEnabled,
      internalNote: thread.internalNote,
      messageCount: thread._count.messages,
      title: thread.teacherUser?.fullName || thread.teacherUser?.name || thread.teacherUser?.email || "Hoca",
      participants: [thread.studentUser?.fullName || thread.studentUser?.name || thread.studentUser?.email || "Öğrenci"],
    })),
    ...producerThreads.map((thread) => ({
      id: thread.id,
      type: "producer" as const,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      locked: thread.locked,
      resolved: thread.resolved,
      complaintsCount: thread.complaintsCount,
      investigationEnabled: thread.investigationEnabled,
      internalNote: thread.internalNote,
      messageCount: thread._count.messages,
      title: thread.producerUser?.fullName || thread.producerUser?.name || thread.producerUser?.email || "Üretici",
      participants: [thread.studentUser?.fullName || thread.studentUser?.name || thread.studentUser?.email || "Öğrenci"],
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Mesaj Moderasyonu</h1>
        <p className="text-sm text-[var(--color-muted)]">Sadece metadata görünür. İnceleme modunda içerik açılır.</p>
      </div>
      <Card className="p-4">
        <MessagesClient threads={items} />
      </Card>
    </Section>
  );
}
