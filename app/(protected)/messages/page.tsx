import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { MessagesClient } from "./messages-client";

export const metadata: Metadata = {
  title: "Mesajlar | Studyom",
  description: "Hocalar, üreticiler ve stüdyolar ile mesajlarını görüntüle.",
  robots: { index: false, follow: false },
};

type SimpleUser = {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
};

function resolveName(user?: SimpleUser | null) {
  return user?.fullName || user?.name || user?.email || "Bilinmeyen";
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = await searchParams;
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

  const userEmail = dbUser.email?.toLowerCase() ?? sessionUser.email?.toLowerCase() ?? null;

  const [teacherThreads, teacherRequests, producerThreads, producerRequests, studioThreads, studioOwnerThreads, leads] = await Promise.all([
    prisma.teacherThread.findMany({
      where: { studentUserId: dbUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        teacherUser: { select: { fullName: true, name: true, email: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.teacherMessageRequest.findMany({
      where: { studentUserId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { teacherUser: { select: { fullName: true, name: true, email: true, image: true } } },
    }),
    prisma.producerThread.findMany({
      where: { studentUserId: dbUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        producerUser: { select: { fullName: true, name: true, email: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.producerMessageRequest.findMany({
      where: { fromUserId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { producerUser: { select: { fullName: true, name: true, email: true, image: true } } },
    }),
    prisma.studioThread.findMany({
      where: { studentUserId: dbUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        studio: { select: { name: true, slug: true, coverImageUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    userEmail
      ? prisma.studioThread.findMany({
          where: { studio: { ownerEmail: userEmail } },
          orderBy: { updatedAt: "desc" },
          include: {
            studio: { select: { name: true, slug: true, coverImageUrl: true } },
            studentUser: { select: { fullName: true, name: true, email: true, image: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        })
      : Promise.resolve([]),
    userEmail
      ? prisma.lead.findMany({
          where: { email: userEmail },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const teacherThreadItems = teacherThreads.map((thread) => ({
    id: thread.id,
    teacherSlug: thread.teacherSlug,
    teacherName: resolveName(thread.teacherUser),
    teacherImage: thread.teacherUser.image ?? null,
    lastMessage: thread.messages[0]?.body || "—",
    lastDate: formatDate(thread.messages[0]?.createdAt || thread.updatedAt),
    sortKey: new Date(thread.messages[0]?.createdAt || thread.updatedAt).getTime(),
  }));

  const teacherRequestItems = teacherRequests.map((req) => ({
    id: req.id,
    teacherSlug: req.teacherSlug,
    teacherName: resolveName(req.teacherUser),
    teacherImage: req.teacherUser.image ?? null,
    status: req.status,
    createdAt: formatDate(req.createdAt),
    messageText: req.messageText,
    sortKey: new Date(req.createdAt).getTime(),
  }));

  const producerThreadItems = producerThreads.map((thread) => ({
    id: thread.id,
    producerSlug: thread.producerSlug,
    producerName: resolveName(thread.producerUser),
    producerImage: thread.producerUser.image ?? null,
    lastMessage: thread.messages[0]?.body || "—",
    lastDate: formatDate(thread.messages[0]?.createdAt || thread.updatedAt),
    sortKey: new Date(thread.messages[0]?.createdAt || thread.updatedAt).getTime(),
  }));

  const producerRequestItems = producerRequests.map((req) => ({
    id: req.id,
    producerName: resolveName(req.producerUser),
    producerImage: req.producerUser.image ?? null,
    status: req.status,
    createdAt: formatDate(req.createdAt),
    messageText: req.message,
    sortKey: new Date(req.createdAt).getTime(),
  }));

  const studioThreadItems = studioThreads.map((thread) => ({
    id: thread.id,
    studioId: thread.studioId,
    studioName: thread.studio.name,
    studioSlug: thread.studio.slug ?? null,
    studioImage: thread.studio.coverImageUrl ?? null,
    lastMessage: thread.messages[0]?.body || "—",
    lastDate: formatDate(thread.messages[0]?.createdAt || thread.updatedAt),
    sortKey: new Date(thread.messages[0]?.createdAt || thread.updatedAt).getTime(),
  }));
  const studioOwnerThreadItems = studioOwnerThreads.map((thread) => ({
    id: thread.id,
    studioId: thread.studioId,
    studioName: thread.studio.name,
    studioSlug: thread.studio.slug ?? null,
    studioImage: thread.studentUser?.image ?? null,
    displayName: resolveName(thread.studentUser),
    context: thread.studio.name,
    ownerLink: `/dashboard/messages/${thread.id}`,
    lastMessage: thread.messages[0]?.body || "—",
    lastDate: formatDate(thread.messages[0]?.createdAt || thread.updatedAt),
    sortKey: new Date(thread.messages[0]?.createdAt || thread.updatedAt).getTime(),
  }));
  const studioThreadMap = new Map<string, (typeof studioThreadItems)[number]>();
  [...studioThreadItems, ...studioOwnerThreadItems].forEach((item) => {
    studioThreadMap.set(item.id, item);
  });
  const combinedStudioThreads = Array.from(studioThreadMap.values());

  const studioLeadItems = leads.map((lead) => ({
    id: lead.id,
    title: "Stüdyo talebi",
    subtitle: lead.name || lead.email,
    createdAt: formatDate(lead.createdAt),
    messageText: lead.note || "Mesaj bulunamadı.",
    sortKey: new Date(lead.createdAt).getTime(),
  }));

  const studioThreadParam =
    typeof search?.studioThread === "string"
      ? search.studioThread
      : Array.isArray(search?.studioThread)
        ? search?.studioThread[0]
        : null;
  const initialOpenKey = studioThreadParam ? `studio-chat:${studioThreadParam}` : null;

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Mesajlar</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Mesajlar</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Sohbetler ve ilk mesaj taleplerin burada.
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Hocalar, üreticiler ve stüdyolar ile yaptığın görüşmeleri burada takip edebilirsin.
          </p>
        </header>

        <MessagesClient
          teacherThreads={teacherThreadItems}
          teacherRequests={teacherRequestItems}
          producerThreads={producerThreadItems}
          producerRequests={producerRequestItems}
          studioThreads={combinedStudioThreads}
          studioLeads={studioLeadItems}
          routes={{ teachers: "/hocalar", production: "/uretim", studios: "/studyo" }}
          initialOpenKey={initialOpenKey}
        />
      </Section>
    </main>
  );
}
