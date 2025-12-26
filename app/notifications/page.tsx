import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import NotificationsClient, { NotificationItem, StudioRequestItem } from "./notifications-client";

export const metadata: Metadata = {
  title: "Bildirimler | Stüdyom",
  description: "Lead ve rezervasyon isteklerini görüntüleyin.",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as typeof session.user & {
    id?: string;
    email?: string | null;
    fullName?: string | null;
    name?: string | null;
  };

  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  const userEmail = dbUser?.email?.toLowerCase() ?? sessionUser.email?.toLowerCase() ?? null;

  const [studios, leads, teacherLeads, studioRequests] = await Promise.all([
    userEmail
      ? prisma.studio.findMany({
          where: { ownerEmail: userEmail },
          select: {
            id: true,
            name: true,
            notifications: {
              orderBy: { createdAt: "desc" },
              select: { id: true, message: true, createdAt: true, isRead: true },
            },
          },
        })
      : Promise.resolve([]),
    userEmail
      ? prisma.lead.findMany({
          where: { email: userEmail },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    userEmail
      ? prisma.teacherLead.findMany({
          where: { studentEmail: userEmail },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    userEmail
      ? prisma.teacherStudioLink.findMany({
          where: { studio: { ownerEmail: userEmail } },
          include: {
            studio: { select: { id: true, name: true } },
            teacherUser: { select: { id: true, fullName: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const reservationItems: NotificationItem[] = studios.flatMap((studio) =>
    studio.notifications
      .filter((note) => /rezervasyon|talep/i.test(note.message))
      .map((note) => ({
        id: note.id,
        kind: "reservation",
        title: studio.name || "Stüdyo",
        subtitle: "Rezervasyon isteği",
        message: note.message,
        createdAt: note.createdAt.toISOString(),
        status: note.isRead ? "read" : "unread",
      })),
  );

  const leadItems: NotificationItem[] = leads.map((lead) => ({
    id: lead.id,
    kind: "lead",
    title: "Lead",
    subtitle: lead.name || lead.email,
    message: lead.note || "Not girilmedi.",
    createdAt: lead.createdAt.toISOString(),
    status: lead.isRead || lead.status !== "new" ? "read" : "unread",
  }));

  const teacherLeadItems: NotificationItem[] = teacherLeads.map((lead) => ({
    id: lead.id,
    kind: "teacher-lead",
    title: "Öğretmen talebi",
    subtitle: lead.teacherName || lead.teacherSlug,
    message: lead.message,
    createdAt: lead.createdAt.toISOString(),
    status: lead.isRead || lead.status !== "new" ? "read" : "unread",
  }));

  const studioRequestItems: StudioRequestItem[] = studioRequests.map((link) => ({
    id: link.id,
    status: link.status as StudioRequestItem["status"],
    createdAt: link.createdAt.toISOString(),
    studioName: link.studio.name,
    teacherName: link.teacherUser.fullName || link.teacherUser.name || link.teacherUser.email || "Hoca",
    teacherEmail: link.teacherUser.email,
  }));

  const items = [...reservationItems, ...leadItems, ...teacherLeadItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return <NotificationsClient items={items} studioRequests={studioRequestItems} />;
}
