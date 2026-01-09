import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Profilim | Studyom",
  description: "Hesap kimliği, tercihlerin ve rollerinin özetini görüntüleyin.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as typeof session.user & {
    id?: string;
    email?: string | null;
  };

  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  const userId = dbUser?.id;
  const userEmail = (dbUser?.email ?? sessionUser.email)?.toLowerCase() ?? null;
  const [teacherApp, producerApp, googleAccount] = userId
    ? await Promise.all([
        prisma.teacherApplication.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { status: true },
        }),
        getProducerApplicationStatus(userId),
        prisma.account.findFirst({
          where: { userId, provider: "google" },
          select: { id: true },
        }),
      ])
    : [null, null, null];

  const [studioCount, studioActiveCount] = userEmail
    ? await Promise.all([
        prisma.studio.count({
          where: { ownerEmail: { equals: userEmail, mode: "insensitive" } },
        }),
        prisma.studio.count({
          where: { ownerEmail: { equals: userEmail, mode: "insensitive" }, isActive: true },
        }),
      ])
    : [0, 0];

  const mapStatus = (status?: string | null) => {
    if (status === "approved") return "approved" as const;
    if (status === "pending") return "pending" as const;
    return "none" as const;
  };
  const teacherStatus = teacherApp ? mapStatus(teacherApp.status) : dbUser?.isTeacher ? "pending" : "none";
  const producerStatus = producerApp ? mapStatus(producerApp.status) : dbUser?.isProducer ? "pending" : "none";

  return (
    <ProfileClient
      user={{
        fullName: dbUser?.fullName || dbUser?.name || session.user.name || session.user.email || "",
        email: dbUser?.email || session.user.email || "",
        phone: dbUser?.phone || "",
        city: dbUser?.city || "",
        intent: dbUser?.intent || [],
        emailVerified: Boolean(dbUser?.emailVerified) || Boolean(googleAccount),
        createdAt: dbUser?.createdAt ?? null,
        image: dbUser?.image ?? null,
        roles: {
          teacher: teacherStatus,
          producer: producerStatus,
          studio:
            studioActiveCount > 0
              ? "approved"
              : studioCount > 0 || dbUser?.isStudioOwner
                ? "pending"
                : "none",
        },
      }}
    />
  );
}

async function getProducerApplicationStatus(userId: string): Promise<{ status: string } | null> {
  try {
    const rows = await prisma.$queryRaw<{ status: string }[]>`
      SELECT status FROM "ProducerApplication"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (err) {
    console.error("producer application lookup failed", err);
    return null;
  }
}
