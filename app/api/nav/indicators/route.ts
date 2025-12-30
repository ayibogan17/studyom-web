import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (!sessionUser?.id && !sessionUser?.email) {
    return NextResponse.json({ notificationsUnread: false, messagesUnread: false });
  }

  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  const userEmail = dbUser?.email ?? sessionUser.email ?? null;
  const userId = dbUser?.id ?? sessionUser.id ?? null;

  const [
    notificationCount,
    leadCount,
    teacherLeadCount,
    producerStudioLinkCount,
    teacherRequestCount,
    studentTeacherMessagesCount,
    studentTeacherRequestCount,
    producerOutgoingCount,
    teacherUnreadCount,
    producerRequestCount,
    producerStudentUnreadCount,
    producerUnreadCount,
  ] = await Promise.all([
    userEmail
      ? prisma.notification.count({
          where: {
            studio: { ownerEmail: userEmail },
            isRead: false,
            OR: [
              { message: { contains: "rezervasyon", mode: "insensitive" } },
              { message: { contains: "talep", mode: "insensitive" } },
            ],
          },
        })
      : Promise.resolve(0),
    userEmail
      ? prisma.lead.count({
          where: { email: userEmail, isRead: false, status: "new" },
        })
      : Promise.resolve(0),
    userEmail
      ? prisma.teacherLead.count({
          where: { studentEmail: userEmail, isRead: false, status: "new" },
        })
      : Promise.resolve(0),
    userEmail
      ? prisma.producerStudioLink.count({
          where: { studio: { ownerEmail: userEmail }, status: "pending" },
        })
      : Promise.resolve(0),
    userId
      ? prisma.teacherMessageRequest.count({
          where: { teacherUserId: userId, status: "pending" },
        })
      : Promise.resolve(0),
    userId
      ? prisma.teacherMessage.count({
          where: {
            senderRole: "teacher",
            readAt: null,
            thread: { studentUserId: userId },
          },
        })
      : Promise.resolve(0),
    userId
      ? prisma.teacherMessageRequest.count({
          where: { studentUserId: userId, status: "pending" },
        })
      : Promise.resolve(0),
    userId
      ? prisma.producerMessageRequest.count({
          where: { fromUserId: userId, status: "pending" },
        })
      : Promise.resolve(0),
    userId
      ? prisma.teacherMessage.count({
          where: {
            senderRole: "student",
            readAt: null,
            thread: { teacherUserId: userId },
          },
        })
      : Promise.resolve(0),
    userId
      ? prisma.producerMessageRequest.count({
          where: { producerUserId: userId, status: "pending" },
        })
      : Promise.resolve(0),
    userId
      ? prisma.producerMessage.count({
          where: {
            senderRole: "producer",
            readAt: null,
            thread: { studentUserId: userId },
          },
        })
      : Promise.resolve(0),
    userId
      ? prisma.producerMessage.count({
          where: {
            senderRole: "student",
            readAt: null,
            thread: { producerUserId: userId },
          },
        })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    notificationsUnread: notificationCount + leadCount + teacherLeadCount + producerStudioLinkCount > 0,
    messagesUnread:
      studentTeacherMessagesCount +
        studentTeacherRequestCount +
        producerOutgoingCount +
        producerStudentUnreadCount >
      0,
    teacherPanelUnread: teacherRequestCount + teacherUnreadCount > 0,
    producerPanelUnread: producerRequestCount + producerUnreadCount > 0,
  });
}
