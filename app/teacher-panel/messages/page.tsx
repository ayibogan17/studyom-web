import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherThreadChannel } from "@/lib/realtime";
import { Section } from "@/components/design-system/components/shared/section";
import { TeacherMessagesClient, type TeacherThreadItem, type TeacherRequestItem } from "../messages-client";

export const metadata: Metadata = {
  title: "Hoca Paneli Mesajları | Studyom",
  description: "Öğrencilerden gelen mesajları görüntüleyin ve yanıtlayın.",
  robots: { index: false, follow: false },
};

function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

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
    select: { id: true, data: true },
  });
  if (!approved) {
    redirect("/profile");
  }

  const whatsappEnabled =
    typeof (approved.data as { whatsappEnabled?: unknown } | null)?.whatsappEnabled === "boolean"
      ? Boolean((approved.data as { whatsappEnabled?: unknown }).whatsappEnabled)
      : false;
  const teacherName = dbUser.fullName || dbUser.name || dbUser.email || "Hoca";
  const teacherAvatar = {
    image: dbUser.image ?? null,
    initials: getInitials(teacherName),
  };
  const storedStudents = Array.isArray((approved.data as { studyomStudents?: unknown } | null)?.studyomStudents)
    ? ((approved.data as { studyomStudents?: unknown }).studyomStudents as { id?: unknown }[])
        .map((item) => (typeof item?.id === "string" ? item.id : null))
        .filter((id): id is string => Boolean(id))
    : [];

  const threads = await prisma.teacherThread.findMany({
    where: { teacherUserId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: {
      studentUser: { select: { id: true, fullName: true, email: true, image: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const items: TeacherThreadItem[] = threads.map((thread) => ({
    id: thread.id,
    teacherSlug: thread.teacherSlug,
    channel: getTeacherThreadChannel(thread.id),
    locked: thread.locked,
    student: {
      id: thread.studentUser.id,
      name: thread.studentUser.fullName || thread.studentUser.email || "Öğrenci",
      email: thread.studentUser.email ?? null,
      image: thread.studentUser.image ?? null,
    },
    messages: thread.messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      senderRole: msg.senderRole,
      createdAt: msg.createdAt.toISOString(),
    })),
  }));

  if (threads.length > 0) {
    const threadIds = threads.map((thread) => thread.id);
    await prisma.teacherMessage.updateMany({
      where: {
        threadId: { in: threadIds },
        senderRole: "student",
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const requests = await prisma.teacherMessageRequest.findMany({
    where: { teacherUserId: dbUser.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      studentUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  const requestItems: TeacherRequestItem[] = requests.map((req) => ({
    id: req.id,
    teacherSlug: req.teacherSlug,
    messageText: req.messageText,
    createdAt: req.createdAt.toISOString(),
    student: {
      id: req.studentUser.id,
      name: req.studentUser.fullName || req.studentUser.email || "Öğrenci",
      email: req.studentUser.email ?? null,
    },
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

        <TeacherMessagesClient
          initialThreads={items}
          initialRequests={requestItems}
          whatsappEnabled={whatsappEnabled}
          initialStudentIds={storedStudents}
          teacherAvatar={teacherAvatar}
        />
      </Section>
    </main>
  );
}
