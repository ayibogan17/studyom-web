import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Stüdyo Dashboard | Studyom",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const search = await searchParams;
  const tabParam =
    typeof search?.tab === "string"
      ? search.tab
      : Array.isArray(search?.tab)
        ? search.tab[0]
        : null;

  if (!session?.user) {
    redirect("/login");
  }

  const email = session.user.email?.toLowerCase();
  if (!email) {
    redirect("/login");
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: {
      id: true,
      calendarSettings: { select: { bookingApprovalMode: true } },
    },
  });

  const reservationRequests = studio
    ? await prisma.studioReservationRequest.findMany({
        where: {
          studioId: studio.id,
          status: { in: ["pending", "approved"] },
        },
        include: {
          room: { select: { name: true } },
          studentUser: { select: { image: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      })
    : [];

  const bookingApprovalMode = studio?.calendarSettings?.bookingApprovalMode ?? "manual";
  const linkedTeachers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];
  const linkedProducers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];

  return (
    <DashboardClient
      initialStudio={undefined}
      reservationRequests={reservationRequests.map((req) => ({
        id: req.id,
        roomId: req.roomId,
        roomName: req.room?.name || "Oda",
        requesterName: req.requesterName,
        requesterPhone: req.requesterPhone,
        requesterEmail: req.requesterEmail ?? null,
        requesterImage: req.studentUser?.image ?? null,
        requesterIsAnon: !req.studentUserId,
        note: req.note ?? null,
        startAt: req.startAt.toISOString(),
        endAt: req.endAt.toISOString(),
        hours: req.hours,
        totalPrice: req.totalPrice ?? null,
        status: req.status,
        studioUnread: req.studioUnread,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        calendarBlockId: req.calendarBlockId ?? null,
      }))}
      bookingApprovalMode={bookingApprovalMode}
      initialTab={tabParam}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      emailVerified={Boolean((session.user as { emailVerified?: boolean }).emailVerified)}
      linkedTeachers={linkedTeachers}
      linkedProducers={linkedProducers}
    />
  );
}
