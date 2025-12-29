import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProducerThreadChannel } from "@/lib/realtime";
import { Section } from "@/components/design-system/components/shared/section";
import { ProducerMessagesClient, type ProducerThreadItem, type ProducerRequestItem } from "../messages-client";

export const metadata: Metadata = {
  title: "Üretici Paneli Mesajları | Stüdyom",
  description: "Kullanıcılardan gelen mesajları görüntüleyin ve yanıtlayın.",
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

export default async function ProducerMessagesPage() {
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

  const approved = await prisma.producerApplication.findFirst({
    where: { userId: dbUser.id, status: { in: ["approved", "pending"] } },
    select: { id: true },
  });
  if (!approved) {
    redirect("/profile");
  }

  const threads = await prisma.producerThread.findMany({
    where: { producerUserId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: {
      studentUser: { select: { id: true, fullName: true, email: true, image: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const items: ProducerThreadItem[] = threads.map((thread) => ({
    id: thread.id,
    producerSlug: thread.producerSlug,
    channel: getProducerThreadChannel(thread.id),
    student: {
      id: thread.studentUser.id,
      name: thread.studentUser.fullName || thread.studentUser.email || "Kullanıcı",
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
    await prisma.producerMessage.updateMany({
      where: {
        threadId: { in: threadIds },
        senderRole: "student",
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const requests = await prisma.producerMessageRequest.findMany({
    where: { producerUserId: dbUser.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, fullName: true, email: true, image: true } },
    },
  });

  const requestItems: ProducerRequestItem[] = requests.map((req) => ({
    id: req.id,
    messageText: req.message,
    createdAt: req.createdAt.toISOString(),
    student: {
      id: req.fromUser.id,
      name: req.fromUser.fullName || req.fromUser.email || "Kullanıcı",
      email: req.fromUser.email ?? null,
      image: req.fromUser.image ?? null,
    },
  }));

  const producerName = dbUser.fullName || dbUser.name || dbUser.email || "Üretici";
  const producerAvatar = {
    image: dbUser.image ?? null,
    initials: getInitials(producerName),
  };

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Üretici Paneli</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Mesajlar</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Kullanıcılardan gelen mesajları burada yönetebilirsin.
          </p>
        </header>

        <ProducerMessagesClient
          initialThreads={items}
          initialRequests={requestItems}
          producerAvatar={producerAvatar}
        />
      </Section>
    </main>
  );
}
