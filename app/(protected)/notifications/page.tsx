import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import NotificationsClient, {
  StudioRequestItem,
  ProducerStudioRequestItem,
} from "./notifications-client";

export const metadata: Metadata = {
  title: "Bildirimler | Studyom",
  description: "Stüdyo taleplerini görüntüleyin.",
  robots: { index: false, follow: false },
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
  const [studioRequests, producerStudioRequests] = await Promise.all([
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
    userEmail
      ? prisma.producerStudioLink.findMany({
          where: { studio: { ownerEmail: userEmail } },
          include: {
            studio: { select: { id: true, name: true } },
            producerUser: { select: { id: true, fullName: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  if (userEmail) {
    await Promise.all([
      prisma.teacherStudioLink.updateMany({
        where: { studio: { ownerEmail: userEmail }, isRead: false },
        data: { isRead: true },
      }),
      prisma.producerStudioLink.updateMany({
        where: { studio: { ownerEmail: userEmail }, isRead: false },
        data: { isRead: true },
      }),
    ]);
  }

  const studioRequestItems: StudioRequestItem[] = studioRequests.map((link) => ({
    id: link.id,
    status: link.status as StudioRequestItem["status"],
    createdAt: link.createdAt.toISOString(),
    studioName: link.studio.name,
    teacherName: link.teacherUser.fullName || link.teacherUser.name || link.teacherUser.email || "Hoca",
    teacherEmail: link.teacherUser.email,
  }));

  const producerRequestItems: ProducerStudioRequestItem[] = producerStudioRequests.map((link) => ({
    id: link.id,
    status: link.status as ProducerStudioRequestItem["status"],
    createdAt: link.createdAt.toISOString(),
    studioName: link.studio.name,
    producerName: link.producerUser.fullName || link.producerUser.name || link.producerUser.email || "Üretici",
    producerEmail: link.producerUser.email,
  }));

  return (
    <NotificationsClient studioRequests={studioRequestItems} producerRequests={producerRequestItems} />
  );
}
