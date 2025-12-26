import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherThreadChannel } from "@/lib/realtime";
import { Section } from "@/components/design-system/components/shared/section";
import { TeacherMessagesClient, type TeacherThreadItem } from "../messages-client";

export const metadata: Metadata = {
  title: "Hoca Paneli Mesajları | Stüdyom",
  description: "Öğrencilerden gelen mesajları görüntüleyin ve yanıtlayın.",
};

export default async function TeacherMessagesPage() {
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

  const approved = await prisma.teacherApplication.findFirst({
    where: { userId: dbUser.id, status: "approved" },
    select: { id: true },
  });
  if (!approved) {
    redirect("/profile");
  }

  const threads = await prisma.teacherThread.findMany({
    where: { teacherUserId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: {
      studentUser: { select: { fullName: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const items: TeacherThreadItem[] = threads.map((thread) => ({
    id: thread.id,
    teacherSlug: thread.teacherSlug,
    channel: getTeacherThreadChannel(thread.id),
    student: {
      name: thread.studentUser.fullName || thread.studentUser.email || "Öğrenci",
      email: thread.studentUser.email ?? null,
    },
    messages: thread.messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      senderRole: msg.senderRole,
      createdAt: msg.createdAt.toISOString(),
    })),
  }));

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Hoca Paneli</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Mesajlar</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Öğrencilerden gelen mesajları burada yanıtlayabilirsin.
          </p>
        </header>

        <TeacherMessagesClient initialThreads={items} />
      </Section>
    </main>
  );
}
