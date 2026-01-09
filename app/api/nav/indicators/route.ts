import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (!sessionUser?.id && !sessionUser?.email) {
    return NextResponse.json({
      notificationsUnread: false,
      messagesUnread: false,
      teacherPanelUnread: false,
      producerPanelUnread: false,
      studioPanelUnread: false,
    });
  }

  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  const userEmail = dbUser?.email ?? sessionUser.email ?? null;
  const userId = dbUser?.id ?? sessionUser.id ?? null;

  const notificationCount = userEmail
    ? await prisma.notification.count({
        where: {
          studio: { ownerEmail: userEmail },
          isRead: false,
          OR: [
            { message: { contains: "rezervasyon", mode: "insensitive" } },
            { message: { contains: "talep", mode: "insensitive" } },
          ],
        },
      })
    : 0;
  const leadCount = userEmail
    ? await prisma.lead.count({
        where: { email: userEmail, isRead: false, status: "new" },
      })
    : 0;
  const teacherLeadCount = userEmail
    ? await prisma.teacherLead.count({
        where: { studentEmail: userEmail, isRead: false, status: "new" },
      })
    : 0;
  const producerStudioLinkCount = userEmail
    ? await prisma.producerStudioLink.count({
        where: { studio: { ownerEmail: userEmail }, status: "pending", isRead: false },
      })
    : 0;
  const teacherRequestCount = userId
    ? await prisma.teacherMessageRequest.count({
        where: { teacherUserId: userId, status: "pending" },
      })
    : 0;
  const studentTeacherMessagesCount = userId
    ? await prisma.teacherMessage.count({
        where: {
          senderRole: "teacher",
          readAt: null,
          thread: { studentUserId: userId },
        },
      })
    : 0;
  const studentTeacherRequestCount = userId
    ? await prisma.teacherMessageRequest.count({
        where: { studentUserId: userId, status: "pending" },
      })
    : 0;
  const producerOutgoingCount = userId
    ? await prisma.producerMessageRequest.count({
        where: { fromUserId: userId, status: "pending" },
      })
    : 0;
  const teacherUnreadCount = userId
    ? await prisma.teacherMessage.count({
        where: {
          senderRole: "student",
          readAt: null,
          thread: { teacherUserId: userId },
        },
      })
    : 0;
  const producerRequestCount = userId
    ? await prisma.producerMessageRequest.count({
        where: { producerUserId: userId, status: "pending" },
      })
    : 0;
  const producerStudentUnreadCount = userId
    ? await prisma.producerMessage.count({
        where: {
          senderRole: "producer",
          readAt: null,
          thread: { studentUserId: userId },
        },
      })
    : 0;
  const producerUnreadCount = userId
    ? await prisma.producerMessage.count({
        where: {
          senderRole: "student",
          readAt: null,
          thread: { producerUserId: userId },
        },
      })
    : 0;
  const studioStudentUnreadCount = userId
    ? await prisma.studioMessage.count({
        where: {
          senderRole: "studio",
          readAt: null,
          thread: { studentUserId: userId },
        },
      })
    : 0;
  const studioOwnerUnreadCount = userEmail
    ? await prisma.studioMessage.count({
        where: {
          senderRole: "student",
          readAt: null,
          thread: { studio: { ownerEmail: userEmail } },
        },
      })
    : 0;
  const reservationUserUnreadCount = userId || userEmail
    ? await prisma.studioReservationRequest.count({
        where: {
          userUnread: true,
          OR: [
            userId ? { studentUserId: userId } : undefined,
            userEmail ? { requesterEmail: userEmail } : undefined,
          ].filter(Boolean) as { studentUserId?: string; requesterEmail?: string }[],
        },
      })
    : 0;
  const reservationStudioPendingCount = userEmail
    ? await prisma.studioReservationRequest.count({
        where: {
          studioUnread: true,
          studio: { ownerEmail: userEmail },
        },
      })
    : 0;

  return NextResponse.json({
    notificationsUnread:
      notificationCount + leadCount + teacherLeadCount + producerStudioLinkCount + reservationUserUnreadCount > 0,
    messagesUnread:
      studentTeacherMessagesCount +
        studentTeacherRequestCount +
        producerOutgoingCount +
        producerStudentUnreadCount +
        studioStudentUnreadCount +
        studioOwnerUnreadCount >
      0,
    teacherPanelUnread: teacherRequestCount + teacherUnreadCount > 0,
    producerPanelUnread: producerRequestCount + producerUnreadCount > 0,
    studioPanelUnread: studioOwnerUnreadCount + reservationStudioPendingCount > 0,
  });
}
